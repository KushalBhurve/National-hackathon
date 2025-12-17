# --- 0. GLOBAL SSL PATCH (MUST BE AT THE VERY TOP) ---
import os
import ssl
import requests
import warnings
import hashlib  # Added for generating unique Doc IDs
from requests.packages.urllib3.exceptions import InsecureRequestWarning
from langchain_experimental.text_splitter import SemanticChunker

from langchain_core.prompts import PromptTemplate

# 1. Disable SSL Warnings
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
warnings.simplefilter('ignore', InsecureRequestWarning)

# 2. Force 'requests' library to ignore SSL Verification
old_merge_environment_settings = requests.Session.merge_environment_settings

def merge_environment_settings(self, url, proxies, stream, verify, cert):
    return old_merge_environment_settings(self, url, proxies, stream, False, cert)

requests.Session.merge_environment_settings = merge_environment_settings

# 3. Force 'ssl' library to allow unverified context
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

import uuid
from typing import TypedDict, List, Optional
import httpx

# LangChain & AI Imports
from langchain_core.documents import Document
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_experimental.graph_transformers import LLMGraphTransformer
from langchain_neo4j import Neo4jGraph, Neo4jVector
from langchain_chroma import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langgraph.graph import StateGraph, END
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# *** NEW IMPORT FOR HYBRID RAG ***
from langchain_neo4j import GraphCypherQAChain

# --- 1. CONFIGURATION ---

# Neo4j Config
NEO4J_URI = "bolt://localhost:7687"
NEO4J_USERNAME = "neo4j"
NEO4J_PASSWORD = "Rag1234##" 

# ChromaDB Config
CHROMA_PATH = "./chroma_db_store"

# Corporate Proxy/SSL Fix
http_client = httpx.Client(verify=False)
api_key = os.getenv("OPENAI_API_KEY")

# --- 2. MODEL INITIALIZATION ---

# Chat Model
llm = ChatOpenAI(
    base_url="https://genailab.tcs.in",
    model="azure/genailab-maas-gpt-4o",
    api_key=api_key,
    temperature=0,
    http_client=http_client
)

# Embedding Model
embeddings = OpenAIEmbeddings(
    base_url="https://genailab.tcs.in",
    model="azure/genailab-maas-text-embedding-3-large",
    api_key=api_key,
    http_client=http_client
)

# Database Connections
graph = Neo4jGraph(url=NEO4J_URI, username=NEO4J_USERNAME, password=NEO4J_PASSWORD)

# Initialize Chroma (Persisted)
vector_store_chroma = Chroma(
    collection_name="factory_knowledge",
    embedding_function=embeddings,
    persist_directory=CHROMA_PATH
)

# --- 3. WORKFLOW STATE ---
class GraphState(TypedDict):
    documents: List[str]      # Raw input strings
    error_log: Optional[str]

# --- 4. TRIPLE INGESTION NODE (Entities + Neo4j Chunks + Chroma Chunks) ---
# --- 4. TRIPLE INGESTION NODE (Entities + Neo4j Chunks + Chroma Chunks) ---

def add_machine_to_graph(machine_data: dict):
    """
    Explicitly creates a Machinery node.
    """
    query = """
    MERGE (m:Machinery {name: $name})
    SET m.id = $id,
        m.location = $location,
        m.type = $type,
        m.status = 'Online',
        m.source = 'Dashboard_Entry'
    RETURN m
    """
    
    # Create an ID like 'mach_robotic_arm'
    safe_name = machine_data['name'].lower().replace(" ", "_")
    machine_id = f"mach_{safe_name}"
    
    params = {
        "id": machine_id,
        "name": machine_data['name'],
        "location": machine_data['location'],
        "type": machine_data['type']
    }
    
    try:
        graph.query(query, params)
        print(f" > Added Machinery: {machine_data['name']}")
        return True
    except Exception as e:
        print(f"Error adding machinery: {e}")
        return False

    
