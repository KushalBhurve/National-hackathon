"""
Work Order Assignment Agent - Agentic RAG with Reasoning Loop & Recursion Limits
"""
from typing import Dict, List, Any, TypedDict, Literal
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
import os
import logging
import httpx
import json

try:
    from kg_engine import ManufacturingKGQueryEngine
except ImportError:
    # Dummy mock for demonstration if file is missing
    class ManufacturingKGQueryEngine:
        def get_workorder_context(self, wo_id): return {"id": wo_id, "title": "Fix Pump", "type": "Hydraulic"}
        def find_qualified_technicians_for_workorder(self, wo_id): return [] # Return empty list to trigger loop

# --- CONFIGURATION ---
# 1. Small Model: Fast, cheap, follows instructions (for query building & prompting)
SMALL_LLM_MODEL = "azure/genailab-maas-gpt-4o-mini" 

# 2. Reasoning Model: High intelligence (for critiquing the retrieved data)
REASONING_LLM_MODEL = "azure_ai/genailab-maas-DeepSeek-R1" 

MAX_RETRIES = 3 # Logical limit for the feedback loop

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- STATE DEFINITION ---
class WorkOrderAgentState(TypedDict):
    # Core Data
    work_order_id: str
    work_order_context: Dict[str, Any]
    qualified_technicians: List[Dict[str, Any]]
    final_output: str
    errors: List[str]
    
    # Loop & Reasoning Data
    search_query: str
    search_parameters: Dict[str, Any]
    generated_prompt: str
    critique_feedback: str
    search_iteration: int
    is_sufficient: bool

# --- LLM FACTORY ---
def get_llm(model_name: str):
    """
    Factory function to create LLM clients.
    Using temperature=0 for deterministic behavior in logic nodes.
    """
    return ChatOpenAI(
        base_url="https://genailab.tcs.in",
        model=model_name,
        http_client=httpx.Client(verify=False),
        api_key=os.getenv("OPENAI_API_KEY"),
        temperature=0
    )

# --- NODES ---

def construct_query_node(state: WorkOrderAgentState) -> WorkOrderAgentState:
    """
    [Small LLM] Constructs retrieval strategy.
    Uses previous feedback to adjust parameters if this is a retry.
    """
    iteration = state.get('search_iteration', 0)
    logger.info(f"--- Node: Construct Query (Iteration {iteration + 1}) ---")
    
    llm = get_llm(SMALL_LLM_MODEL)
    
    # Inject feedback if this is a retry loop
    feedback_context = ""
    if state.get('critique_feedback'):
        feedback_context = f"""
        PREVIOUS ATTEMPT FAILED.
        Critique from Reasoning Engine: "{state['critique_feedback']}"
        ADJUST YOUR SEARCH PARAMETERS TO FIX THIS.
        """

    prompt = ChatPromptTemplate.from_template("""
    You are a Search Strategist for a Manufacturing Knowledge Graph.
    Goal: Find context and technicians for Work Order: {work_order_id}.
    
    {feedback_context}
    
    Output JSON with search parameters.
    Structure:
    {{
        "fetch_context": true,
        "include_busy_technicians": boolean,
        "reasoning": "string"
    }}
    """)
    
    chain = prompt | llm | JsonOutputParser()
    
    try:
        response = chain.invoke({
            "work_order_id": state['work_order_id'],
            "feedback_context": feedback_context
        })
        return {
            "search_parameters": response, 
            "search_iteration": iteration + 1
        }
    except Exception as e:
        logger.error(f"Query construction failed: {e}")
        # Default fallback params
        return {
            "search_parameters": {"fetch_context": True, "include_busy_technicians": True}, 
            "search_iteration": iteration + 1
        }

def retrieve_data_node(state: WorkOrderAgentState) -> WorkOrderAgentState:
    """
    [Tool Execution] Fetches data from KG/VectorDB based on parameters.
    """
    logger.info(f"--- Node: Retrieve Data ---")
    kg = ManufacturingKGQueryEngine()
    params = state.get('search_parameters', {})
    updates = {}
    
    try:
        # 1. Retrieve Context
        if params.get('fetch_context', True) or not state.get('work_order_context'):
            context = kg.get_workorder_context(state['work_order_id'])
            updates['work_order_context'] = context if context else {}

        # 2. Retrieve Technicians
        all_techs = kg.find_qualified_technicians_for_workorder(state['work_order_id'])
        
        # Apply filtering logic requested by the Strategist
        if not params.get('include_busy_technicians', False):
            filtered = [t for t in all_techs if t.get('status') == 'AVAILABLE']
            updates['qualified_technicians'] = filtered if filtered else all_techs # Fallback
        else:
            updates['qualified_technicians'] = all_techs
            
    except Exception as e:
        logger.error(f"Retrieval failed: {e}")
        return {"errors": [str(e)]}
        
    return updates

