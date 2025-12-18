""""
Work Order Assignment Agent - Scenario 1 (Strict Mode: No Fallback, No Facility)
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

# UPDATED PROMPT: Removed Facility Context
WORK_ORDER_ASSIGNMENT_PROMPT = ChatPromptTemplate.from_template("""
You are a FactoryOS Resource Manager. 
Based on the data below, select exactly ONE technician name.

WORK ORDER: {work_order_title}
EQUIPMENT: {equipment_name}
CANDIDATES: {qualified_technicians}

INSTRUCTIONS:
- Respond with the data regarding the technician, like name,certification, etc.
- Do not include reasoning, headers, or any other text.
- If multiple are qualified, pick the first one.

NAME:""")

logger = logging.getLogger(__name__)

class WorkOrderAgentState(TypedDict):
    messages: Annotated[list, add]
    work_order_id: str
    consider_workload: bool
    work_order_context: Dict[str, Any]
    qualified_technicians: List[Dict[str, Any]]
    recommended_technician: Dict[str, Any]
    justification: str
    alternative_candidates: List[Dict[str, Any]]
    risk_factors: List[str]
    compliance_checks: Dict[str, bool]
    errors: List[str]
    reasoning_steps: List[str]

# --- NODES ---

def retrieve_work_order_context(state: WorkOrderAgentState) -> WorkOrderAgentState:
    logger.info(f"Retrieving work order context: {state['work_order_id']}")
    try:
        kg = ManufacturingKGQueryEngine()
        context = kg.get_workorder_context(state['work_order_id'])
        
        # STRICT MODE: No Fallback
        if not context:
            error_msg = f"Work Order {state['work_order_id']} not found in Knowledge Graph."
            state['errors'].append(error_msg)
            state['reasoning_steps'].append("Context retrieval failed: Data missing in Graph.")
            return state
        
        state['work_order_context'] = context
        state['reasoning_steps'].append("Context loaded successfully from Graph.")
    except Exception as e:
        state['errors'].append(f"Context retrieval error: {str(e)}")
    return state

def find_qualified_technicians(state: WorkOrderAgentState) -> WorkOrderAgentState:
    logger.info("Finding qualified technicians (Global Search)")
    try:
        kg = ManufacturingKGQueryEngine()
        technicians = kg.find_qualified_technicians_for_workorder(state['work_order_id'])
        
        # STRICT MODE: No Fallback
        state['qualified_technicians'] = technicians
        
        if not technicians:
             state['reasoning_steps'].append("No qualified technicians found in Graph.")
        else:
             state['reasoning_steps'].append(f"Found {len(technicians)} technicians globally via KG.")
             
    except Exception as e:
        state['errors'].append(f"Technician search failed: {str(e)}")
    return state

def validate_compliance(state: WorkOrderAgentState) -> WorkOrderAgentState:
    techs_available = len(state['qualified_technicians']) > 0
    state['compliance_checks'] = {"technicians_available": techs_available}
    
    if not techs_available: 
        state['errors'].append("Compliance Failure: No qualified technicians available in database.")
    
    return state

def rank_technicians_with_llm(state: WorkOrderAgentState) -> WorkOrderAgentState:
    if not state['qualified_technicians']: return state
    try:
        client = httpx.Client(verify=False) 
        llm = ChatOpenAI( 
            base_url="https://genailab.tcs.in",
            model = "azure/genailab-maas-gpt-4o", 
            http_client = client,
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
        wo_ctx = state['work_order_context']
        
        prompt = WORK_ORDER_ASSIGNMENT_PROMPT.format(
            work_order_id=state['work_order_id'],
            work_order_title=wo_ctx.get('work_order', {}).get('title', 'N/A'),
            work_order_description=wo_ctx.get('work_order', {}).get('description', 'N/A'),
            equipment_name=wo_ctx.get('equipment', {}).get('name', 'N/A'),
            equipment_type=wo_ctx.get('equipment', {}).get('type', 'N/A'),
            qualified_technicians=json.dumps(state['qualified_technicians'], indent=2),
            consider_workload=state['consider_workload']
        )
        
        response = llm.invoke(prompt)
        state['justification'] = response.content
        
        # Assumption: LLM approves the first candidate in the filtered list
        if state['qualified_technicians']:
            state['recommended_technician'] = state['qualified_technicians'][0]
            state['reasoning_steps'].append("AI Ranking Complete.")
            
    except Exception as e:
        state['errors'].append(f"AI ranking failed: {str(e)}")
    return state

def format_recommendation(state: WorkOrderAgentState) -> WorkOrderAgentState:
    if state['errors']:
         state['justification'] = "Process Halted: " + "; ".join(state['errors'])
    return state

def analyze_risk_factors(state: WorkOrderAgentState) -> WorkOrderAgentState:
    # Simplified risk logic
    if len(state['qualified_technicians']) < 2:
        state['risk_factors'].append("Low staff availability")
    return state

# --- ROUTING ---
def should_continue_after_retrieval(state): 
    return "format" if state['errors'] else "find_technicians"

def should_continue_after_validation(state): 
    # If no technicians found (validation failed), skip to analyze/format (alerts user)
    return "analyze_risks" if not state['compliance_checks'].get('technicians_available') else "rank_technicians"

# --- BUILDER ---
def build_work_order_workflow() -> StateGraph:
    workflow = StateGraph(WorkOrderAgentState)
    workflow.add_node("retrieve_context", retrieve_work_order_context)
    workflow.add_node("find_technicians", find_qualified_technicians)
    workflow.add_node("validate", validate_compliance)
    workflow.add_node("rank_technicians", rank_technicians_with_llm)
    workflow.add_node("analyze_risks", analyze_risk_factors)
    workflow.add_node("format", format_recommendation)
    
    workflow.set_entry_point("retrieve_context")
    workflow.add_conditional_edges("retrieve_context", should_continue_after_retrieval, {"find_technicians": "find_technicians", "format": "format"})
    workflow.add_edge("find_technicians", "validate")
    workflow.add_conditional_edges("validate", should_continue_after_validation, {"rank_technicians": "rank_technicians", "analyze_risks": "analyze_risks"})
    workflow.add_edge("rank_technicians", "analyze_risks")
    workflow.add_edge("analyze_risks", "format")
    workflow.add_edge("format", END)
    
    return workflow.compile()

class WorkOrderAssignmentAgent:
    def __init__(self):
        self.workflow = build_work_order_workflow()
    
    async def assign_work_order(self, work_order_id: str) -> Dict[str, Any]:
        initial = WorkOrderAgentState(messages=[], work_order_id=work_order_id, consider_workload=True, work_order_context={}, qualified_technicians=[], recommended_technician={}, justification="", alternative_candidates=[], risk_factors=[], compliance_checks={}, errors=[], reasoning_steps=[])
        final = await self.workflow.ainvoke(initial)
        return final