def ingest_node(state: GraphState):
    print("\n--- AGENT: STARTING SEMANTIC INGESTION ---")
    docs_to_process = []
    
    # 1. PARSE & PREPARE
    for content in state['documents']:
        try:
            machinery = "Unknown"
            manual_type = "General"
            text_part = content

            if "Content: " in content:
                meta_part, text_part = content.split("Content: ", 1)
                if "Machinery: " in meta_part:
                    machinery = meta_part.split("Machinery: ")[1].split(".")[0].strip()
                if "Document Type: " in meta_part:
                    manual_type = meta_part.split("Document Type: ")[1].split(".")[0].strip()

            if not text_part.strip(): continue

            content_hash = hashlib.md5(text_part.encode('utf-8')).hexdigest()[:8]
            doc_id = f"{machinery}_{manual_type}_{content_hash}"
            
            doc_metadata = {
                "doc_id": doc_id,
                "machinery": machinery, 
                "manual_type": manual_type, 
                "source": "user_upload"
            }
            
            doc = Document(page_content=text_part, metadata=doc_metadata)
            docs_to_process.append(doc)
            
        except Exception as e:
            print(f"Metadata Parse Error: {e}")

    if not docs_to_process: return {"error_log": "no_valid_docs"}

    # 2. EXTRACT ENTITIES (Same as before)
    print("   > Extracting Entities...")
    try:
        transformer = LLMGraphTransformer(llm=llm)
        graph_documents = transformer.convert_to_graph_documents(docs_to_process)
        for graph_doc in graph_documents:
            source_meta = graph_doc.source.metadata
            for node in graph_doc.nodes:
                node.properties.update(source_meta)
        graph.add_graph_documents(graph_documents)
    except Exception as e:
        print(f"   > KG Error: {e}")

    # 3. SEMANTIC VECTOR INDEXING
    print("   > Performing Semantic Splitting...")
    # breakpoint_threshold_type can be "percentile", "standard_deviation", or "interquartile"
    semantic_splitter = SemanticChunker(
        embeddings, 
        breakpoint_threshold_type="percentile" 
    )
    
    # This splits docs based on meaning rather than character count
    chunked_docs = semantic_splitter.split_documents(docs_to_process)
    print(f"   > Created {len(chunked_docs)} semantic chunks.")
    
    if chunked_docs:
        # Neo4j Vector
        try:
            Neo4jVector.from_documents(
                chunked_docs, embeddings, url=NEO4J_URI, username=NEO4J_USERNAME, password=NEO4J_PASSWORD,
                index_name="factory_vector_index", node_label="DocumentChunk", embedding_node_property="embedding"
            )
        except Exception as e: print(f"Neo4j Vector Error: {e}")
        
        # Chroma Vector
        try:
            vector_store_chroma.add_documents(chunked_docs)
        except Exception as e: print(f"Chroma Vector Error: {e}")

    # 4. LINK DOCUMENT TO MACHINERY (Same as before)
    print("   > Linking Semantic Chunks to Machinery...")
    for doc in docs_to_process:
        target_machine = doc.metadata.get("machinery")
        doc_id = doc.metadata.get("doc_id")
        
        if target_machine and target_machine != "Unknown":
            link_query = """
            MATCH (d:DocumentChunk) 
            WHERE d.doc_id = $doc_id
            MERGE (m:Machinery {name: $machine_name})
            MERGE (d)-[:MANUAL_FOR]->(m)
            """
            try:
                graph.query(link_query, {"doc_id": doc_id, "machine_name": target_machine})
            except Exception as e: print(f"Linking Error: {e}")

    return {"error_log": None} 
   
# --- 5. REFACTOR NODE ---
def refactor_node(state: GraphState):
    return {"error_log": "refactored"}

# --- 6. BUILD WORKFLOW ---
workflow_builder = StateGraph(GraphState)
workflow_builder.add_node("ingest", ingest_node)
workflow_builder.add_node("refactor", refactor_node)

def route_step(state):
    return "refactor" if state.get("error_log") == "schema_mismatch" else END

workflow_builder.set_entry_point("ingest")
workflow_builder.add_conditional_edges("ingest", route_step)
workflow_builder.add_edge("refactor", END)

graph_workflow = workflow_builder.compile()


