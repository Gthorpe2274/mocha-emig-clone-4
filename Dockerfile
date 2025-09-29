# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies needed for faiss and numpy
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libopenblas-dev \
    libomp-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements.txt
COPY requirements.txt .

# Upgrade pip and install dependencies cleanly
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Environment settings
ENV PYTHONUNBUFFERED=1

# Expose port (Railway overrides with $PORT)
EXPOSE 8000

# Start FastAPI app (single worker for stability on Railway free tier)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]