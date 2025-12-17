from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal

# --- Dashboard & Data Source Models ---

class DataSource(BaseModel):
    id: str
    name: str
    type: Literal["SCADA", "PLC", "Document", "ERP", "Sensor"]
    status: Literal["Online", "Offline", "Degraded", "Static"]
    protocol: Optional[str] = None
    last_sync: str
    details: Dict[str, str] = Field(default_factory=dict, description="Extra metadata like Latency, File count, etc.")

class DashboardStats(BaseModel):
    total_sources: int
    active_streams: int
    graph_nodes: int
    ingestion_rate_mb_s: float

# --- Knowledge Graph Models ---

class GraphNode(BaseModel):
    id: str
    label: str
    type: str
    data: Dict[str, Any]

class GraphEdge(BaseModel):
    source: str
    target: str
    relation: str

class Topology(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]

# --- Compliance Models ---

class ComplianceAlert(BaseModel):
    id: str
    title: str
    severity: Literal["Critical", "High Risk", "Warning", "Policy"]
    timestamp: str
    source_system: str
    description: str
    status: Literal["Active", "Resolved", "Blocked"]
    technician_id: Optional[str] = None
    policy_id: Optional[str] = None
    # For the graph visualization in the detailed view
    related_entities: List[str] = []

# --- Agent & Chat Models ---

class AgentStep(BaseModel):
    """A single step in the agent's chain of thought."""
    step_type: Literal["START", "ACTION", "OBSERVATION", "REASONING", "FINAL_ANSWER"]
    timestamp: str
    description: str
    details: Optional[Dict[str, Any]] = None

class TraceNode(BaseModel):
    id: str
    name: str
    role: str = "knowledge"  # e.g., "start", "source", "knowledge"

class TraceLink(BaseModel):
    source: str
    target: str

class GraphTrace(BaseModel):
    nodes: List[TraceNode]
    links: List[TraceLink]

class Citation(BaseModel):
    id: str
    source_name: str      # e.g., "Maintenance_Manual_V2.pdf"
    snippet: str          # The specific text used
    page_number: Optional[int] = None
    node_id: str          # Must match an ID in the Graph Trace
    confidence: float     # 0.0 to 1.0

class ChatResponse(BaseModel):
    answer: str
    trace: GraphTrace
    citations: List[Citation] = []

class FilterOptions(BaseModel):
    machinery: List[str]
    sources: List[str]

class ChatRequest(BaseModel):
    query: str
    selected_sources: List[str] = []
    selected_machine: Optional[str] = None # Added machine filter

class TechnicianInput(BaseModel):
    name: str
    role: str # e.g., "Senior Engineer", "Maintenance Tech"
    certification_level: Literal["L1", "L2", "L3"]
    status: Literal["Active", "On Leave", "Busy"] = "Active"

class TaskInput(BaseModel):
    title: str
    description: str
    target_machine: str # This should match a machine name in your graph
    required_certification: Literal["L1", "L2", "L3"]
    priority: Literal["Low", "Medium", "High", "Critical"]

class MachineInput(BaseModel):
    name: str # e.g., "Robotic Arm #4"
    location: str # e.g., "Line A - Station 12"
    type: str # e.g., "Welder"