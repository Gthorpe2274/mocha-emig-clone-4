# RAGatouille Self-Hosting Deployment Guide

## Overview

RAGatouille is an open-source Python library created by Benjamin Clavié that provides state-of-the-art retrieval capabilities using ColBERT. This guide shows you how to deploy your own RAGatouille microservice to power the Emigration Pro app.

## Architecture

```
Emigration Pro (Cloudflare Worker) → Your RAGatouille Microservice (Python) → ColBERT Index
```

1. **Emigration Pro**: Your main app running on Cloudflare Workers
2. **RAGatouille Microservice**: Your self-hosted Python service using RAGatouille library
3. **ColBERT Index**: Your processed emigration documents for retrieval

## Step 1: Set Up Python RAGatouille Microservice

### 1.1 Create the Python Service

Create a new directory for your RAGatouille service:

```bash
mkdir emigration-rag-service
cd emigration-rag-service
```

### 1.2 Install Dependencies

Create `requirements.txt`:

```txt
ragatouille[colbert]
fastapi
uvicorn[standard]
python-multipart
requests
pandas
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### 1.3 Create the FastAPI Service

Create `main.py`:

```python
from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from ragatouille import RAGPretrainedModel
import uvicorn
from datetime import datetime

# Configuration
API_KEY = os.getenv("API_KEY", "your-custom-api-key-here")  # Set your own API key
INDEX_PATH = os.getenv("INDEX_PATH", "./emigration_index")
MODEL_NAME = os.getenv("MODEL_NAME", "colbert-ir/colbertv2.0")

# Initialize FastAPI app
app = FastAPI(
    title="Emigration RAGatouille Service",
    description="Self-hosted RAGatouille service for emigration information retrieval",
    version="1.0.0"
)

# Enable CORS for your Cloudflare Worker
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this for your specific domain in production
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

# Initialize RAGatouille model
try:
    rag_model = RAGPretrainedModel.from_pretrained(MODEL_NAME)
    print(f"✅ RAGatouille model loaded: {MODEL_NAME}")
except Exception as e:
    print(f"❌ Failed to load RAGatouille model: {e}")
    rag_model = None

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

class EnhancedAnswerRequest(BaseModel):
    query: str
    country: Optional[str] = None
    category: Optional[str] = "general"

class EnhancedAnswer(BaseModel):
    answer: str
    sources: List[RAGResult]
    confidence: str
    generated_at: str
    query: str

