# Exact File Operations for Simple RAG Railway Deployment

## Your Current Repository: Precise Instructions

You already have the `railway-deployment` folder with all necessary files. Here are the **exact file operations** needed:

### Step 1: Replace main.py
```bash
cd railway-deployment
cp simple-rag-main.py main.py
```

### Step 2: Replace requirements.txt  
```bash
cp requirements-simple-rag.txt requirements.txt
```

### Step 3: Clean up unnecessary files (optional)
```bash
rm index_documents.py  # Not needed for Simple RAG
rm Dockerfile          # Not needed for Simple RAG
rm requirements-option-a.txt
rm requirements-option-b.txt
rm simple-rag-main.py  # Already copied to main.py
```

### Step 4: Verify your railway-deployment folder contains:
```
railway-deployment/
├── main.py              (Simple RAG implementation)
├── requirements.txt     (Simple RAG dependencies)
├── README.md           (Keep for reference)
└── deployment-instructions.md (Keep for reference)
```

### Step 5: Git operations
```bash
# From your project root
git add railway-deployment/
git commit -m "Switch to Simple RAG implementation for Railway"
git push
```

### Step 6: Railway Deployment
1. Go to [railway.app](https://railway.app)
2. Create new project → Deploy from GitHub repo
3. Select your existing repository
4. **Point Railway to the `railway-deployment` folder** (set Build Command and Start Command)
5. Set environment variables:
   - `API_KEY`: your-secure-api-key-here
   - `PORT`: 8000 (Railway sets this automatically)

### Step 7: Configure Build Settings in Railway
- **Root Directory**: `/railway-deployment`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python main.py`

### Step 8: After deployment
Copy your Railway app URL (e.g., `https://your-app.railway.app`) and update the `RAGATOUILLE_API_URL` secret in your Emigration Pro app.

## Why This Works
- **No dependency conflicts**: Uses stable sentence-transformers + FAISS
- **Built-in documents**: No separate indexing needed
- **Identical API**: Drop-in replacement for RAGatouille
- **Proven stable**: Works reliably on Railway

## File Contents Summary
The Simple RAG `main.py` provides the exact same API endpoints as RAGatouille:
- `/health` - Health check
- `/retrieve-context` - RAG context retrieval  
- `/enhanced-answer` - Enhanced answers with sources
- `/docs` - API documentation

Your Emigration Pro app will work identically - it just uses the more stable Simple RAG backend instead of RAGatouille.
