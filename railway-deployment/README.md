# Emigration Pro RAGatouille Service - Railway.app Deployment

This directory contains everything needed to deploy your RAGatouille microservice on Railway.app to power enhanced emigration reports with real-time document retrieval.

## 🚀 Quick Deployment Guide

### Step 1: Prepare Your Repository

1. **Create a new GitHub repository** (e.g., `emigration-rag-service`)
2. **Upload these files** to the repository:
   - `main.py` - FastAPI application
   - `requirements.txt` - Python dependencies
   - `index_documents.py` - Document indexing script
   - `README.md` - This file

### Step 2: Deploy to Railway.app

1. **Go to [railway.app](https://railway.app)** and sign in
2. **Click "New Project"** → "Deploy from GitHub Repo"
3. **Select your repository** (`emigration-rag-service`)
4. **Configure Environment Variables** in Railway dashboard:

   ```
   API_KEY=your-super-secret-rag-api-key-2024
   INDEX_PATH=./emigration_index
   MODEL_NAME=colbert-ir/colbertv2.0
   PORT=8000
   ```

   **Important:** Make the `API_KEY` a strong, unique secret. You'll use this same key in your Emigration Pro app.

5. **Deploy!** Railway will automatically:
   - Install Python dependencies
   - Start your FastAPI service
   - Assign a public URL (e.g., `https://your-service.railway.app`)

### Step 3: Index Your Documents

After deployment, you need to run the indexing script **once** to create your RAGatouille index:

1. **Go to your Railway project dashboard**
2. **Click "Deployments"** → Latest deployment → **"Terminal"**
3. **Run the indexing command:**
   ```bash
   python index_documents.py
   ```
4. **Wait for completion** (2-5 minutes) - you'll see:
   ```
   ✅ Emigration documents indexed successfully!
   📊 Total documents indexed: 24
   🎉 INDEXING COMPLETED SUCCESSFULLY!
   ```

### Step 4: Configure Emigration Pro

In your Emigration Pro Cloudflare Worker, set these environment variables:

```
RAGATOUILLE_API_URL=https://your-service.railway.app
RAGATOUILLE_API_KEY=your-super-secret-rag-api-key-2024
```

**Make sure the `RAGATOUILLE_API_KEY` matches exactly** what you set in Railway.app.

### Step 5: Test Integration

1. **Test Railway service health:**
   ```bash
   curl https://your-service.railway.app/health
   ```

2. **Test in Emigration Pro:**
   - Visit `/rag` in your app
   - Enter a query like "D7 visa requirements for Portugal"
   - You should see enhanced results from your RAGatouille service!

## 📋 Service Endpoints

Your Railway service provides these endpoints:

- **`GET /health`** - Health check and status
- **`POST /retrieve-context`** - RAG context retrieval
- **`POST /enhanced-answer`** - Enhanced answers with RAG + AI
- **`GET /docs`** - Interactive API documentation

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `API_KEY` | Authentication key for API access | `your-custom-api-key-here` | ✅ Yes |
| `INDEX_PATH` | Path to store RAGatouille index | `./emigration_index` | No |
| `MODEL_NAME` | RAGatouille model to use | `colbert-ir/colbertv2.0` | No |
| `PORT` | Port for the service (Railway sets this) | `8000` | No |

### Sample API Request

```bash
curl -X POST "https://your-service.railway.app/retrieve-context" \
  -H "Authorization: Bearer your-super-secret-rag-api-key-2024" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "D7 visa requirements for Portugal",
    "country": "Portugal",
    "category": "visa_requirements",
    "max_results": 5
  }'
```

## 📊 Monitoring & Maintenance

### Check Service Health
```bash
curl https://your-service.railway.app/health
```

### View Logs
- Go to Railway dashboard → Your project → "Logs"
- Monitor for any errors or performance issues

### Update Documents
To add new emigration documents:
1. Edit `index_documents.py`
2. Push changes to GitHub
3. Railway auto-deploys
4. Run `python index_documents.py` in Railway terminal

## 💰 Cost Estimation

**Railway.app Pricing:**
- **Free Tier:** $5 credit per month (sufficient for testing)
- **Pro Plan:** $20/month for unlimited usage
- **Resource Usage:** Your service will use ~512MB RAM, minimal CPU

**For 5,000-10,000 reports/month:** Expect $5-15/month total cost.

## 🔍 Troubleshooting

### Common Issues

1. **"RAGatouille model not loaded"**
   - Check Railway logs for model loading errors
   - Ensure sufficient memory (Railway provides 1GB+ for apps)
   - Verify `MODEL_NAME` environment variable

2. **"Invalid API key"**
   - Verify `API_KEY` matches between Railway and Emigration Pro
   - Check for extra spaces or special characters

3. **"Index not found"**
   - Run `python index_documents.py` in Railway terminal
   - Check logs for indexing completion messages

4. **Timeout errors**
   - RAGatouille startup can take 30-60 seconds on first deployment
   - Check Railway logs for "✅ Model loaded successfully" message

### Debug Commands

```bash
# Check if service is running
curl https://your-service.railway.app/

# Test authentication
curl -H "Authorization: Bearer your-api-key" https://your-service.railway.app/health

# View detailed API docs
open https://your-service.railway.app/docs
```

## 🎯 Next Steps

1. **Monitor Performance:** Check Railway metrics for response times
2. **Add More Documents:** Expand `index_documents.py` with more emigration info
3. **Optimize Queries:** Use Railway logs to optimize frequent queries
4. **Scale as Needed:** Railway auto-scales based on traffic

## 📞 Support

- **Railway.app Docs:** https://docs.railway.app/
- **RAGatouille GitHub:** https://github.com/bclavie/RAGatouille
- **FastAPI Docs:** https://fastapi.tiangolo.com/

---

🎉 **Congratulations!** Your RAGatouille service is now providing enhanced, source-backed emigration information for your reports!
