# --- 0. GLOBAL SSL PATCH (MUST BE AT THE VERY TOP) ---
import os
import ssl
import requests
import warnings
import hashlib  # Added for generating unique Doc IDs
from requests.packages.urllib3.exceptions import InsecureRequestWarning

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
NEO4J_PASSWORD = "KulVishSuh" 

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
    print("\n--- AGENT: STARTING COMPLETE INGESTION ---")
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
            
            # Metadata for Neo4j Properties
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

    # 2. EXTRACT ENTITIES (LLM)
    print("   > Extracting Entities...")
    try:
        transformer = LLMGraphTransformer(llm=llm)
        graph_documents = transformer.convert_to_graph_documents(docs_to_process)
        # Inject metadata into extracted entities so we know where they came from
        for graph_doc in graph_documents:
            source_meta = graph_doc.source.metadata
            for node in graph_doc.nodes:
                node.properties.update(source_meta)
        graph.add_graph_documents(graph_documents)
    except Exception as e:
        print(f"   > KG Error: {e}")

    # 3. VECTOR INDEXING (Neo4j & Chroma)
    print("   > Indexing Vectors...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunked_docs = text_splitter.split_documents(docs_to_process)
    
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

    # 4. CRITICAL: LINK DOCUMENT TO MACHINERY NODE
    print("   > Linking Documents to Machinery...")
    for doc in docs_to_process:
        target_machine = doc.metadata.get("machinery")
        doc_id = doc.metadata.get("doc_id")
        
        if target_machine and target_machine != "Unknown":
            # This query connects the Document (source of info) to the Physical Machine
            link_query = """
            MATCH (d:DocumentChunk) 
            WHERE d.doc_id = $doc_id
            
            MERGE (m:Machinery {name: $machine_name})
            ON CREATE SET m.status = 'Online', m.source = 'Ingestion_Inferred'
            
            MERGE (d)-[:MANUAL_FOR]->(m)
            """
            try:
                graph.query(link_query, {"doc_id": doc_id, "machine_name": target_machine})
                print(f"     -> Linked Chunks for '{doc_id}' to Machine '{target_machine}'")
            except Exception as e:
                print(f"     -> Linking Error: {e}")

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


def process_chat_query(request):
    """
    Hybrid Retrieval with Dynamic Context Injection:
    1. Vector Search (Chroma) for unstructured text.
    2. Graph Search (Neo4j) with LIVE schema & ID awareness.
    3. Synthesize both.
    """
    query = request.query
    sources = request.selected_sources
    machine = request.selected_machine

    print(f"\n--- PROCESSING HYBRID CHAT ---")
    print(f"Query: {query}")
    print(f"Context: Machine='{machine}' | Sources={sources}")

    # --- SAFETY CHECK ---
    if not sources:
        return {
            "answer": "Please select at least one data source to proceed.",
            "trace": ["Blocked: No data sources selected."]
        }

    # ============================================================
    # PART 1: VECTOR RETRIEVAL (Unstructured Text from Chroma)
    # ============================================================
    
    # 1. Build Dynamic Vector Filters
    conditions = []
    
    # Source Logic
    if len(sources) == 1:
        conditions.append({"manual_type": sources[0]})
    else:
        or_block = [{"manual_type": src} for src in sources]
        conditions.append({"$or": or_block})

    # Machine Logic
    if machine and machine != "All":
        conditions.append({"machinery": machine})

    final_filter = {}
    if len(conditions) == 1:
        final_filter = conditions[0]
    elif len(conditions) > 1:
        final_filter = {"$and": conditions}

    # 2. Retrieve Vector Docs
    search_kwargs = {"k": 4}
    if final_filter:
        search_kwargs["filter"] = final_filter

    retriever = vector_store_chroma.as_retriever(search_kwargs=search_kwargs)
    vector_docs = retriever.invoke(query)
    
    # Format vector docs into a string
    vector_context_str = "\n\n".join([d.page_content for d in vector_docs]) if vector_docs else "No relevant text documents found."

    # ============================================================
    # PART 2: GRAPH RETRIEVAL (Structured Relationships from Neo4j)
    # ============================================================
    
    graph_context_str = "No graph data found."
    graph_trace = "Graph Query Skipped or Failed"

    try:
        # 1. CRITICAL: REFRESH SCHEMA STRUCTURE
        graph.refresh_schema()
        
        # 2. CRITICAL: FETCH DYNAMIC VALUES (Schema + Actual IDs)
        # We pass the 'machine' so we get IDs specific to 'abcd', 'vevor', etc.
        dynamic_context = get_dynamic_schema_context(graph, selected_machine=machine)
        
        print(f"   > Injected IDs (Snippet): {dynamic_context['relevant_ids'][:100]}...")
        
        # 3. DEFINE A ROBUST PROMPT WITH ID INJECTION
        cypher_generation_template = """
        Task: Generate Cypher statement to query a graph database.
        
        Schema:
        {schema}
        
        CRITICAL DATA CONTEXT:
        1. Valid Machinery Names: [{valid_machines}]
        2. Valid Node Labels: [{valid_labels}]
        
        3. *** ACTUAL NODE IDs FOUND IN DB FOR THIS MACHINE ***:
           [{relevant_ids}]
        
        Instructions:
        1. **EXACT MATCHING PRIORITY:** - Check the "ACTUAL NODE IDs" list above.
           - If the user asks for "bench lathe" and you see "Bench_Lathe" in the list, USE "Bench_Lathe" exactly.
           - Example: `WHERE n.id = 'Bench_Lathe'` (Preferred over CONTAINS)
        
        2. **FUZZY FALLBACK:**
           - If the specific ID is not in the list, use: `toLower(n.id) CONTAINS toLower('value')`.
        
        3. **LABEL FLEXIBILITY:** - If searching for a manufacturer/company, use `(n:Organization|Company)`.
           - If searching for a machine/product, use `(n:Machine|Product)`.
        
        4. **FILTERING:**
           - Always filter by the `machinery` property if provided.
        
        The question is:
        {query}
        """
        
        cypher_prompt = PromptTemplate(
            input_variables=["schema", "query", "valid_machines", "valid_labels", "relevant_ids"],
            template=cypher_generation_template
        )

        # 4. Initialize Chain with Custom Prompt
        cypher_chain = GraphCypherQAChain.from_llm(
            llm=llm,
            graph=graph,
            cypher_prompt=cypher_prompt, 
            verbose=True,
            allow_dangerous_requests=True,
            return_direct=True 
        )
        
        # 5. Run the Chain
        structured_query = query
        if machine and machine != "All":
            # We guide the LLM to filter by the property
            structured_query = f"{query} (Filter for the entity where property 'machinery' is '{machine}')"

        print(f"   > Generating Cypher for: {structured_query}")
        
        # Pass the dynamic values into the chain
        graph_result = cypher_chain.invoke({
            "query": structured_query,
            "valid_machines": dynamic_context['valid_machines'],
            "valid_labels": dynamic_context['valid_labels'],
            "relevant_ids": dynamic_context['relevant_ids'] # <--- INJECT IDs HERE
        })
        
        # --- DEBUG: PRINT RETRIEVED NODE ---
        print(f"   > RAW GRAPH RESULT: {graph_result}")
        # -----------------------------------
        
        if graph_result.get('result'):
            graph_context_str = str(graph_result['result'])
            graph_trace = "Graph Search Successful"
        else:
            graph_trace = "Graph Search: No matching entities found"

    except Exception as e:
        print(f"Graph Error: {e}")
        graph_trace = f"Graph Error: {str(e)}"

    # ============================================================
    # PART 3: HYBRID MERGE & GENERATION
    # ============================================================

    # Fallback if both fail
    if not vector_docs and "No matching entities" in graph_trace:
         return {
            "answer": f"I couldn't find data for '{query}' regarding {machine} in vectors or the knowledge graph.",
            "trace": [f"Vector Filter: {final_filter}", graph_trace]
        }

    # Create the Hybrid Prompt
    prompt = ChatPromptTemplate.from_template(
        """You are a FactoryOS industrial assistant. You have access to two types of knowledge:
        
        1. STRUCTURED KNOWLEDGE (Exact database relationships):
        {graph_context}
        
        2. UNSTRUCTURED MANUALS (Text excerpts):
        {vector_context}
        
        USER QUERY: 
        {query}
        
        Synthesize an answer using both sources. If the structured knowledge contradicts the text, prioritize the structured knowledge.
        """
    )

    chain = (
        {
            "graph_context": lambda x: graph_context_str,
            "vector_context": lambda x: vector_context_str,
            "query": lambda x: query
        }
        | prompt 
        | llm 
        | StrOutputParser()
    )

    try:
        response_text = chain.invoke(query)
        trace_steps = [
            f"Vector Filter: {str(final_filter)}",
            f"Vector Results: {len(vector_docs)} chunks",
            f"Graph Status: {graph_trace}",
            "Hybrid Response Generated"
        ]
    except Exception as e:
        response_text = "Error generating response."
        trace_steps = [f"Error: {str(e)}"]

    return {
        "answer": response_text,
        "trace": trace_steps
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
    # Cypher Logic:
    # 1. MERGE (create if not exists) the Task.
    # 2. MERGE (create if not exists) the Machine based on the dropdown selection.
    # 3. MERGE (create if not exists) the relationship between them.
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
    MERGE (m:Machinery {id: $target_machine})
    ON CREATE SET m.name = $target_machine
    
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