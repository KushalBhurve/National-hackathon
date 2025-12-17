from models import DataSource, DashboardStats, ComplianceAlert, GraphNode, GraphEdge, Topology

# --- MOCK DATA STORE ---

DATA_SOURCES = [
    DataSource(
        id="src-29384",
        name="Robotic Arm #4",
        type="SCADA",
        status="Online",
        protocol="OPC UA",
        last_sync="Just now",
        details={"line": "Line A", "function": "Welding"}
    ),
    DataSource(
        id="src-99120",
        name="PLC Controller Main",
        type="PLC",
        status="Degraded",
        protocol="MQTT",
        last_sync="450ms latency",
        details={"line": "Line B", "function": "Assembly"}
    ),
    DataSource(
        id="doc-1102",
        name="KUKA KR Quantec Manuals",
        type="Document",
        status="Static",
        last_sync="2d ago",
        details={"file_count": "14 PDFs"}
    ),
    DataSource(
        id="erp-SAP01",
        name="SAP Plant Maintenance",
        type="ERP",
        status="Online",
        protocol="REST API",
        last_sync="5m ago",
        details={"connector": "SAP-PM-Connector-v2"}
    ),
    DataSource(
        id="src-45112",
        name="Conveyor Motor VFD",
        type="SCADA",
        status="Offline",
        protocol="Modbus TCP",
        last_sync="2h 15m ago",
        details={"error": "Connection Timeout"}
    ),
    DataSource(
        id="src-88210",
        name="Paint Booth #2 Humidity",
        type="Sensor",
        status="Online",
        protocol="OPC UA",
        last_sync="12s ago",
        details={"value": "45% RH"}
    )
]

STATS = DashboardStats(
    total_sources=42,
    active_streams=38,
    graph_nodes=12400,
    ingestion_rate_mb_s=450.5
)

COMPLIANCE_ALERTS = [
    ComplianceAlert(
        id="alert-101",
        title="Technician Certification Mismatch",
        severity="Critical",
        timestamp="10:42 AM",
        source_system="Robotic Welder Kuka-200",
        description="Technician J. Doe (L2) attempted to access L3 maintenance protocol.",
        status="Blocked",
        technician_id="tech-492",
        policy_id="pol-7B",
        related_entities=["tech-492", "asset-kuka-200", "pol-7B"]
    ),
    ComplianceAlert(
        id="alert-102",
        title="Preventive Maintenance Overdue",
        severity="High Risk",
        timestamp="09:15 AM",
        source_system="Paint Line Conveyor B2",
        description="Scheduled maintenance missed by 48 hours.",
        status="Active",
        related_entities=["asset-cv-b2", "sched-maint-01"]
    ),
    ComplianceAlert(
        id="alert-103",
        title="Shift Overlap Violation",
        severity="Policy",
        timestamp="08:30 AM",
        source_system="Team Alpha",
        description="Shift handover procedure timestamp mismatch.",
        status="Active",
        technician_id="tech-rodriguez",
        related_entities=["tech-rodriguez", "shift-log-am"]
    )
]

# Simple Topology for the preview
TOPOLOGY = Topology(
    nodes=[
        GraphNode(id="hub-01", label="Factory Hub", type="hub", data={}),
        GraphNode(id="asset-kuka", label="Kuka Robot", type="asset", data={}),
        GraphNode(id="sensor-temp", label="Temp Sensor", type="sensor", data={}),
        GraphNode(id="doc-manual", label="Maint. Manual", type="document", data={})
    ],
    edges=[
        GraphEdge(source="hub-01", target="asset-kuka", relation="monitors"),
        GraphEdge(source="asset-kuka", target="sensor-temp", relation="has_sensor"),
        GraphEdge(source="asset-kuka", target="doc-manual", relation="documented_by")
    ]
)
