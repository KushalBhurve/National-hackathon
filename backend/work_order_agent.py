"""
Work Order Assignment Agent - Scenario 1
Assigns work orders to qualified technicians with AI reasoning
Compatible with Dynamic Schema Liquid Graph
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

# IMPORT THE REFACTORED DYNAMIC ENGINE
from kg_engine import ManufacturingKGQueryEngine
from prompts.manufacturing_prompts import WORK_ORDER_ASSIGNMENT_PROMPT

logger = logging.getLogger(__name__)

# ============================================================
# State Definition
# ============================================================

class WorkOrderAgentState(TypedDict):
    """State for work order assignment workflow"""
    messages: Annotated[list, add]
    work_order_id: str
    consider_workload: bool
    work_order_context: Dict[str, Any]
    qualified_technicians: List[Dict[str, Any]]
    technician_rankings: List[Dict[str, Any]]
    recommended_technician: Dict[str, Any]
    justification: str
    alternative_candidates: List[Dict[str, Any]]
    risk_factors: List[str]
    compliance_checks: Dict[str, bool]
    errors: List[str]
    reasoning_steps: List[str]

# ============================================================
# Agent Nodes
# ============================================================

def retrieve_work_order_context(state: WorkOrderAgentState) -> WorkOrderAgentState:
    """
    Node 1: Retrieve work order context using Dynamic KG Engine
    """
    logger.info(f"Retrieving work order context: {state['work_order_id']}")
    
    try:
        # Initialize Dynamic Engine (No args needed, uses singletons)
        kg = ManufacturingKGQueryEngine()
        
        # Get work order context (Dynamic Cypher Generation happens here)
        context = kg.get_workorder_context(state['work_order_id'])
        
        if not context:
            state['errors'].append(f"Work order {state['work_order_id']} not found or schema mismatch.")
            return state
        
        state['work_order_context'] = context
        
        # Log reasoning
        wo_title = context.get('work_order', {}).get('title', 'Unknown Title')
        equip_name = context.get('equipment', {}).get('name', 'Unknown Equipment')
        state['reasoning_steps'].append(f"Context loaded for '{wo_title}' on equipment '{equip_name}'")
        
    except Exception as e:
        logger.error(f"Error retrieving work order context: {str(e)}")
        state['errors'].append(f"Failed to retrieve work order: {str(e)}")
    
    return state

def find_qualified_technicians(state: WorkOrderAgentState) -> WorkOrderAgentState:
    """
    Node 2: Find all qualified technicians using Dynamic KG Engine
    """
    logger.info("Finding qualified technicians")
    
    try:
        kg = ManufacturingKGQueryEngine()
        
        # Dynamic Graph Query to find techs based on CURRENT schema relationships
        technicians = kg.find_qualified_technicians_for_workorder(state['work_order_id'])
        
        state['qualified_technicians'] = technicians
        state['reasoning_steps'].append(
            f"Found {len(technicians)} qualified technician(s) matching current certification rules."
        )
        
    except Exception as e:
        logger.error(f"Error finding qualified technicians: {str(e)}")
        state['errors'].append(f"Failed to find technicians: {str(e)}")
    
    return state

def validate_compliance(state: WorkOrderAgentState) -> WorkOrderAgentState:
    """
    Node 3: Validate compliance and safety requirements
    """
    logger.info("Validating compliance requirements")
    
    # Robust checking against potentially dynamic dictionary keys
    context = state.get('work_order_context', {})
    
    compliance_checks = {
        "work_order_exists": bool(context.get('work_order')),
        "equipment_identified": bool(context.get('equipment')),
        "facility_identified": bool(context.get('facility')),
        "qualified_technicians_available": len(state['qualified_technicians']) > 0
    }
    
    state['compliance_checks'] = compliance_checks
    
    all_valid = all(compliance_checks.values())
    state['reasoning_steps'].append(
        f"Compliance validation: {'PASSED' if all_valid else 'FAILED'}"
    )
    
    if not compliance_checks['qualified_technicians_available']:
        state['errors'].append(
            "No qualified technicians found. Possible causes: Certification expiry or Schema Mismatch."
        )
    
    return state

def rank_technicians_with_llm(state: WorkOrderAgentState) -> WorkOrderAgentState:
    """
    Node 4: Use LLM to rank technicians and generate recommendation
    """
    logger.info("Ranking technicians with AI")
    
    if not state['qualified_technicians']:
        state['reasoning_steps'].append("Skipping ranking - no qualified technicians")
        return state
    
    try:
        # Use existing Singleton LLM if available, or initialize new client
        # Assuming we import 'llm' from agent.py or re-init here for safety
        client = httpx.Client(verify=False) 
        llm = ChatOpenAI( 
            base_url="https://genailab.tcs.in",
            model = "azure/genailab-maas-gpt-4o", 
            http_client = client 
        )
        
        # Prepare context for LLM
        wo_context = state['work_order_context']
        work_order = wo_context.get('work_order', {})
        equipment = wo_context.get('equipment', {})
        facility = wo_context.get('facility', {})
        
        prompt = WORK_ORDER_ASSIGNMENT_PROMPT.format(
            work_order_id=state['work_order_id'],
            work_order_title=work_order.get('title', 'N/A'),
            work_order_description=work_order.get('description', 'N/A'),
            equipment_name=equipment.get('name', 'N/A'),
            equipment_type=equipment.get('type', 'N/A'),
            facility=facility.get('name', 'N/A'),
            qualified_technicians=json.dumps(state['qualified_technicians'], indent=2),
            consider_workload=state['consider_workload']
        )
        
        response = llm.invoke(prompt)
        response_text = response.content
        
        state['reasoning_steps'].append("AI ranking analysis complete")
        
        # Basic parsing of the LLM response (in prod, use structured output parser)
        # For this logic, we assume the LLM recommendation aligns with the list
        if state['qualified_technicians']:
            state['recommended_technician'] = state['qualified_technicians'][0]
            state['alternative_candidates'] = state['qualified_technicians'][1:3]
            state['justification'] = response_text
        
    except Exception as e:
        logger.error(f"Error in LLM ranking: {str(e)}")
        state['errors'].append(f"AI ranking failed: {str(e)}")
        
        # Fallback
        if state['qualified_technicians']:
            state['recommended_technician'] = state['qualified_technicians'][0]
            state['justification'] = "Fallback selection based on KG qualification match."

    return state

def analyze_risk_factors(state: WorkOrderAgentState) -> WorkOrderAgentState:
    """
    Node 5: Analyze potential risk factors
    """
    logger.info("Analyzing risk factors")
    
    risk_factors = []
    
    # Context extraction
    wo = state['work_order_context'].get('work_order', {})
    equipment = state['work_order_context'].get('equipment', {})
    
    # Priority Check
    if str(wo.get('priority')).lower() in ['high', 'critical']:
        risk_factors.append("High priority work order - ensure timely completion")
    
    # Criticality Check
    if str(equipment.get('criticality')).lower() == 'critical':
        risk_factors.append("Critical equipment - minimize downtime")
    
    # Resource Pool Check
    if len(state['qualified_technicians']) <= 2:
        risk_factors.append("Limited qualified technician pool - schedule carefully")
    
    state['risk_factors'] = risk_factors
    
    # VISUAL TRIGGER: If risks exist, show a risk matrix
    if risk_factors:
        state['reasoning_steps'].append(f"Identified {len(risk_factors)} risk factors. ")
    else:
        state['reasoning_steps'].append("No significant risks identified.")
    
    return state

def format_recommendation(state: WorkOrderAgentState) -> WorkOrderAgentState:
    """
    Node 6: Format final recommendation
    """
    logger.info("Formatting recommendation")
    
    if state['errors']:
        state['justification'] = "Assignment blocked: " + "; ".join(state['errors'])
        state['recommended_technician'] = {}
        state['alternative_candidates'] = []
    else:
        # VISUAL TRIGGER: Show decision matrix if we have a successful recommendation
        # This helps the user understand the 'Why' behind the selection
        state['justification'] += "\n\n"
        
        # VISUAL TRIGGER: If equipment context is rich, show the equipment diagram
        equipment = state['work_order_context'].get('equipment', {})
        equip_type = equipment.get('type', 'Industrial Equipment')
        state['justification'] += f"\n\nReference: "

    state['reasoning_steps'].append("Recommendation formatted.")
    
    return state

# ============================================================
# Conditional Routing
# ============================================================

def should_continue_after_retrieval(state: WorkOrderAgentState) -> str:
    if state['errors']:
        return "format"
    return "find_technicians"

def should_continue_after_validation(state: WorkOrderAgentState) -> str:
    if not state['compliance_checks'].get('qualified_technicians_available'):
        return "analyze_risks"
    return "rank_technicians"

# ============================================================
# Build Workflow
# ============================================================

def build_work_order_workflow() -> StateGraph:
    workflow = StateGraph(WorkOrderAgentState)
    
    workflow.add_node("retrieve_context", retrieve_work_order_context)
    workflow.add_node("find_technicians", find_qualified_technicians)
    workflow.add_node("validate", validate_compliance)
    workflow.add_node("rank_technicians", rank_technicians_with_llm)
    workflow.add_node("analyze_risks", analyze_risk_factors)
    workflow.add_node("format", format_recommendation)
    
    workflow.set_entry_point("retrieve_context")
    
    workflow.add_conditional_edges(
        "retrieve_context",
        should_continue_after_retrieval,
        {"find_technicians": "find_technicians", "format": "format"}
    )
    
    workflow.add_edge("find_technicians", "validate")
    
    workflow.add_conditional_edges(
        "validate",
        should_continue_after_validation,
        {"rank_technicians": "rank_technicians", "analyze_risks": "analyze_risks"}
    )
    
    workflow.add_edge("rank_technicians", "analyze_risks")
    workflow.add_edge("analyze_risks", "format")
    workflow.add_edge("format", END)
    
    return workflow.compile()

# ============================================================
# Agent Class
# ============================================================

class WorkOrderAssignmentAgent:
    def __init__(self):
        self.workflow = build_work_order_workflow()
    
    async def assign_work_order(self, work_order_id: str, consider_workload: bool = True) -> Dict[str, Any]:
        initial_state = WorkOrderAgentState(
            messages=[],
            work_order_id=work_order_id,
            consider_workload=consider_workload,
            work_order_context={},
            qualified_technicians=[],
            technician_rankings=[],
            recommended_technician={},
            justification="",
            alternative_candidates=[],
            risk_factors=[],
            compliance_checks={},
            errors=[],
            reasoning_steps=[]
        )
        
        final_state = await self.workflow.ainvoke(initial_state)
        
        return {
            "recommended_technician": final_state["recommended_technician"],
            "justification": final_state["justification"],
            "alternative_candidates": final_state["alternative_candidates"],
            "risk_factors": final_state["risk_factors"],
            "compliance_checks": final_state["compliance_checks"],
            "reasoning_steps": final_state["reasoning_steps"],
            "errors": final_state["errors"]
        }