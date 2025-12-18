import json
import os
import ssl
import requests
import warnings
import hashlib
from dotenv import load_dotenv
from requests.packages.urllib3.exceptions import InsecureRequestWarning
from langchain_neo4j import Neo4jGraph

# --- 1. SSL & PROXY PATCH (COPIED FROM AGENT.PY) ---
# Disable SSL Warnings
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
warnings.simplefilter('ignore', InsecureRequestWarning)

# Force 'requests' library to ignore SSL Verification
old_merge_environment_settings = requests.Session.merge_environment_settings

def merge_environment_settings(self, url, proxies, stream, verify, cert):
    return old_merge_environment_settings(self, url, proxies, stream, False, cert)

requests.Session.merge_environment_settings = merge_environment_settings

# Force 'ssl' library to allow unverified context
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

# --- 2. CONFIGURATION ---
load_dotenv()

# Neo4j Config (Matches your agent.py)
NEO4J_URI = "bolt://localhost:7687"
NEO4J_USERNAME = "neo4j"
NEO4J_PASSWORD = "KulVishSuh" 

# Path to your JSON file
JSON_FILE_PATH = r"C:\Users\GenAICHNSIRUSR19\PROJECT\Project\National-hackathon\backend\maintenanceHistory.json"

# Initialize Graph Connection
graph = Neo4jGraph(url=NEO4J_URI, username=NEO4J_USERNAME, password=NEO4J_PASSWORD)

# --- 3. INGESTION LOGIC ---

def ingest_maintenance_history(file_path):
    """
    Reads the maintenance JSON and populates Neo4j with:
    1. Machinery nodes (Matched by name - NO properties modified)
    2. Incident nodes (Created and linked)
    """
    
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        return

    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
            
        assets = data.get("maintenance_dataset", {}).get("assets", [])
        print(f"Found {len(assets)} assets to process...")

        for asset in assets:
            process_asset(asset)
            
        print("\n--- INGESTION COMPLETE ---")
        
    except Exception as e:
        print(f"Critical Error during ingestion: {e}")

def process_asset(asset):
    """
    Processes a single asset:
    1. Finds the existing Machinery Node (using MERGE to be safe).
    2. Iterates through incidents and links them.
    """
    
    # 1. MERGE MACHINERY (Safe Match)
    # We use MERGE to find the node by name. 
    # We DO NOT use SET here, so existing properties (from PDF/manuals) remain untouched.
    machine_query = """
    MERGE (m:Machinery {name: $name})
    RETURN m
    """
    
    # Using the 'machinery' key from your new JSON structure
    target_name = asset.get("machinery") 
    
    try:
        graph.query(machine_query, {"name": target_name})
        print(f" > Found/Matched Machine: {target_name}")
    except Exception as e:
        print(f"Error matching machine {target_name}: {e}")
        return

    # 2. PROCESS INCIDENTS
    incidents = asset.get("incidents", [])
    for inc in incidents:
        process_incident(target_name, inc)

def process_incident(machine_name, incident):
    """
    Creates an Incident node and links it to the Machine.
    """
    
    incident_query = """
    MATCH (m:Machinery {name: $machine_name})
    
    MERGE (i:Incident {id: $inc_id})
    SET i.date = $date,
        i.component = $component,
        i.reported_issue = $issue,
        i.technician_notes = $notes,
        i.verification_context = $context,
        i.source = 'Incident_History'
        
    MERGE (m)-[:HAS_INCIDENT]->(i)
    """
    
    params = {
        "machine_name": machine_name,
        "inc_id": incident.get("incident_id"),
        "date": incident.get("date"),
        "component": incident.get("component"),
        "issue": incident.get("reported_issue"),
        "notes": incident.get("technician_notes"),
        "context": incident.get("agent_verification_context")
    }
    
    try:
        graph.query(incident_query, params)
        print(f"   - Linked Incident {incident.get('incident_id')} to {machine_name}")
    except Exception as e:
        print(f"   ! Error linking incident {incident.get('incident_id')}: {e}")
        
# --- 4. EXECUTION ---
if __name__ == "__main__":
    ingest_maintenance_history(JSON_FILE_PATH)