def prompt_generation_node(state: WorkOrderAgentState) -> WorkOrderAgentState:
    """
    [Small LLM] Assembles the final prompt using the retrieved data.
    """
    logger.info("--- Node: Generate Prompt ---")
    llm = get_llm(SMALL_LLM_MODEL)
    
    wo_ctx = state.get('work_order_context', {})
    techs = state.get('qualified_technicians', [])
    
    # Meta-Prompt: Asks the LLM to write a prompt for the Solver
    meta_prompt = ChatPromptTemplate.from_template("""
    You are a Prompt Engineer. 
    Construct a rigorous prompt for a Reasoning LLM to assign a technician.
    
    DATA:
    Work Order: {wo_ctx}
    Technicians: {techs}
    
    INSTRUCTIONS:
    Write a prompt that presents this data.
    If data is missing (e.g. empty technicians), explicitly ask the Reasoning LLM to state "INSUFFICIENT DATA".
    
    Output ONLY the constructed prompt string.
    """)
    
    response = meta_prompt.invoke({
        "wo_ctx": json.dumps(wo_ctx, indent=2), 
        "techs": json.dumps(techs, indent=2)
    })
    
    return {"generated_prompt": response.content}

def reasoning_critique_node(state: WorkOrderAgentState) -> WorkOrderAgentState:
    """
    [Reasoning LLM] Checks if the retrieved data is sufficient.
    """
    logger.info("--- Node: Reasoning Critique ---")
    llm = get_llm(REASONING_LLM_MODEL)
    
    critique_prompt = ChatPromptTemplate.from_template("""
    You are a Logic Reviewer.
    
    USER GOAL: Assign a technician to Work Order {work_order_id}.
    PROPOSED PROMPT FOR SOLVER:
    {generated_prompt}
    
    Analyze the PROPOSED PROMPT. 
    Does it contain enough information (Technical requirements AND a list of candidates) to make a valid assignment?
    
    Output JSON:
    {{
        "is_sufficient": boolean,
        "feedback": "Explain what is missing if false."
    }}
    """)
    
    chain = critique_prompt | llm | JsonOutputParser()
    
    try:
        response = chain.invoke({
            "work_order_id": state['work_order_id'],
            "generated_prompt": state['generated_prompt']
        })
        return {
            "is_sufficient": response['is_sufficient'],
            "critique_feedback": response.get('feedback', "")
        }
    except Exception as e:
        logger.error(f"Critique failed: {e}")
        # Default to False to trigger retry unless we are out of retries
        return {"is_sufficient": False, "critique_feedback": "JSON parsing error in critique."}

def final_answer_node(state: WorkOrderAgentState) -> WorkOrderAgentState:
    """
    [Small LLM] Generates the final answer using the approved prompt.
    """
    logger.info("--- Node: Final Answer ---")
    llm = get_llm(SMALL_LLM_MODEL)
    
    # We use the prompt we constructed earlier
    response = llm.invoke(state['generated_prompt'])
    
    return {"final_output": response.content}

# --- ROUTING LOGIC ---

def route_critique(state: WorkOrderAgentState) -> Literal["construct_query", "final_answer"]:
    # 1. Success Condition
    if state['is_sufficient']:
        logger.info("Critique Passed. Proceeding to Final Answer.")
        return "final_answer"
    
    # 2. Failure Condition (Max Retries Reached)
    if state['search_iteration'] >= MAX_RETRIES:
        logger.warning("Max retries reached. Forcing Final Answer execution.")
        return "final_answer"
    
    # 3. Loop Condition
    logger.info("Critique Failed. Looping back to Construct Query.")
    return "construct_query"

# --- GRAPH BUILDER ---

def build_agentic_workflow() -> StateGraph:
    workflow = StateGraph(WorkOrderAgentState)
    
    workflow.add_node("construct_query", construct_query_node)
    workflow.add_node("retrieve_data", retrieve_data_node)
    workflow.add_node("generate_prompt", prompt_generation_node)
    workflow.add_node("reasoning_critique", reasoning_critique_node)
    workflow.add_node("final_answer", final_answer_node)
    
    workflow.set_entry_point("construct_query")
    
    workflow.add_edge("construct_query", "retrieve_data")
    workflow.add_edge("retrieve_data", "generate_prompt")
    workflow.add_edge("generate_prompt", "reasoning_critique")
    
    workflow.add_conditional_edges(
        "reasoning_critique",
        route_critique,
        {
            "construct_query": "construct_query",
            "final_answer": "final_answer"
        }
    )
    
    workflow.add_edge("final_answer", END)
    
    return workflow.compile()

# --- MAIN SYSTEM CLASS ---

class AgenticWorkOrderSystem:
    def __init__(self):
        self.workflow = build_agentic_workflow()
    
    async def process_work_order(self, work_order_id: str):
        initial_state = WorkOrderAgentState(
            work_order_id=work_order_id,
            work_order_context={},
            qualified_technicians=[],
            final_output="",
            errors=[],
            search_query="",
            search_parameters={},
            generated_prompt="",
            critique_feedback="",
            search_iteration=0,
            is_sufficient=False
        )
        
        # Calculate recursion limit based on max retries + buffer
        # (3 retries * 4 nodes per loop) + 5 buffer = 17 steps max
        system_recursion_limit = (MAX_RETRIES * 4) + 5

        try:
            result = await self.workflow.ainvoke(
                initial_state, 
                config={"recursion_limit": system_recursion_limit}
            )
            return result
        except Exception as e:
            logger.error(f"Workflow Critical Failure: {e}")
            return {"final_output": f"Error: {str(e)}", "errors": [str(e)]}