# --- 7. HELPER: GET FILTERS ---
def get_knowledge_graph_filters():
    """
    Queries Neo4j to find all unique Machinery names from the 
    OFFICIAL 'Machinery' nodes (created via Dashboard or Ingestion).
    """
    try:
        # --- MATCHES YOUR NODE STRUCTURE ---
        # 1. Matches label (:Machinery)
        # 2. Returns property (.name)
        query_machine = """
        MATCH (m:Machinery) 
        WHERE m.name IS NOT NULL
        RETURN DISTINCT m.name AS name
        ORDER BY name ASC
        """
        
        machine_result = graph.query(query_machine)
        machines = [r["name"] for r in machine_result]
        
        # --- Keep Source Query (looks at Documents) ---
        query_source = "MATCH (n:DocumentChunk) RETURN DISTINCT n.manual_type AS s"
        source_result = graph.query(query_source)
        sources = [r["s"] for r in source_result if r["s"] and r["s"] != "General"]
        
        return {
            "machinery": machines,
            "sources": sorted(list(set(sources)))
        }
    except Exception as e:
        print(f"Error fetching filters: {e}")
        return {"machinery": [], "sources": []}


# --- 8. HYBRID RETRIEVAL (VECTOR + GRAPH) ---

def get_dynamic_schema_context(graph, selected_machine=None):
    """
    Fetches key values (IDs) specifically for the selected machine
    to help the LLM map 'bench lathe' -> 'Bench_Lathe'.
    """
    context_data = {
        "valid_machines": "",
        "valid_labels": "",
        "relevant_ids": "" 
    }
    
    try:
        # 1. Get valid machines (Global)
        result = graph.query("MATCH (n) WHERE n.machinery IS NOT NULL RETURN DISTINCT n.machinery as m")
        context_data["valid_machines"] = ", ".join([r['m'] for r in result])
        
        # 2. Get valid labels (Global)
        labels_result = graph.query("CALL db.labels()")
        valid_labels = [r['label'] for r in labels_result if r['label'] not in ['Document', 'DocumentChunk']]
        context_data["valid_labels"] = ", ".join(valid_labels)

        # 3. Get Relevant IDs for the SPECIFIC Machine (Context Injection)
        if selected_machine and selected_machine != "All":
            # We fetch IDs only for the semantic nodes (Machine, Organization, Part, etc.)
            # We exclude 'DocumentChunk' to keep the list clean.
            query_ids = f"""
            MATCH (n) 
            WHERE n.machinery = '{selected_machine}' 
            AND NOT 'DocumentChunk' IN labels(n)
            AND NOT 'Document' IN labels(n)
            RETURN DISTINCT n.id as id
            LIMIT 100
            """
            id_result = graph.query(query_ids)
            ids_list = [str(r['id']) for r in id_result if r['id']]
            context_data["relevant_ids"] = ", ".join(ids_list)
        else:
            context_data["relevant_ids"] = "No specific machine selected, so no specific IDs loaded."

        return context_data

    except Exception as e:
        print(f"Error in schema context: {e}")
        return context_data

