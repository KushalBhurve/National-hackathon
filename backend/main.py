from fastapi import FastAPI, HTTPException, Body, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import uuid
import datetime
import json
from dotenv import load_dotenv
import base64
from langchain_core.messages import HumanMessage
import traceback
import asyncio # You likely already have this
import logging
logger = logging.getLogger("uvicorn")

load_dotenv()
from models import (
    DataSource, 
    DashboardStats, 
    ComplianceAlert, 
    Topology, 
    ChatRequest, 
    ChatResponse, 
    FilterOptions, 
    TechnicianInput, 
    TaskInput, 
    MachineInput, 
)
from data import DATA_SOURCES, STATS
import fitz  # PyMuPDF
from agent import (
    graph_workflow, 
    process_chat_query, 
    get_knowledge_graph_filters, 
    add_technician_to_graph, 
    add_task_to_graph, 
    add_machine_to_graph, 
    graph, 
    get_graph_statistics, 
    llm)
from work_order_agent import WorkOrderAssignmentAgent
from pydantic import BaseModel


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
class WorkOrderDetail(BaseModel):
    id: str
    title: str
    description: str
    status: str
    priority: str
    type: str
    due_date: str
    required_skills: List[str]
    target_machine: str = "Unknown"
    assigned_technician: str = "Unassigned"
@app.get("/")
async def root():
    return {"message": "FactoryOS Backend is running"}

# @app.get("/api/dashboard/stats", response_model=DashboardStats)
# async def get_dashboard_stats():
#     return STATS

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
        logger.info(f" > SUCCESS: WorkOrder {wo_data['id']} seeded to Graph.")
        return True
    except Exception as e:
        logger.info(f" > ERROR writing WorkOrder to Graph: {e}")
        return False

# --- Simulation & Agent Trigger Endpoint ---

async def analyze_image_with_gpt4o(image_bytes):
    # Encode image to base64
    base64_image = base64.b64encode(image_bytes).decode('utf-8')
    
    # Create the payload for GPT-4o
    message = HumanMessage(
        content=[
            {"type": "text", "text": "Describe this technical diagram or machine part in extreme detail for a search index."},
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
        ]
    )
    
    # Invoke the model (using the LLM imported from agent.py)
    response = await llm.ainvoke([message])
    return f"\n[IMAGE DESCRIPTION]: {response.content}\n"

# Limit concurrent image analysis to 5 at a time to avoid Rate Limits
image_semaphore = asyncio.Semaphore(5)

async def safe_analyze_image(image_bytes):
    async with image_semaphore:
        try:
            return await analyze_image_with_gpt4o(image_bytes)
        except Exception as e:
            logger.info(f"Image analysis failed: {e}")
            return "" # Return empty string on failure so process continues

