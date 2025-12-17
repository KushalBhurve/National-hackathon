import json
from typing import List, Dict, Optional, Any
from langchain_neo4j import GraphCypherQAChain
from langchain_core.prompts import PromptTemplate

# Import singletons from your existing agent setup to reuse connections
from agent import llm, graph

class ManufacturingKGQueryEngine:
    """
    Dynamic Query Engine for Enterprise Context.
    Adapts to schema changes by generating Cypher on-the-fly using LLMs,
    while enforcing strict business logic via prompts.
    """

    def __init__(self):
        # We reuse the existing 'graph' and 'llm' from agent.py
        self.graph = graph
        self.llm = llm
        
        # Initialize the Chain with schema refresh enabled
        self.chain = GraphCypherQAChain.from_llm(
            llm=self.llm,
            graph=self.graph,
            verbose=True,
            allow_dangerous_requests=True,
            return_direct=True, # We want the raw data, not a natural language summary
            validate_cypher=True
        )

    def _execute_dynamic_query(self, natural_language_logic: str) -> List[Dict]:
        """
        Helper: Refreshes schema to handle changes, then executes logic.
        """
        try:
            # CRITICAL: Always refresh schema before querying to handle "changing schema"
            self.graph.refresh_schema()
            
            # Execute via LangChain (LLM maps Logic -> Current Schema -> Cypher)
            result = self.chain.invoke(natural_language_logic)
            
            # Extract list from result
            return result.get('result', [])
        except Exception as e:
            print(f"KG Engine Error: {e}")
            return []

    # ============================================================
    # USE CASE 1: Context-Aware Work Order Assignment
    # ============================================================

    def find_qualified_technicians_for_workorder(self, workorder_id: str) -> List[Dict]:
        """
        Finds technicians by dynamically mapping business rules to the *current* graph schema.
        """
        logic_prompt = f"""
        I need to find qualified technicians for WorkOrder ID '{workorder_id}'.
        
        Generate a Cypher query that performs these steps based on the current graph schema:
        1. Find the Equipment associated with this WorkOrder.
        2. Find the Facility where this Equipment is located.
        3. Find Persons who work at that same Facility.
        4. Match Certifications required by the Equipment.
        5. Filter for Persons who hold these Certifications with status='valid' and expiry_date in the future.
        6. Return the Person's ID, Name, Role, and the Facility Name.
        """
        return self._execute_dynamic_query(logic_prompt)

    def get_workorder_context(self, workorder_id: str) -> Dict:
        """
        Retrieves full context (SOPs, History, etc.) regardless of exact relationship names.
        """
        logic_prompt = f"""
        Retrieve complete context for WorkOrder ID '{workorder_id}'.
        
        Generate a Cypher query that traverses the current schema to find:
        1. The WorkOrder details.
        2. The Equipment it targets and its Facility.
        3. Any assigned Person (Technician).
        4. Any linked SOPs (Standard Operating Procedures).
        5. The 5 most recent MaintenanceLogs for the Equipment.
        
        Return the result as a map/dictionary with keys: work_order, equipment, facility, technician, sops, history.
        """
        # Since return_direct=True returns a list of rows, we assume single row for context
        results = self._execute_dynamic_query(logic_prompt)
        return results[0] if results else {}

    # ============================================================
    # USE CASE 2: Equipment History & Troubleshooting
    # ============================================================

    def get_equipment_maintenance_history(self, equipment_id: str, limit: int = 20) -> Dict:
        logic_prompt = f"""
        Get maintenance history for Equipment ID '{equipment_id}'.
        
        Generate a Cypher query to:
        1. Find the Equipment node.
        2. Find all linked MaintenanceLog nodes.
        3. For each log, find the Person who performed it.
        4. Sort by log timestamp descending and limit to {limit}.
        5. Return Equipment details and a collection of logs (including who performed them, actions, and parts).
        """
        results = self._execute_dynamic_query(logic_prompt)
        return results[0] if results else {}

    def generate_troubleshooting_guide(self, equipment_id: str) -> Dict:
        logic_prompt = f"""
        Generate a troubleshooting guide for Equipment ID '{equipment_id}'.
        
        Generate a Cypher query to find:
        1. The Equipment's technical specifications and criticality.
        2. Distinct 'issues_found' from all its connected MaintenanceLogs.
        3. SOPs that are relevant to this Equipment type or category 'Maintenance Procedures'.
        4. Required Certifications for this Equipment.
        
        Return a single object containing all these details.
        """
        results = self._execute_dynamic_query(logic_prompt)
        return results[0] if results else {}

    # ============================================================
    # USE CASE 3: SOP Compliance
    # ============================================================

    def get_sop_with_context(self, sop_id: str, person_id: str) -> Dict:
        logic_prompt = f"""
        Check compliance for Person ID '{person_id}' against SOP ID '{sop_id}'.
        
        Generate a Cypher query to:
        1. Match the SOP and the Person.
        2. Identify Certifications required by the SOP.
        3. Identify Certifications held by the Person (must be 'valid' and not expired).
        4. Boolean check: Does the Person have ALL required certifications?
        5. Return SOP details, User Role, User Certifications, and the 'is_qualified' boolean.
        """
        results = self._execute_dynamic_query(logic_prompt)
        return results[0] if results else {}

    # ============================================================
    # USE CASE 4: Multilingual Safety
    # ============================================================

    def get_safety_policies_for_worker(self, person_id: str) -> List[Dict]:
        logic_prompt = f"""
        Find Safety Policies for Person ID '{person_id}'.
        
        Generate a Cypher query to:
        1. Identify the Person's Facility and Shift.
        2. Find SafetyPolicy nodes applicable to that Location/Facility.
        3. Filter policies where the Person's Shift is in the policy's applicable_shifts.
        4. Match Policy language to Person's languages (prioritize Person's primary language).
        5. Return Policy title, summary, severity, and language.
        """
        return self._execute_dynamic_query(logic_prompt)