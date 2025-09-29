"""
Simple RAG Implementation (Option C)
No complex dependencies - uses sentence-transformers + FAISS directly
"""

from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import json
import numpy as np
from datetime import datetime
import uvicorn

# Simple RAG dependencies
from sentence_transformers import SentenceTransformer
import faiss

# Configuration
API_KEY = os.getenv("API_KEY", "your-custom-api-key-here")
INDEX_PATH = os.getenv("INDEX_PATH", "./simple_index")
MODEL_NAME = os.getenv("MODEL_NAME", "all-MiniLM-L6-v2")

# Initialize FastAPI
app = FastAPI(
    title="Simple RAG Emigration Service",
    description="Simple, reliable RAG service without complex dependencies",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

def verify_api_key(credentials: HTTPAuthorizationCredentials = Security(security)):
    if credentials.credentials != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return credentials.credentials

# Global variables for the simple RAG system
embedder = None
index = None
documents = []
metadata = []
loading_error = None

def initialize_simple_rag():
    """Initialize simple RAG system"""
    global embedder, index, documents, metadata, loading_error
    
    try:
        print(f"Loading sentence transformer: {MODEL_NAME}")
        embedder = SentenceTransformer(MODEL_NAME)
        
        # Load or create documents
        documents = get_emigration_documents()
        
        # Create embeddings
        print("Creating embeddings...")
        doc_embeddings = embedder.encode([doc["content"] for doc in documents])
        
        # Create FAISS index
        print("Building FAISS index...")
        dimension = doc_embeddings.shape[1]
        index = faiss.IndexFlatIP(dimension)  # Inner product for similarity
        
        # Normalize embeddings for cosine similarity
        faiss.normalize_L2(doc_embeddings)
        index.add(doc_embeddings.astype('float32'))
        
        # Store metadata
        metadata = [doc for doc in documents]
        
        print(f"✅ Simple RAG initialized with {len(documents)} documents")
        
    except Exception as e:
        loading_error = str(e)
        print(f"❌ Failed to initialize Simple RAG: {e}")

def get_emigration_documents():
    """Get emigration documents for indexing"""
    return [
        {
            "content": "Portugal D7 visa requirements for US citizens include proof of accommodation, health insurance covering at least €30,000, and sufficient funds of approximately €7,200 annually (€600/month). The application process typically takes 60-90 days through Portuguese consulates. Required documents include passport, background check, proof of income, accommodation contract, and health insurance. The D7 visa is renewable and leads to permanent residency after 5 years.",
            "source": "Portugal Immigration Authority 2024",
            "country": "Portugal",
            "category": "visa_requirements"
        },
        {
            "content": "Cost of living in Lisbon, Portugal: One-bedroom apartments range from €700-1,400/month in central areas, with utilities averaging €80-120/month. Groceries cost 30-40% less than major US cities. Public transportation is €40/month. Restaurant meals range from €8-15 for casual dining. Internet costs €25-40/month for high-speed connections.",
            "source": "Lisbon Cost Analysis 2024",
            "country": "Portugal", 
            "category": "cost_of_living"
        },
        {
            "content": "Spain digital nomad visa allows remote workers to live in Spain while working for foreign companies. Minimum income requirement is €2,000/month. Visa valid for up to 5 years. Required documents include employment contract, proof of income, health insurance, and criminal background check. Processing time is 15-45 days.",
            "source": "Spain Immigration 2024",
            "country": "Spain",
            "category": "visa_requirements"
        },
        {
            "content": "Mexico Temporary Resident Visa for US citizens requires proof of income ($1,620/month) or bank balance ($27,000). Valid for up to 4 years, renewable. Can lead to permanent residency. Processing through Mexican consulates takes 10-20 business days. Health insurance not mandatory but recommended.",
            "source": "Mexico Immigration 2024",
            "country": "Mexico",
            "category": "visa_requirements"
        },
        {
            "content": "Germany EU Blue Card for highly skilled workers requires university degree and job offer with salary €56,400+ (€43,992 for shortage occupations). Valid for 4 years, leads to permanent residency after 21 months with B1 German or 33 months with A1 German. Family reunification allowed immediately.",
            "source": "Germany Immigration 2024",
            "country": "Germany",
            "category": "visa_requirements"
        },
        {
            "content": "Canada Express Entry system for skilled workers uses Comprehensive Ranking System (CRS). Minimum scores vary (typically 470-490). Requires language tests, education assessment, and proof of funds ($13,310 for single applicant). Processing time 6 months. Provincial Nominee Programs offer additional pathways.",
            "source": "Immigration Canada 2024",
            "country": "Canada",
            "category": "visa_requirements"
        },
        {
            "content": "Australia skilled migration requires occupation on skilled occupation list, skills assessment, and English proficiency. SkillSelect system uses points test. Minimum investment $2,500 AUD application fee plus health exams. Processing 8-12 months. Regional visas available with lower requirements.",
            "source": "Australia Immigration 2024",
            "country": "Australia",
            "category": "visa_requirements"
        },
        {
            "content": "Costa Rica Pensionado program requires $1,000/month guaranteed pension income. Provides path to permanent residency with benefits including tax exemptions on foreign income, duty-free import of household goods, and reduced healthcare costs. Application through Costa Rican consulates takes 6-12 months.",
            "source": "Costa Rica Immigration 2024",
            "country": "Costa Rica",
            "category": "visa_requirements"
        }
    ]

# Request/Response models
class RAGQuery(BaseModel):
    query: str
    country: Optional[str] = None
    category: Optional[str] = "general"
    max_results: Optional[int] = 5

class RAGResult(BaseModel):
    content: str
    source: str
    relevance_score: float
    metadata: Optional[Dict[str, Any]] = None

class RAGResponse(BaseModel):
    results: List[RAGResult]
    query: str
    total_results: int
    processing_time_ms: int

# API Endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    status = "healthy" if embedder is not None and index is not None else "unhealthy"
    details = "Simple RAG service operational" if status == "healthy" else f"Initialization failed: {loading_error}"
    
    return {
        "status": status,
        "message": details,
        "model": MODEL_NAME if embedder else "Not loaded",
        "documents_indexed": len(documents) if documents else 0,
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0-simple"
    }

@app.post("/retrieve-context", response_model=RAGResponse)
async def retrieve_context(
    request: RAGQuery,
    api_key: str = Depends(verify_api_key)
):
    """Retrieve relevant context using simple RAG"""
    if not embedder or not index:
        raise HTTPException(
            status_code=503, 
            detail=f"Simple RAG not initialized: {loading_error}"
        )
    
    start_time = datetime.now()
    
    try:
        # Enhance query
        enhanced_query = request.query
        if request.country:
            enhanced_query = f"{enhanced_query} {request.country}"
        if request.category and request.category != "general":
            enhanced_query = f"{enhanced_query} {request.category.replace('_', ' ')}"
        
        # Create query embedding
        query_embedding = embedder.encode([enhanced_query])
        faiss.normalize_L2(query_embedding)
        
        # Search
        k = min(request.max_results or 5, len(documents))
        scores, indices = index.search(query_embedding.astype('float32'), k)
        
        # Format results
        results = []
        for i, (score, idx) in enumerate(zip(scores[0], indices[0])):
            if idx < len(metadata):
                doc = metadata[idx]
                results.append(RAGResult(
                    content=doc["content"],
                    source=doc.get("source", f"Document {idx}"),
                    relevance_score=float(score),
                    metadata={
                        "country": doc.get("country"),
                        "category": doc.get("category"),
                        "rank": i + 1,
                        "document_index": int(idx)
                    }
                ))
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return RAGResponse(
            results=results,
            query=request.query,
            total_results=len(results),
            processing_time_ms=int(processing_time)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Simple RAG Emigration Service",
        "status": "healthy" if embedder and index else "unhealthy",
        "version": "1.0.0-simple",
        "approach": "sentence-transformers + FAISS",
        "docs": "/docs"
    }

# Initialize on startup
@app.on_event("startup")
async def startup_event():
    initialize_simple_rag()

if __name__ == "__main__":
    print("🚀 Starting Simple RAG Emigration Service...")
    print(f"Model: {MODEL_NAME}")
    print(f"API Key configured: {'Yes' if API_KEY != 'your-custom-api-key-here' else 'No'}")
    
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
