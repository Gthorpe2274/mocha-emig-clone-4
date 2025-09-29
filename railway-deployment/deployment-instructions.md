1. Go to [railway.app](https://railway.app)
2. Create new project → Deploy from GitHub repo
3. Select your existing repository
4. **IMPORTANT**: Railway will automatically detect the railway.json config file
5. Set environment variables:
   - `API_KEY`: your-secure-api-key-here
   - `PORT`: 8000 (Railway sets this automatically)

### Step 7: Configure Build Settings in Railway
**The railway.json and nixpacks.toml files will automatically configure Railway correctly.**

If Railway doesn't auto-detect, manually set:
- **Root Directory**: `railway-deployment`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python main.py`


OLDER NOTES
# RAGatouille Railway Deployment - Multiple Solutions

## Quick Solutions (Try in Order)

### Option A: Proven Working Versions (RECOMMENDED FIRST)
1. Replace your `requirements.txt` with `requirements-option-a.txt`
2. Commit and push to trigger Railway deployment
3. Monitor build logs for success

```bash
cp requirements-option-a.txt requirements.txt
git add requirements.txt
git commit -m "Fix RAGatouille dependencies - Option A"
git push
```

### Option B: Force Voyager Version
1. Use `requirements-option-b.txt` instead
2. This explicitly installs voyager==2.0.3 before RAGatouille

```bash
cp requirements-option-b.txt requirements.txt
git add requirements.txt
git commit -m "Fix RAGatouille dependencies - Option B"
git push
```

### Option C: Simple RAG (Fallback Solution)
If Options A & B fail, use the simple implementation:

1. Replace `main.py` with `simple-rag-main.py`
2. Replace `requirements.txt` with `requirements-simple-rag.txt`
3. Deploy

```bash
cp simple-rag-main.py main.py
cp requirements-simple-rag.txt requirements.txt
git add main.py requirements.txt
git commit -m "Switch to simple RAG implementation"
git push
```

### Option D: Dockerfile Approach
Use the provided Dockerfile for maximum control:

1. Add the Dockerfile to your repository
2. Railway will automatically detect and use it
3. Provides step-by-step dependency installation

```bash
git add Dockerfile
git commit -m "Add Dockerfile for controlled builds"
git push
```

## Why These Work

**Option A**: Uses proven version combinations that work together
**Option B**: Forces voyager installation before RAGatouille to avoid conflicts  
**Option C**: Eliminates complex dependencies entirely
**Option D**: Dockerfile gives complete control over build process

## Railway-Specific Tips

1. **Check Build Logs**: Railway → Your Project → "Logs" tab
2. **Environment Variables**: Set these in Railway dashboard:
   - `API_KEY`: Your custom auth token
   - `INDEX_PATH`: `./emigration_index` (optional)
   - `MODEL_NAME`: `colbert-ir/colbertv2.0` (optional)

3. **Build Time**: Allow 5-10 minutes for ML dependencies to install
4. **Memory**: Railway provides sufficient memory for these models

## Testing Your Deployment

Once deployed, test with:

```bash
# Health check
curl https://your-app.railway.app/health

# Test query
curl -X POST "https://your-app.railway.app/retrieve-context" \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"query": "Portugal visa requirements", "max_results": 3}'
```

## If All Options Fail

1. Check Railway build logs for specific error messages
2. Try the Simple RAG option (Option C) - it's very reliable
3. Consider using a different hosting platform like Render or Heroku
4. Contact Railway support if it's a platform-specific issue

The Simple RAG implementation (Option C) is actually very effective and avoids all dependency issues while providing 90% of RAGatouille's functionality.
