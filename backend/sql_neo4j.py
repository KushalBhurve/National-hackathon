import json
import sqlite3
import uuid
from neo4j import GraphDatabase

# --- CONFIGURATION ---
JSON_FILE = r"C:\Users\GenAICHNSIRUSR20\Desktop\frontend\backend\technician.json"
SQLITE_DB = "maintenance.db"
NEO4J_URI = "neo4j://127.0.0.1:7687"
NEO4J_AUTH = ("neo4j", "KulVishSuh")

# --- 1. SAVE DATA TO JSON ---
def save_to_json(data, filename=JSON_FILE):
    with open(filename, 'w') as f:
        json.dump(data, f, indent=4)
    print(f"Data saved to {filename}")

# --- 2. SQLITE SETUP & LOAD ---
def setup_sqlite():
    conn = sqlite3.connect(SQLITE_DB)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS technicians (
            id TEXT PRIMARY KEY,
            name TEXT,
            role TEXT,
            certification_level TEXT,
            source TEXT,
            status TEXT
        )
    """)
    conn.commit()
    return conn

def load_json_to_sqlite():
    with open(JSON_FILE, 'r') as f:
        data = json.load(f)
    
    conn = sqlite3.connect(SQLITE_DB)
    cursor = conn.cursor()
    for tech in data:
        cursor.execute("""
            INSERT OR REPLACE INTO technicians (id, name, role, certification_level, source, status)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (tech['id'], tech['name'], tech['role'], tech['certification_level'], tech['source'], tech['status']))
    conn.commit()
    conn.close()
    print("Data loaded from JSON into SQLite.")

# --- 3. NEO4J SYNC LOGIC ---
class GraphSync:
    def __init__(self, uri, auth):
        self.driver = GraphDatabase.driver(uri, auth=auth)

    def close(self):
        self.driver.close()

    def sync_upsert(self, tech_data):
        """Creates or Updates a node in Neo4j"""
        query = """
        MERGE (t:Technician {id: $id})
        SET t:Person,
            t.name = $name,
            t.role = $role,
            t.certification_level = $cert,
            t.source = $source,
            t.status = $status
        """
        with self.driver.session() as session:
            session.run(query, 
                        id=tech_data['id'], name=tech_data['name'], 
                        role=tech_data['role'], cert=tech_data['certification_level'],
                        source=tech_data['source'], status=tech_data['status'])

    def sync_delete(self, tech_id):
        """Deletes a node in Neo4j"""
        query = "MATCH (t:Technician {id: $id}) DETACH DELETE t"
        with self.driver.session() as session:
            session.run(query, id=tech_id)

    def load_all_from_sqlite(self):
        """Function to perform a full bulk load from SQLite to Neo4j"""
        conn = sqlite3.connect(SQLITE_DB)
        conn.row_factory = sqlite3.Row # Allows accessing columns by name
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM technicians")
        rows = cursor.fetchall()
        
        for row in rows:
            self.sync_upsert(dict(row))
        
        conn.close()
        print(f"Bulk loaded {len(rows)} nodes from SQLite to Neo4j.")

# --- 4. THE "TRIGGER" WRAPPER ---
# Because SQLite triggers cannot call Python code directly easily, 
# we wrap the operations in a Python function.

def db_operation(action, data):
    """
    Simulates a database trigger. 
    Handles: 'create', 'update', 'delete'
    """
    conn = sqlite3.connect(SQLITE_DB)
    cursor = conn.cursor()
    sync = GraphSync(NEO4J_URI, NEO4J_AUTH)

    if action in ['create', 'update']:
        cursor.execute("""
            INSERT OR REPLACE INTO technicians (id, name, role, certification_level, source, status)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (data['id'], data['name'], data['role'], data['certification_level'], data['source'], data['status']))
        sync.sync_upsert(data)
        print(f"Action '{action}' performed on ID: {data['id']} (Synced to Neo4j)")

    elif action == 'delete':
        cursor.execute("DELETE FROM technicians WHERE id = ?", (data['id'],))
        sync.sync_delete(data['id'])
        print(f"Action 'delete' performed on ID: {data['id']} (Synced to Neo4j)")

    conn.commit()
    conn.close()
    sync.close()

# --- EXECUTION FLOW ---
if __name__ == "__main__":
    # Assuming 'all_technicians' is the list from your LLM script
    # save_to_json(all_technicians)
    
    # 1. Initialize SQLite
    setup_sqlite()
    
    # 2. Bulk load from JSON to SQLite, then to Neo4j
    load_json_to_sqlite()
    syncer = GraphSync(NEO4J_URI, NEO4J_AUTH)
    syncer.load_all_from_sqlite()

    # 3. Test the "Trigger" functionality
    new_tech = {
        "id": "tech_999",
        "name": "Jane Smith",
        "role": "Lead Tech",
        "certification_level": "L3",
        "source": "Manual",
        "status": "Active"
    }
    
    # This acts as your trigger-enabled CREATE/UPDATE
    db_operation('create', new_tech)
    
    # This acts as your trigger-enabled DELETE
    db_operation('delete', {"id": "tech_999"})