# API Endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    status = "healthy" if rag_model is not None else "unhealthy"
    return {
        "status": status,
        "message": f"RAGatouille service is {status}",
        "model": MODEL_NAME if rag_model else "Not loaded",
        "index_path": INDEX_PATH,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/retrieve-context", response_model=RAGResponse)
async def retrieve_context(
    request: RAGQuery,
    api_key: str = Depends(verify_api_key)
):
    """Retrieve relevant context using RAGatouille"""
    if not rag_model:
        raise HTTPException(status_code=503, detail="RAGatouille model not loaded")
    
    start_time = datetime.now()
    
    try:
        # Enhance query with country and category if provided
        enhanced_query = request.query
        if request.country:
            enhanced_query = f"{enhanced_query} {request.country}"
        if request.category and request.category != "general":
            enhanced_query = f"{enhanced_query} {request.category.replace('_', ' ')}"
        
        # Search using RAGatouille
        results = rag_model.search(
            query=enhanced_query,
            k=request.max_results or 5,
            index_name="emigration_index"  # Your index name
        )
        
        # Format results
        formatted_results = []
        for i, result in enumerate(results):
            formatted_results.append(RAGResult(
                content=result.get("content", ""),
                source=result.get("source", f"Document {i+1}"),
                relevance_score=result.get("score", 0.0),
                metadata={
                    "country": request.country,
                    "category": request.category,
                    "rank": i + 1,
                    "document_id": result.get("document_id"),
                    "passage_id": result.get("passage_id")
                }
            ))
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return RAGResponse(
            results=formatted_results,
            query=request.query,
            total_results=len(formatted_results),
            processing_time_ms=int(processing_time)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.post("/enhanced-answer", response_model=EnhancedAnswer)
async def get_enhanced_answer(
    request: EnhancedAnswerRequest,
    api_key: str = Depends(verify_api_key)
):
    """Get enhanced answer using RAG + LLM pipeline"""
    # This endpoint would integrate with OpenAI or another LLM
    # For now, return a structured response based on retrieved context
    
    # First retrieve context
    context_request = RAGQuery(
        query=request.query,
        country=request.country,
        category=request.category,
        max_results=5
    )
    
    context_response = await retrieve_context(context_request, api_key)
    
    # Simple answer generation (you can enhance this with LLM integration)
    answer = f"Based on the retrieved information: {' '.join([r.content[:200] for r in context_response.results[:3]])}"
    
    # Calculate confidence based on relevance scores
    avg_relevance = sum(r.relevance_score for r in context_response.results) / len(context_response.results) if context_response.results else 0
    confidence = "high" if avg_relevance > 0.8 else "medium" if avg_relevance > 0.6 else "low"
    
    return EnhancedAnswer(
        answer=answer,
        sources=context_response.results,
        confidence=confidence,
        generated_at=datetime.now().isoformat(),
        query=request.query
    )

if __name__ == "__main__":
    # Index your documents on startup if needed
    print("🚀 Starting Emigration RAGatouille Service...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## Step 2: Index Your Emigration Documents

Create `index_documents.py`:

```python
from ragatouille import RAGPretrainedModel
import os
import json
from pathlib import Path

def index_emigration_documents():
    """Index your emigration documents with RAGatouille"""
    
    # Initialize RAGatouille model
    model = RAGPretrainedModel.from_pretrained("colbert-ir/colbertv2.0")
    
    # Sample documents - replace with your actual emigration data
    documents = [
        {
            "content": "Portugal D7 visa requirements for US citizens include proof of accommodation, health insurance, and sufficient funds of approximately €7,200 annually. The application process typically takes 60-90 days.",
            "source": "Portugal Immigration Guide 2024",
            "country": "Portugal",
            "category": "visa_requirements"
        },
        {
            "content": "Cost of living in Lisbon, Portugal: One-bedroom apartments range from €700-1,400/month in central areas. Utilities average €80-120/month. Groceries cost 30-40% less than major US cities.",
            "source": "Lisbon Cost Analysis 2024",
            "country": "Portugal", 
            "category": "cost_of_living"
        },
        # Add your actual emigration documents here...
    ]
    
    # Prepare documents for indexing
    docs_for_indexing = [doc["content"] for doc in documents]
    metadatas = [{k: v for k, v in doc.items() if k != "content"} for doc in documents]
    
    # Create the index
    print("📚 Creating ColBERT index...")
    model.index(
        collection=docs_for_indexing,
        index_name="emigration_index",
        metadata=metadatas,
        overwrite_index=True
    )
    
    print("✅ Emigration documents indexed successfully!")
    print(f"📊 Indexed {len(documents)} documents")

if __name__ == "__main__":
    index_emigration_documents()
```

## Step 3: Deploy Your RAGatouille Service

### Option A: Local Development

```bash
# Set your custom API key
export API_KEY="your-secure-api-key-here"

# Index your documents (run once)
python index_documents.py

# Start the service
python main.py
```

Your service will be available at `http://localhost:8000`

### Option B: Production Deployment

#### Railway.app (Recommended)

1. Push your code to GitHub
2. Connect Railway to your repository
3. Set environment variables:
   - `API_KEY`: Your custom authentication token
   - `INDEX_PATH`: `./emigration_index`
4. Deploy!

#### Render.com

1. Connect your GitHub repository
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `python main.py`
4. Configure environment variables

#### DigitalOcean App Platform

1. Create new app from GitHub
2. Configure build and run commands
3. Set environment variables
4. Deploy

## Step 4: Configure Emigration Pro

Set these environment variables in your Cloudflare Worker:

```bash
# Your self-hosted RAGatouille service URL
RAGATOUILLE_API_URL=https://your-rag-service.railway.app

# Your custom API key (same as what you set in the Python service)
RAGATOUILLE_API_KEY=your-secure-api-key-here
```

## Step 5: Test the Integration

Test your RAGatouille service:

```bash
curl -X POST "https://your-rag-service.railway.app/retrieve-context" \
  -H "Authorization: Bearer your-secure-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "D7 visa requirements for Portugal",
    "country": "Portugal",
    "category": "visa_requirements",
    "max_results": 5
  }'
```

Test through Emigration Pro:

1. Visit `/rag` in your Emigration Pro app
2. Enter a query about emigration
3. View the RAG-enhanced results

## Step 6: Maintain Your Knowledge Base

### Adding New Documents

Update your documents in `index_documents.py` and re-run:

```bash
python index_documents.py
```

### Monitoring

Monitor your RAGatouille service health:

```bash
curl https://your-rag-service.railway.app/health
```

Check the RAG dashboard in Emigration Pro at `/rag/dashboard`

## Security Considerations

1. **Custom API Key**: Use a strong, unique API key for authentication
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Configure CORS properly for your domain
4. **Rate Limiting**: Consider adding rate limiting to your service
5. **Monitoring**: Set up logging and monitoring for your service

## Costs

- **RAGatouille**: Free (open-source)
- **Hosting**: $5-20/month depending on platform and usage
- **ColBERT Model**: Runs on CPU, no GPU required for small-medium datasets

## Troubleshooting

### Common Issues

1. **Model Loading Errors**: Ensure sufficient memory (2GB+ recommended)
2. **Index Not Found**: Run `index_documents.py` first
3. **API Key Errors**: Verify your API key matches between services
4. **CORS Issues**: Configure CORS properly in FastAPI

### Getting Help

- RAGatouille Documentation: https://github.com/bclavie/RAGatouille
- FastAPI Documentation: https://fastapi.tiangolo.com/
- Join the discussion in RAGatouille GitHub issues

## Example Document Structure

```json
{
  "content": "Detailed information about immigration topic...",
  "source": "Official Government Guide 2024",
  "country": "Portugal",
  "category": "visa_requirements",
  "last_updated": "2024-01-15",
  "source_type": "government_official",
  "confidence": "high"
}
```

This guide provides everything you need to deploy your own RAGatouille service and integrate it with Emigration Pro for highly accurate, source-backed emigration information.
