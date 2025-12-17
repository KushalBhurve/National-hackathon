import networkx as nx
from typing import List, Dict, Any, Optional
from datetime import datetime
import re
from models import Topology, GraphNode, GraphEdge

class LiquidGraph:
    """
    A persistent, self-refactoring graph store.
    Simulates a Neo4j + LangGraph architecture using NetworkX.
    """
    def __init__(self):
        self.graph = nx.DiGraph()
        self.schema_constraints = {
            "labels": {"Person", "Asset", "Policy", "Document"},
            "relations": {"OPERATES", "MAINTAINS", "DESCRIBES", "CONNECTED_TO"}
        }
        self.seed_data()

    def seed_data(self):
        """Initial baseline data (Factory Context)"""
        # Nodes
        self.graph.add_node("hub-01", label="Hub", type="hub", data={"location": "Server Room"})
        self.graph.add_node("asset-kuka", label="Kuka Robot", type="asset", data={"model": "KR-1000"})
        self.graph.add_node("tech-492", label="J. Doe", type="person", data={"cert_level": "L2"})
        self.graph.add_node("pol-7B", label="Protocol 7B", type="policy", data={"req": "L3"})
        
        # Edges
        self.graph.add_edge("hub-01", "asset-kuka", relation="MONITORS")
        self.graph.add_edge("tech-492", "asset-kuka", relation="MAINTAINS")
        self.graph.add_edge("pol-7B", "asset-kuka", relation="GOVERNS")

    def query(self, cypher_like_query: str) -> List[Dict]:
        """
        Simulates running a Cypher query against the graph.
        Returns a list of dicts representing rows.
        """
        results = []
        
        # 1. Inspect Schema Query
        if "CALL db.labels()" in cypher_like_query:
            # Return all unique 'type' attributes
            types = set()
            for _, data in self.graph.nodes(data=True):
                types.add(data.get("type", "unknown"))
            return [{"label": t} for t in types]

        # 2. Match All Relationships Query
        if "MATCH (n)-[r]->(m)" in cypher_like_query:
            for u, v, data in self.graph.edges(data=True):
                source_node = self.graph.nodes[u]
                target_node = self.graph.nodes[v]
                results.append({
                    "source": u,
                    "source_label": source_node.get("label"),
                    "rel": data.get("relation"),
                    "target": v,
                    "target_label": target_node.get("label")
                })
            return results

        # 3. Simple Node Search (e.g. for Agent Retrieval)
        if "WHERE n.id =" in cypher_like_query or "WHERE n.label CONTAINS" in cypher_like_query:
            # Very basic mock search
            keyword = ""
            if "'" in cypher_like_query:
                keyword = cypher_like_query.split("'")[1].lower()
            
            for n, data in self.graph.nodes(data=True):
                if keyword in str(data.get("label", "")).lower() or keyword in str(n).lower():
                    results.append({"id": n, "node": data})
            return results

        return []

    def ingest_document(self, text: str) -> Dict[str, Any]:
        """
        The 'Ingest' Node logic.
        Parses text and attempts to write to graph.
        Returns state dict: {'status': 'success'} or {'status': 'schema_mismatch', 'detail': ...}
        """
        # Mock NLP Extraction (Rule-based for demo)
        # Pattern: "EntityA [is/commands/operates] EntityB"
        pattern = r"([A-Za-z0-9\s]+) (commands|is the CEO of|operates|is) ([A-Za-z0-9\s]+)"
        match = re.search(pattern, text, re.IGNORECASE)
        
        if match:
            subj, relation, obj = match.groups()
            subj = subj.strip()
            obj = obj.strip()
            
            # Infer types based on keywords (Simulating LLM classification)
            subj_type = "person" if "Commander" in subj or "Jensen" in subj else "unknown"
            obj_type = "ship" if "Normandy" in obj else "company" if "Nvidia" in obj else "unknown"
            
            # CHECK SCHEMA COMPLIANCE
            # If we encounter a new type like 'ship' that isn't in our constraints, trigger refactor
            if obj_type == "ship" and "ship" not in self.schema_constraints["labels"]:
                return {
                    "status": "schema_mismatch", 
                    "error_log": f"New entity type detected: '{obj_type}' for '{obj}'. Allowed: {self.schema_constraints['labels']}",
                    "pending_data": {"s": subj, "r": relation, "o": obj, "s_type": subj_type, "o_type": obj_type}
                }

            # If safe, write directly
            self._write_triple(subj, relation, obj, subj_type, obj_type)
            return {"status": "success"}
        
        return {"status": "ignored", "reason": "No structured pattern found"}

    def refactor_schema(self, state: Dict[str, Any]):
        """
        The 'Refactor' Node logic.
        Updates schema constraints to accept new data.
        """
        pending = state.get("pending_data")
        if not pending:
            return
        
        new_type = pending["o_type"]
        print(f"⚡ LIQUID SCHEMA: Adapting to new concept '{new_type}'...")
        
        # 1. Evolve Schema
        self.schema_constraints["labels"].add(new_type)
        
        # 2. Commit Data
        self._write_triple(pending["s"], pending["r"], pending["o"], pending["s_type"], pending["o_type"])
        
    def _write_triple(self, s, r, o, s_type, o_type):
        """Helper to commit data"""
        s_id = s.lower().replace(" ", "-")
        o_id = o.lower().replace(" ", "-")
        
        self.graph.add_node(s_id, label=s, type=s_type)
        self.graph.add_node(o_id, label=o, type=o_type)
        
        # Normalize relation
        r_clean = r.upper().replace(" ", "_")
        self.graph.add_edge(s_id, o_id, relation=r_clean)

    def get_topology(self) -> Topology:
        """Converts internal graph to API Topology model"""
        nodes = []
        edges = []
        
        for n, data in self.graph.nodes(data=True):
            nodes.append(GraphNode(
                id=n,
                label=data.get("label", n),
                type=data.get("type", "unknown"),
                data=data.get("data", {})
            ))
            
        for u, v, data in self.graph.edges(data=True):
            edges.append(GraphEdge(
                source=u,
                target=v,
                relation=data.get("relation", "LINKED")
            ))
            
        return Topology(nodes=nodes, edges=edges)

# Singleton Instance
graph_store = LiquidGraph()
