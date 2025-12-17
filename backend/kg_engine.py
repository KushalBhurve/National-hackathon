import json
from typing import List, Dict, Optional, Any
from langchain_neo4j import GraphCypherQAChain
from langchain_core.prompts import PromptTemplate

# Import singletons from agents.py
from agent import llm, graph

class ManufacturingKGQueryEngine:
    """
    Dynamic Query Engine for Enterprise Context.
    """

    def __init__(self):
        self.graph = graph
        self.llm = llm
        
        self.chain = GraphCypherQAChain.from_llm(
            llm=self.llm,
            graph=self.graph,
            verbose=True,
            allow_dangerous_requests=True,
            return_direct=True,
            validate_cypher=True
        )

    def _execute_dynamic_query(self, natural_language_logic: str) -> List[Dict]:
        try:
            self.graph.refresh_schema()
            # --- FIX: Pass input as a dictionary with key "query" ---
            result = self.chain.invoke({"query": natural_language_logic})
            return result.get('result', [])
        except Exception as e:
            print(f"KG Engine Error: {e}")
            return []

    def find_qualified_technicians_for_workorder(self, workorder_id: str) -> List[Dict]:
        """
        UPDATED: Explicitly guides LLM to use the correct 'required_skills' property match.
        """
        logic_prompt = f"""
        I need to find qualified technicians for WorkOrder ID '{workorder_id}'.
        
        The Graph Schema is:
        (:WorkOrder)-[:TARGETS_EQUIPMENT]->(:Machinery)
        (:Technician) nodes exist globally.
        
        Generate a Cypher query to:
        1. Match the WorkOrder node by id '{workorder_id}'.
        2. Match ALL nodes labeled 'Technician'.
        3. FILTER: The Technician's 'certification_level' MUST be present in the WorkOrder's 'required_skills' list.
           (Hint: Use 'WHERE t.certification_level IN w.required_skills')
        4. FILTER: The Technician's status must be 'Available'.
        5. Return the Technician's id, name, role, certification_level, and status.
        """
        return self._execute_dynamic_query(logic_prompt)

    def get_workorder_context(self, workorder_id: str) -> Dict:
        """
        UPDATED: Explicitly mentions the relationship names to prevent 'Not Found' errors.
        """
        logic_prompt = f"""
        Retrieve context for WorkOrder ID '{workorder_id}'.
        
        The Graph Schema is:
        (w:WorkOrder)-[:TARGETS_EQUIPMENT]->(m:Machinery)
        
        Generate a Cypher query to:
        1. Match the WorkOrder node (w) where id is '{workorder_id}'.
        2. OPTIONAL MATCH the connected Machinery node (m).
        3. Return a map containing: 
           - 'work_order': properties of w
           - 'equipment': properties of m
        """
        results = self._execute_dynamic_query(logic_prompt)
        return results[0] if results else {}

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

    def get_safety_policies_for_worker(self, person_id: str) -> List[Dict]:
        return []