# Exact File Operations for Railway Deployment

## Your Repository Structure
You already have the `railway-deployment` folder with all necessary files. Here are the **precise operations** needed:

## Step 1: Replace main.py
**Location:** `railway-deployment/main.py`
**Action:** REPLACE the entire file
**Source:** Copy content from `railway-deployment/simple-rag-main.py`

```bash
# In your project root
cp railway-deployment/simple-rag-main.py railway-deployment/main.py
```

## Step 2: Replace requirements.txt  
**Location:** `railway-deployment/requirements.txt`
**Action:** REPLACE the entire file
**Source:** Copy content from `railway-deployment/requirements-simple-rag.txt`

```bash
# In your project root
cp railway-deployment/requirements-simple-rag.txt railway-deployment/requirements.txt
```

## Step 3: Clean up files (OPTIONAL - for cleaner repo)
**Files to DELETE:**
- `railway-deployment/index_documents.py` (not needed for Simple RAG)
- `railway-deployment/Dockerfile` (not needed for Simple RAG)
- `railway-deployment/requirements-option-a.txt` (backup file)
- `railway-deployment/requirements-option-b.txt` (backup file)
- `railway-deployment/simple-rag-main.py` (already copied to main.py)

```bash
# Optional cleanup commands
rm railway-deployment/index_documents.py
rm railway-deployment/Dockerfile  
rm railway-deployment/requirements-option-a.txt
rm railway-deployment/requirements-option-b.txt
rm railway-deployment/simple-rag-main.py
```

## Step 4: Verify your railway-deployment folder contains:
```
railway-deployment/
├── main.py              (Simple RAG implementation)
├── requirements.txt     (Simple RAG dependencies)  
├── README.md           (Keep for reference)
├── deployment-instructions.md (Keep for reference)
└── RAILWAY_DEPLOYMENT_INSTRUCTIONS.md (Keep for reference)
```

## Step 5: Git operations
```bash
# From your project root
git add railway-deployment/
git commit -m "Switch to Simple RAG implementation for Railway"
git push
```

## Step 6: Railway Configuration
1. Go to [railway.app](https://railway.app)
2. Connect your existing GitHub repository
3. **IMPORTANT:** Configure these build settings:
   - **Root Directory**: `railway-deployment`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main.py`

## Step 7: Environment Variables in Railway
Set these in Railway dashboard:
- `API_KEY`: `your-secure-api-key-here` (choose a strong password)
- `PORT`: `8000` (Railway sets this automatically)

## Step 8: After Railway Deployment
1. Copy your Railway app URL (e.g., `https://your-app.railway.app`)
2. In your Emigration Pro app, update the `RAGATOUILLE_API_URL` secret with this URL
3. Test the integration at `/rag` in your app

## Summary: Only 2 Files Need Changing
1. **REPLACE:** `railway-deployment/main.py` ← `railway-deployment/simple-rag-main.py`
2. **REPLACE:** `railway-deployment/requirements.txt` ← `railway-deployment/requirements-simple-rag.txt`

That's it! Everything else stays the same.
