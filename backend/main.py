from fastapi import FastAPI, HTTPException, Body, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()
from models import (
    DataSource, DashboardStats, ComplianceAlert, Topology, 
    ChatRequest, ChatResponse, ChatRequest, ChatResponse, FilterOptions
)
from data import DATA_SOURCES, STATS, COMPLIANCE_ALERTS
# REMOVED: TOPOLOGY import from data.py
from liquid_graph import graph_store

import fitz  # PyMuPDF
from agent import graph_workflow, process_chat_query, get_knowledge_graph_filters

app = FastAPI(title="FactoryOS Backend")

# Enable CORS for frontend interaction
app.add_middleware( 
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "FactoryOS Backend is running"}

# --- Dashboard Endpoints ---

@app.get("/api/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    return STATS

@app.get("/api/dashboard/sources", response_model=List[DataSource])
async def get_data_sources():
    return DATA_SOURCES

@app.get("/api/dashboard/topology", response_model=Topology)
async def get_topology_preview():
    # DYNAMIC: Fetch from Liquid Graph
    return graph_store.get_topology()

# --- Liquid Schema Ingestion Endpoint ---

@app.post("/api/ingest")
async def ingest_data(
    file: UploadFile = File(...), 
    machinery: str = Form(...), 
    manual_type: str = Form(...)
):
    # 1. Extract Text from PDF
    pdf_bytes = await file.read()
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = "".join([page.get_text() for page in doc])

    # 2. Enrich text with metadata so the Agent knows the context
    enriched_content = f"Document Type: {manual_type}. Machinery: {machinery}. Content: {text}"

    # 3. Run the Self-Healing LangGraph Workflow
    result = graph_workflow.invoke({
        "documents": [enriched_content],
        "error_log": None
    })

    return {
        "status": "Success",
        "workflow_path": "Refactored" if result["error_log"] == "refactored" else "Standard Ingest",
        "machinery_added": machinery
    }

# --- Compliance Endpoints ---

@app.get("/api/compliance/alerts", response_model=List[ComplianceAlert])
async def get_compliance_alerts():
    return COMPLIANCE_ALERTS

@app.post("/api/compliance/resolve/{alert_id}")
async def resolve_alert(alert_id: str):
    # Mock resolution logic
    for alert in COMPLIANCE_ALERTS:
        if alert.id == alert_id:
            alert.status = "Resolved"
            return {"status": "success", "message": f"Alert {alert_id} resolved."}
    raise HTTPException(status_code=404, detail="Alert not found")

# --- Agent / Chat Endpoint ---

@app.post("/api/agent/chat", response_model=ChatResponse)
async def chat_agent(request: ChatRequest):
    # Pass the whole request object (which now includes sources)
    response = process_chat_query(request)
    return response

@app.get("/api/agent/filters", response_model=FilterOptions)
async def get_agent_filters():
    """Fetch distinct machines and sources from the Knowledge Graph"""
    return get_knowledge_graph_filters()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)