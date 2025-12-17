# --- 0. GLOBAL SSL PATCH (MUST BE AT THE VERY TOP) ---
import os
import ssl
import requests
import warnings
import hashlib  # Added for generating unique Doc IDs
from requests.packages.urllib3.exceptions import InsecureRequestWarning

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
def ingest_node(state: GraphState):
    print("\n--- AGENT: STARTING COMPLETE INGESTION ---")
    
    docs_to_process = []
    
    # ---------------------------------------------------------
    # STEP 1: PARSE METADATA
    # ---------------------------------------------------------
    for content in state['documents']:
        try:
            # Defaults
            machinery = "Unknown"
            manual_type = "General"
            text_part = content

            # Extract Metadata
            if "Content: " in content:
                meta_part, text_part = content.split("Content: ", 1)
                if "Machinery: " in meta_part:
                    machinery = meta_part.split("Machinery: ")[1].split(".")[0].strip()
                if "Document Type: " in meta_part:
                    manual_type = meta_part.split("Document Type: ")[1].split(".")[0].strip()

            # Generate Unique ID
            content_hash = hashlib.md5(text_part.encode('utf-8')).hexdigest()[:8]
            doc_id = f"{machinery}_{manual_type}_{content_hash}"

            # Create Metadata Dict (Applied to ALL storage)
            doc_metadata = {
                "doc_id": doc_id,
                "machinery": machinery, 
                "manual_type": manual_type, 
                "source": "user_upload"
            }

            doc = Document(page_content=text_part, metadata=doc_metadata)
            docs_to_process.append(doc)
            print(f"   > Prepared Doc: {doc_id}")
            
        except Exception as e:
            print(f"   > Metadata Parsing Failed: {e}")

    # ---------------------------------------------------------
    # STEP 2: KNOWLEDGE GRAPH (ENTITIES)
    # ---------------------------------------------------------
    print("   > [1/3] Extracting Entities (Nodes & Relationships)...")
    transformer = LLMGraphTransformer(llm=llm)
    graph_documents = transformer.convert_to_graph_documents(docs_to_process)

    # Inject metadata into every Entity Node (e.g., "Valve" gets "machinery: Drill")
    for graph_doc in graph_documents:
        source_meta = graph_doc.source.metadata
        for node in graph_doc.nodes:
            node.properties.update(source_meta)

    graph.add_graph_documents(graph_documents)
    print(f"   > Saved Entities to Neo4j.")

    # ---------------------------------------------------------
    # STEP 3: PREPARE CHUNKS
    # ---------------------------------------------------------
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunked_docs = text_splitter.split_documents(docs_to_process)
    print(f"   > Created {len(chunked_docs)} chunks.")

    # ---------------------------------------------------------
    # STEP 4: NEO4J VECTOR INDEX (CREATES 'DocumentChunk' NODES)
    # ---------------------------------------------------------
    print("   > [2/3] Indexing Chunks in Neo4j...")
    
    Neo4jVector.from_documents(
        chunked_docs,
        embeddings,
        url=NEO4J_URI,
        username=NEO4J_USERNAME,
        password=NEO4J_PASSWORD,
        index_name="factory_vector_index", 
        node_label="DocumentChunk",        
        embedding_node_property="embedding" 
    )
    print("   > 'DocumentChunk' nodes created in Neo4j.")

    # ---------------------------------------------------------
    # STEP 5: CHROMADB VECTOR INGESTION
    # ---------------------------------------------------------
    print("   > [3/3] Indexing Chunks in ChromaDB...")
    vector_store_chroma.add_documents(chunked_docs)
    print("   > Saved to local ChromaDB.")

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
    Queries Neo4j to find all unique Machinery names and Manual Types/Sources
    currently indexed in the graph.
    """
    try:
        # distinct machinery
        query_machine = "MATCH (n:DocumentChunk) RETURN DISTINCT n.machinery AS m"
        machines = [r["m"] for r in graph.query(query_machine) if r["m"] != "Unknown"]
        
        # distinct sources/manual_types
        query_source = "MATCH (n:DocumentChunk) RETURN DISTINCT n.manual_type AS s"
        sources = [r["s"] for r in graph.query(query_source) if r["s"] != "General"]
        
        return {
            "machinery": sorted(list(set(machines))),
            "sources": sorted(list(set(sources)))
        }
    except Exception as e:
        print(f"Error fetching filters: {e}")
        return {"machinery": [], "sources": []}

# --- 8. HYBRID RETRIEVAL (VECTOR + GRAPH) ---

def process_chat_query(request):
    """
    Hybrid Retrieval:
    1. Vector Search (Chroma) for unstructured text logic.
    2. Graph Search (Neo4j) for structured relationship logic (Cypher).
    3. Synthesize both into a final answer.
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
        # 1. FORCE SCHEMA REFRESH (CRITICAL FOR DYNAMIC AGENTS)
        # This makes the LLM aware of new nodes/properties (like 'machinery') immediately.
        graph.refresh_schema()
        print("   > Graph Schema Refreshed.")

        # 2. Initialize Cypher Chain
        cypher_chain = GraphCypherQAChain.from_llm(
            llm=llm,
            graph=graph,
            verbose=True,
            allow_dangerous_requests=True,
            return_direct=True 
        )
        
        # 3. Prompt Engineering: Guide the LLM to the correct node
        structured_query = query
        if machine and machine != "All":
            # We explicitly tell the LLM to look at the 'machinery' property found in the schema
            structured_query = f"{query} (Look for the Machine node where the property 'machinery' equals '{machine}')"

        print(f"   > Generating Cypher for: {structured_query}")
        graph_result = cypher_chain.invoke(structured_query)
        
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