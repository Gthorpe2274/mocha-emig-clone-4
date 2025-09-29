# Use Python as the base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (needed for many Python packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libopenblas-dev \
    libomp-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements.txt from subdirectory
COPY railway-deployment/requirements.txt ./requirements.txt

# Upgrade pip and install Python dependencies
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy the rest of the project
COPY . .

# Expose port (adjust if your app uses a different one)
EXPOSE 8000

# Start command (update with your app’s entry point)
CMD ["python", "src/main.py"]