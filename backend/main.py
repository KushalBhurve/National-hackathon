from fastapi import FastAPI, HTTPException, Body, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import uuid
import datetime
import json
import asyncio 
from dotenv import load_dotenv

load_dotenv()
from models import (
    DataSource, DashboardStats, ComplianceAlert, Topology, 
    ChatRequest, ChatResponse, FilterOptions, TechnicianInput, TaskInput, MachineInput, 
)
from data import DATA_SOURCES, STATS
import fitz  # PyMuPDF
from agent import graph_workflow, process_chat_query, get_knowledge_graph_filters, add_technician_to_graph, add_task_to_graph, add_machine_to_graph, graph
from work_order_agent import WorkOrderAssignmentAgent

app = FastAPI(title="FactoryOS Backend")

app.add_middleware( 
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GLOBAL_ALERTS = []
# Initialize Agent Runner Globally
agent_runner = WorkOrderAssignmentAgent()

@app.get("/")
async def root():
    return {"message": "FactoryOS Backend is running"}

@app.get("/api/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    return STATS

@app.get("/api/dashboard/sources", response_model=List[DataSource])
async def get_data_sources():
    return DATA_SOURCES

# --- HELPER: Write Work Order to Graph ---

def create_work_order_in_graph(wo_data: dict):
    """
    Writes a new WorkOrder node to Neo4j.
    CLEAN QUERY: No comments to avoid SyntaxErrors.
    """
    query = """
    MERGE (w:WorkOrder {id: $id})
    SET w.title = $title,
        w.description = $description,
        w.type = $type,
        w.priority = $priority,
        w.status = $status,
        w.required_skills = $required_skills,
        w.estimated_hours = $estimated_hours,
        w.created_at = $created_at,
        w.due_date = $due_date
    
    WITH w
    MERGE (m:Machinery {name: $machine_name})
    ON CREATE SET m.type = 'Robotics', m.criticality = 'Critical'
    MERGE (w)-[:TARGETS_EQUIPMENT]->(m)
    
    RETURN w
    """
    
    try:
        graph.query(query, wo_data)
        print(f" > SUCCESS: WorkOrder {wo_data['id']} seeded to Graph.")
        return True
    except Exception as e:
        print(f" > ERROR writing WorkOrder to Graph: {e}")
        return False

# --- Simulation & Agent Trigger Endpoint ---

@app.post("/api/simulation/log")
async def simulate_log_event():
    # Generate IDs and Timestamps
    log_id = str(uuid.uuid4())[:8]
    work_order_id = f"WO-{log_id}"
    now = datetime.datetime.now()
    due = now + datetime.timedelta(hours=4) 
    
    simulated_machine = "Robotic_Arm_KZ_200"
    
    # 1. Define the Work Order Data 
    wo_payload = {
        "id": work_order_id,
        "title": "Critical Overheat - Sensor Array B",
        "description": "Temperature sensor detected persistent spike > 95°C. Immediate inspection required.",
        "type": "Emergency Repair",
        "priority": "Critical",
        "status": "open",
        # Ensure 'L3' is in this list to match Arjun's 'L3' cert level
        "required_skills": ["Robotics", "L3"], 
        "estimated_hours": 4,
        "created_at": now.isoformat(),
        "due_date": due.isoformat(),
        "machine_name": simulated_machine
    }

    print(f"--- SIMULATION: Writing {work_order_id} to Graph ---")
    
    # 2. Write to Graph (This will now succeed)
    create_work_order_in_graph(wo_payload)

    # 3. Wait for Neo4j consistency
    print(" > Waiting for Graph consistency...")
    await asyncio.sleep(2) 

    try:
        # 4. Trigger the Agent
        result = await agent_runner.assign_work_order(work_order_id)
        
        # 5. Parse Result into an Alert
        rec_tech = result.get("recommended_technician", {})
        tech_name = rec_tech.get("name") if rec_tech else "Unassigned - Review Required"
        
        new_alert = {
            "id": log_id,
            "work_order_id": work_order_id,
            "title": wo_payload["title"],
            "status": "Open", 
            "severity": "Critical",
            "timestamp": now.strftime("%I:%M %p"),
            "machine": simulated_machine,
            "description": wo_payload["description"],
            "technician": tech_name,
            "recommendation": result.get("justification", "Analysis complete.")
        }
        
        GLOBAL_ALERTS.insert(0, new_alert)
        
        return {
            "status": "triggered", 
            "message": f"WorkOrder created and analyzed.",
            "alert": new_alert
        }
        
    except Exception as e:
        print(f"Agent Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ... (Rest of Endpoints) ...

@app.get("/api/compliance/alerts")
async def get_compliance_alerts():
    return GLOBAL_ALERTS

@app.post("/api/compliance/resolve/{alert_id}")
async def resolve_alert(alert_id: str):
    for alert in GLOBAL_ALERTS:
        if alert["id"] == alert_id:
            alert["status"] = "Resolved"
            alert["severity"] = "Low"
            return {"status": "success", "message": f"Alert {alert_id} resolved."}
    raise HTTPException(status_code=404, detail="Alert not found")

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

@app.post("/api/agent/chat", response_model=ChatResponse)
async def chat_agent(request: ChatRequest):
    return process_chat_query(request)

@app.get("/api/agent/filters", response_model=FilterOptions)
async def get_agent_filters():
    return get_knowledge_graph_filters()

@app.post("/api/resources/technician")
async def create_technician(tech: TechnicianInput):
    add_technician_to_graph(tech.dict())
    return {"status": "success"}

@app.post("/api/resources/task")
async def create_task(task: TaskInput):
    add_task_to_graph(task.dict())
    return {"status": "success"}

@app.post("/api/resources/machine")
async def create_machine(machine: MachineInput):
    add_machine_to_graph(machine.dict())
    return {"status": "success"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)