@app.post("/api/simulation/log")
async def simulate_log_event():
    # ... (UUID and Time generation remains same) ...
    log_id = str(uuid.uuid4())[:8]
    work_order_id = f"WO-{log_id}"
    now = datetime.datetime.now()
    due = now + datetime.timedelta(hours=4) 
    simulated_machine = "Robotic_Arm_KZ_200"
    
    # 1. Define the Work Order Data 
    # NOTE: "Sensor Array B" triggers the missing part logic in agent.py
    wo_payload = {
        "id": work_order_id,
        "title": "Critical Overheat - Sensor Array B",
        "description": "Temperature sensor detected persistent spike > 95°C. Sensor Array B replacement likely required.",
        "type": "Emergency Repair",
        "priority": "Critical",
        "status": "open",
        "required_skills": ["Robotics", "L3"], 
        "estimated_hours": 4,
        "created_at": now.isoformat(),
        "due_date": due.isoformat(),
        "machine_name": simulated_machine
    }

    # ... (Graph writing remains same) ...
    create_work_order_in_graph(wo_payload)
    await asyncio.sleep(2) 

    try:
        # 4. Trigger the Agent
        result = await agent_runner.assign_work_order(work_order_id)
        
        # 5. Parse Result into an Alert
        rec_tech = result.get("recommended_technician", {})
        
        # CHECK FOR PURCHASE ORDER
        purchase_order = result.get("purchase_order_id")
        
        if purchase_order:
            tech_name = "Purchase Order Pending"
            tech_role = "System"
            alert_status = "Supply Chain Hold"
            recommendation_text = f"Part Unavailable. {result.get('justification')}"
        else:
            tech_name = rec_tech.get("name") if rec_tech else "Unassigned"
            tech_role = "Technician"
            alert_status = "Open"
            recommendation_text = result.get("justification", "Analysis complete.")
        
        new_alert = {
            "id": log_id,
            "work_order_id": work_order_id,
            "title": wo_payload["title"],
            "status": alert_status, 
            "severity": "Critical",
            "timestamp": now.strftime("%I:%M %p"),
            "machine": simulated_machine,
            "description": wo_payload["description"],
            "technician": tech_name,
            "technician_role": tech_role, # Added field
            "purchase_order": purchase_order, # Added field
            "recommendation": recommendation_text
        }
        
        GLOBAL_ALERTS.insert(0, new_alert)
        
        return {
            "status": "triggered", 
            "message": f"WorkOrder analyzed. PO Generated: {purchase_order}",
            "alert": new_alert
        }
        
    except Exception as e:
        logger.info(f"Agent Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ... (Rest of Endpoints) ...

@app.get("/api/compliance/alerts")
async def get_compliance_alerts():
    return GLOBAL_ALERTS

@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    # Fetch real data from Neo4j
    graph_data = get_graph_statistics()
    
    # CRITICAL: Map the database keys to the Frontend keys
    return {
        "active_nodes": graph_data.get("active_nodes", 0),
        "uptime": "99.9%",  # Hardcoded or fetched from logs
        "manuals_processed": graph_data.get("manuals_ingested", 0), # Map 'ingested' -> 'processed'
        "vector_speed": graph_data.get("total_triples", 0),         # Map 'triples' -> 'speed'
        "data_sources": graph_data.get("data_sources", [])
    }

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
    logger.info(f"--- INGEST: Starting {file.filename} ---")
    start_time = datetime.datetime.now()
    
    pdf_bytes = await file.read()
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    
    # 1. Extract Text Immediately
    # getting text is fast, so we do it all at once
    full_text_content = []
    for page in doc:
        full_text_content.append(page.get_text())
    
    # 2. Collect Image Tasks (Do not await them yet!)
    image_tasks = []
    
    logger.info(" > Extracting images for parallel processing...")
    
    for page_index, page in enumerate(doc):
        image_list = page.get_images(full=True)
        
        for img_index, img in enumerate(image_list):
            xref = img[0]
            
            # --- OPTIMIZATION: Filter Small Images ---
            # img[2] is width, img[3] is height in PyMuPDF's get_images()
            width, height = img[2], img[3]
            if width < 300 or height < 300: 
                # Skip icons, logos, lines, bullets
                continue
            
            # Extract bytes only for valid images
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            
            # Create a coroutine task and add to list
            task = safe_analyze_image(image_bytes)
            image_tasks.append(task)

    logger.info(f" > Found {len(image_tasks)} valid images. analyzing concurrently...")

    # 3. Execute all Image Tasks in Parallel
    # This runs them all at the same time (up to the semaphore limit)
    image_descriptions = await asyncio.gather(*image_tasks)
    
    # 4. Combine Text and Image Descriptions
    final_text_context = "\n".join(full_text_content) + "\n" + "\n".join(image_descriptions)

    logger.info(f" > Content preparation took: {datetime.datetime.now() - start_time}")

    # 5. Enrich and Run Workflow
    enriched_content = f"Document Type: {manual_type}. Machinery: {machinery}. Content: {final_text_context}"

    # Use a Document object if you updated your agent.py as discussed previously,
    # otherwise pass the string 'enriched_content'
    from langchain_core.documents import Document
    doc_obj = Document(
        page_content=enriched_content, # or just use final_text_context depending on your parser
        metadata={
            "source": str(manual_type),
            "machinery": str(machinery),
            "filename": str(file.filename)
        }
    )

    result = graph_workflow.invoke({
        "documents": [doc_obj], # Passing object for better metadata handling
        "error_log": None
    })

    return {
        "status": "Success",
        "workflow_path": "Refactored" if result.get("error_log") == "refactored" else "Standard Ingest",
        "machinery_added": machinery,
        "images_processed": len(image_tasks)
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

@app.get("/api/graph/visualize")
async def get_full_graph_visualization():
    """
    Fetches the graph structure using explicit Cypher returns to avoid
    'dict object has no attribute labels' errors.
    """
    # We explicitly select ID, Labels, and Name/Title to ensure we get them
    query = """
    MATCH (n)-[r]->(m)
    RETURN 
        elementId(n) AS source_id,
        labels(n) AS source_labels,
        coalesce(n.name, n.title, n.description, "Unknown Node") AS source_name,
        
        type(r) AS rel_type,
        
        elementId(m) AS target_id,
        labels(m) AS target_labels,
        coalesce(m.name, m.title, m.description, "Unknown Node") AS target_name
    LIMIT 300
    """
    
    try:
        results = graph.query(query)
        
        nodes = {}
        links = []
        
        for record in results:
            # --- 1. Process Source Node ---
            s_id = record['source_id']
            if s_id not in nodes:
                lbls = record['source_labels']
                nodes[s_id] = {
                    "id": s_id,
                    "name": record['source_name'][:20], # Truncate long names
                    "label": lbls[0] if lbls else "Node",
                    "color": get_color_for_labels(lbls),
                    "val": 5 if "Machinery" in lbls else 3
                }

            # --- 2. Process Target Node ---
            t_id = record['target_id']
            if t_id not in nodes:
                lbls = record['target_labels']
                nodes[t_id] = {
                    "id": t_id,
                    "name": record['target_name'][:20],
                    "label": lbls[0] if lbls else "Node",
                    "color": get_color_for_labels(lbls),
                    "val": 5 if "Machinery" in lbls else 3
                }

            # --- 3. Add Link ---
            links.append({
                "source": s_id,
                "target": t_id,
                "type": record['rel_type']
            })
            
        return {
            "nodes": list(nodes.values()),
            "links": links
        }
        
    except Exception as e:
        logger.info(f"Visualization Error: {e}")
        # traceback.logger.info_exc() # Uncomment to see full error in terminal
        return {"nodes": [], "links": []}

# --- Helper Function for Colors ---
def get_color_for_labels(labels):
    if "Machinery" in labels: return "#22d3ee"      # Cyan
    if "Technician" in labels: return "#a78bfa"     # Purple
    if "Task" in labels: return "#facc15"           # Yellow
    if "WorkOrder" in labels: return "#f87171"      # Red
    if "DocumentChunk" in labels: return "#34d399"  # Emerald
    return "#888888" # Default Gray


@app.get("/api/workorder/{work_order_id}", response_model=WorkOrderDetail)
async def get_work_order_details(work_order_id: str):
    """
    Fetches live WorkOrder node details directly from Neo4j.
    """
    query = """
    MATCH (w:WorkOrder {id: $wo_id})
    OPTIONAL MATCH (w)-[:TARGETS_EQUIPMENT]->(m)
    OPTIONAL MATCH (t:Technician)-[:ASSIGNED_TO]->(w)
    RETURN w, m.name as machine, t.name as technician
    """
    
    try:
        results = graph.query(query, {"wo_id": work_order_id})
        
        if not results:
            raise HTTPException(status_code=404, detail="Work Order not found in Graph")
            
        record = results[0]
        node = record['w']
        
        return {
            "id": node.get('id'),
            "title": node.get('title'),
            "description": node.get('description'),
            "status": node.get('status'),
            "priority": node.get('priority'),
            "type": node.get('type'),
            "due_date": node.get('due_date'),
            # Handle Neo4j list or fallback
            "required_skills": node.get('required_skills') if isinstance(node.get('required_skills'), list) else [],
            "target_machine": record.get('machine') or "Unknown",
            "assigned_technician": record.get('technician') or "Unassigned"
        }
    except Exception as e:
        logger.info(f"Graph Fetch Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)