def get_machine_neighborhood_context(machine_name, allowed_sources=None):
    """
    Deterministic Graph Retrieval with SOURCE FILTERING:
    Fetches the central Machine node and connected nodes, BUT filters
    them based on the user's selected Data Sources (manual_type).
    """
    if not machine_name or machine_name == "All":
        return "No specific machine selected. Graph context unavailable."

    # If no sources provided, default to an empty list to prevent errors
    if allowed_sources is None:
        allowed_sources = []

    # --- UPDATED QUERY WITH FILTER ---
    # 1. Matches the machine and neighbors.
    # 2. WHERE clause: 
    #    - If the node has a 'manual_type' property (ingested data), it MUST be in 'allowed_sources'.
    #    - OR if 'manual_type' is NULL (e.g., Tasks/Technicians created via UI), we include them.
    query = """
    MATCH (m:Machinery {name: $name})-[r]-(n)
    WHERE (n.manual_type IN $sources OR n.manual_type IS NULL)
    RETURN 
        type(r) as relationship,
        labels(n) as node_labels,
        coalesce(n.text, n.description, n.title, "No text content") as content,
        coalesce(n.doc_id, n.id, "No ID") as node_id,
        n
    LIMIT 50
    """
    
    try:
        # Pass the allowed_sources list to Neo4j
        results = graph.query(query, {"name": machine_name, "sources": allowed_sources})
        
        if not results:
            return f"No graph connections found for machine: '{machine_name}' using sources: {allowed_sources}"

        # Format the results into a clear narrative for the LLM
        context_lines = [f"--- GRAPH CONNECTIONS FOR: {machine_name} (Filtered by Sources) ---"]
        
        for record in results:
            rel_type = record['relationship']
            node_type = record['node_labels'][0] if record['node_labels'] else "Node"
            content = record['content']
            
            # Smart Formatting based on Node Type
            if "DocumentChunk" in record['node_labels']:
                # Mention the source manual in the context so LLM knows where it came from
                source_manual = record['n'].get('manual_type', 'Unknown Source')
                context_lines.append(f"• [MANUAL: {source_manual}] (Linked via {rel_type}): {content[:300]}...")
            elif "Task" in record['node_labels']:
                task_status = record['n'].get('status', 'Unknown')
                context_lines.append(f"• [MAINTENANCE TASK] (Linked via {rel_type}): {content} (Status: {task_status})")
            else:
                context_lines.append(f"• [RELATED ENTITY] {node_type} ({rel_type}): {content}")
                
        return "\n".join(context_lines)

    except Exception as e:
        return f"Graph Retrieval Error: {str(e)}"
    

def process_chat_query(request):
    query = request.query
    sources = request.selected_sources 
    machine = request.selected_machine

    # Initialize data structures for Frontend
    trace_graph = {"nodes": [], "links": []}
    citations = []
    seen_nodes = set()

    def add_to_trace(node_id, name, role="knowledge"):
        if node_id not in seen_nodes:
            trace_graph["nodes"].append({"id": str(node_id), "name": name, "role": role})
            seen_nodes.add(node_id)

    add_to_trace("user_query", "User Query", role="start")

    if not sources:
        return {"answer": "Please select at least one data source.", "trace": trace_graph, "citations": []}

    # --- STEP 1: VECTOR RETRIEVAL ---
    conditions = []
    if len(sources) == 1:
        conditions.append({"manual_type": sources[0]})
    else:
        conditions.append({"$or": [{"manual_type": src} for src in sources]})
    
    if machine and machine != "All":
        conditions.append({"machinery": machine})

    final_filter = conditions[0] if len(conditions) == 1 else {"$and": conditions}
    
    retriever = vector_store_chroma.as_retriever(search_kwargs={"k": 3, "filter": final_filter})
    vector_docs = retriever.invoke(query)

    for i, doc in enumerate(vector_docs):
        doc_id = f"vec_{i}"
        citations.append({
            "id": f"cite_vec_{i}",
            "source_name": doc.metadata.get("manual_type", "Reference Manual"),
            "snippet": doc.page_content[:200] + "...",
            "node_id": doc_id,
            "confidence": 0.95
        })
        add_to_trace(doc_id, f"Doc Chunk: {doc.metadata.get('manual_type', 'Manual')}", role="source")
        trace_graph["links"].append({"source": "user_query", "target": doc_id})

    vector_context_str = "\n\n".join([d.page_content for d in vector_docs])

    # --- STEP 2: GRAPH RETRIEVAL (DYNAMIC CYPHER) ---
    graph_context_str = "No graph data found."
    try:
        graph.refresh_schema()
        dyn_ctx = get_dynamic_schema_context(graph, selected_machine=machine)
        
        cypher_generation_template = """
        Task: Generate Cypher statement to query a graph database.
        Schema: {schema}
        
        CRITICAL DATA CONTEXT:
        1. Valid Machinery: [{valid_machines}]
        2. Valid Labels: [{valid_labels}]
        3. ACTUAL IDs IN DB: [{relevant_ids}]
        
        Instructions:
        1. If user says 'bench lathe' and 'Bench_Lathe' is in ACTUAL IDs, use `n.id = 'Bench_Lathe'`.
        2. Filter by `machinery` property: `{machine}`.
        
        Question: {query}
        """
        
        cypher_prompt = PromptTemplate(
            input_variables=["schema", "query", "valid_machines", "valid_labels", "relevant_ids", "machine"],
            template=cypher_generation_template
        )

        cypher_chain = GraphCypherQAChain.from_llm(
            llm=llm, graph=graph, cypher_prompt=cypher_prompt, 
            verbose=True, allow_dangerous_requests=True, return_direct=True 
        )
        
        graph_result = cypher_chain.invoke({
            "query": query,
            "machine": machine,
            "valid_machines": dyn_ctx['valid_machines'],
            "valid_labels": dyn_ctx['valid_labels'],
            "relevant_ids": dyn_ctx['relevant_ids']
        })
        
        raw_graph_data = graph_result.get('result', [])
        if raw_graph_data:
            graph_context_str = str(raw_graph_data)
            for item in raw_graph_data:
                if isinstance(item, dict) and 'id' in item:
                    add_to_trace(item['id'], item.get('name', item['id']), role="knowledge")
                    trace_graph["links"].append({"source": "user_query", "target": item['id']})
    except Exception as e:
        print(f"Graph Error: {e}")

    # --- STEP 3: HYBRID SYNTHESIS ---
    prompt = ChatPromptTemplate.from_template(
        """You are a FactoryOS industrial expert.
        Use the following retrieved data to answer the user.
        
        STRUCTURED GRAPH DATA: {graph_context}
        UNSTRUCTURED MANUAL TEXT: {vector_context}
        
        USER QUESTION: {query}
        
        Instruction: If the answer isn't in the data, explain that active filters ({sources}) might be hiding it."""
    )

    chain = (
        {
            "graph_context": lambda x: graph_context_str, 
            "vector_context": lambda x: vector_context_str, 
            "query": lambda x: query,
            "sources": lambda x: ", ".join(sources)
        }
        | prompt | llm | StrOutputParser()
    )

    response_text = chain.invoke(query)

    return {
        "answer": response_text,
        "trace": trace_graph,
        "citations": citations 
    }

