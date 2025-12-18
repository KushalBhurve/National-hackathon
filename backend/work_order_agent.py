"""
Work Order Assignment Agent - Updated with Inventory Check & Purchase Order
"""
from typing import Dict, List, Any, TypedDict, Annotated
from operator import add
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
import os
import logging
import httpx
import json
from kg_engine import ManufacturingKGQueryEngine

logger = logging.getLogger(__name__)

# --- STATE DEFINITION ---
class WorkOrderAgentState(TypedDict):
    messages: Annotated[list, add]
    work_order_id: str
    work_order_context: Dict[str, Any]
    # New Fields
    part_required: str
    part_available: bool
    purchase_order_id: str
    # Existing Fields
    qualified_technicians: List[Dict[str, Any]]
    recommended_technician: Dict[str, Any]
    justification: str
    risk_factors: List[str]
    compliance_checks: Dict[str, bool]
    errors: List[str]
    reasoning_steps: List[str]

# --- NODES ---

def retrieve_work_order_context(state: WorkOrderAgentState) -> WorkOrderAgentState:
    # (Same as before, simplified for brevity)
    kg = ManufacturingKGQueryEngine()
    context = kg.get_workorder_context(state['work_order_id'])
    state['work_order_context'] = context
    
    # Extract the part from description (Simple heuristic for simulation)
    desc = context.get('work_order', {}).get('description', '').lower()
    if "sensor array" in desc:
        state['part_required'] = "Sensor Array B"
    else:
        state['part_required'] = None
        
    state['reasoning_steps'].append("Context loaded. Identifying required parts...")
    return state

def check_spare_parts_inventory(state: WorkOrderAgentState) -> WorkOrderAgentState:
    """
    Checks if the required part exists in the Inventory Graph.
    """
    part = state.get('part_required')
    
    if not part:
        state['part_available'] = True # No specific part needed, proceed
        return state

    logger.info(f"Checking inventory for: {part}")
    
    # --- SIMULATION LOGIC: The user stated nodes are NOT present ---
    # In a real scenario, we would run: kg.check_inventory(part)
    # Here we simulate 'False' for "Sensor Array B"
    
    if part == "Sensor Array B":
        state['part_available'] = False
        state['reasoning_steps'].append(f"INVENTORY ALERT: '{part}' not found in stock.")
    else:
        state['part_available'] = True
        
    return state

def generate_purchase_order(state: WorkOrderAgentState) -> WorkOrderAgentState:
    """
    Generates a PO instead of assigning a tech.
    """
    import uuid
    po_id = f"PO-{str(uuid.uuid4())[:8].upper()}"
    state['purchase_order_id'] = po_id
    
    state['justification'] = (
        f"CRITICAL RESOURCE SHORTAGE: Required component '{state['part_required']}' "
        f"is out of stock. Technician assignment halted. "
        f"Purchase Order {po_id} has been automatically generated."
    )
    
    # Set a flag for the frontend to recognize
    state['recommended_technician'] = {"name": "Purchase Order", "role": "System Automation"}
    
    return state

def find_qualified_technicians(state: WorkOrderAgentState) -> WorkOrderAgentState:
    # Only runs if parts are available
    kg = ManufacturingKGQueryEngine()
    technicians = kg.find_qualified_technicians_for_workorder(state['work_order_id'])
    state['qualified_technicians'] = technicians
    return state

def validate_compliance(state: WorkOrderAgentState) -> WorkOrderAgentState:
    techs_available = len(state['qualified_technicians']) > 0
    state['compliance_checks'] = {"technicians_available": techs_available}
    return state

def rank_technicians_with_llm(state: WorkOrderAgentState) -> WorkOrderAgentState:
    if not state['qualified_technicians']: return state
    # (Existing LLM Logic here)
    # For simulation speed, just picking first
    state['recommended_technician'] = state['qualified_technicians'][0]
    state['justification'] = "Technician selected based on availability and skills."
    return state

def analyze_risk_factors(state: WorkOrderAgentState) -> WorkOrderAgentState:
    if state.get('purchase_order_id'):
        state['risk_factors'].append("Downtime extended due to supply chain.")
    return state

# --- ROUTING LOGIC ---

def route_inventory_check(state):
    if state.get('part_available') is False:
        return "generate_po"
    return "find_technicians"

# --- BUILDER ---
def build_work_order_workflow() -> StateGraph:
    workflow = StateGraph(WorkOrderAgentState)
    
    workflow.add_node("retrieve_context", retrieve_work_order_context)
    workflow.add_node("check_inventory", check_spare_parts_inventory)
    workflow.add_node("generate_po", generate_purchase_order)
    workflow.add_node("find_technicians", find_qualified_technicians)
    workflow.add_node("validate", validate_compliance)
    workflow.add_node("rank_technicians", rank_technicians_with_llm)
    workflow.add_node("analyze_risks", analyze_risk_factors)
    
    # Flow
    workflow.set_entry_point("retrieve_context")
    workflow.add_edge("retrieve_context", "check_inventory")
    
    # Conditional Split: Inventory Check
    workflow.add_conditional_edges(
        "check_inventory",
        route_inventory_check,
        {
            "generate_po": "generate_po",
            "find_technicians": "find_technicians"
        }
    )
    
    # PO Path
    workflow.add_edge("generate_po", "analyze_risks")
    
    # Technician Path
    workflow.add_edge("find_technicians", "validate")
    workflow.add_edge("validate", "rank_technicians")
    workflow.add_edge("rank_technicians", "analyze_risks")
    
    workflow.add_edge("analyze_risks", END)
    
    return workflow.compile()

class WorkOrderAssignmentAgent:
    def __init__(self):
        self.workflow = build_work_order_workflow()
    
    async def assign_work_order(self, work_order_id: str) -> Dict[str, Any]:
        initial = WorkOrderAgentState(
            messages=[], work_order_id=work_order_id, 
            part_required=None, part_available=None, purchase_order_id=None,
            qualified_technicians=[], recommended_technician={}, 
            justification="", risk_factors=[], compliance_checks={}, errors=[], reasoning_steps=[]
        )
        final = await self.workflow.ainvoke(initial)
        return final