def add_technician_to_graph(tech: dict):
    """
    Directly creates a Technician node in Neo4j.
    """
    query = """
    MERGE (t:Person:Technician {name: $name})
    SET t.id = $id,
        t.role = $role,
        t.certification_level = $level,
        t.status = $status,
        t.source = 'User_Entry'
    RETURN t
    """
    
    # Generate a simple ID if not present (or use name as key)
    tech_id = f"tech_{hashlib.md5(tech['name'].encode()).hexdigest()[:6]}"
    
    params = {
        "id": tech_id,
        "name": tech["name"],
        "role": tech["role"],
        "level": tech["certification_level"],
        "status": tech["status"]
    }
    
    try:
        graph.query(query, params)
        print(f" > Added Technician: {tech['name']}")
        return True
    except Exception as e:
        print(f"Error adding technician: {e}")
        return False
    
def add_task_to_graph(task: dict):
    """
    Creates a Task node and GUARANTEES a link to the specific Machine node.
    """
    query = """
    MERGE (t:Task {title: $title})
    SET t.id = $id,
        t.description = $desc,
        t.required_certification = $req_cert,
        t.priority = $priority,
        t.status = 'Pending',
        t.source = 'User_Entry'
    
    WITH t
    
    // GUARANTEE: Ensure the Machine node exists using the exact name from the dropdown
    MERGE (m:Machinery {name: $target_machine})
    
    // Create the relationship
    MERGE (t)-[:APPLIES_TO]->(m)
    
    RETURN t, m
    """
    
    # Generate a unique task ID
    task_id = f"task_{hashlib.md5(task['title'].encode()).hexdigest()[:6]}"
    
    params = {
        "id": task_id,
        "title": task["title"],
        "desc": task["description"],
        "req_cert": task["required_certification"],
        "priority": task["priority"],
        "target_machine": task["target_machine"] # Exact string from frontend dropdown
    }
    
    try:
        graph.query(query, params)
        print(f" > SUCCESS: Task '{task['title']}' linked to Machine '{task['target_machine']}'")
        return True
    except Exception as e:
        print(f"Error adding task: {e}")
        return False