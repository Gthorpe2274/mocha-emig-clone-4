# Use Node 18 (LTS) slim image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package.json only (no lock file)
COPY package.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the source
COPY . .

# Build the app (adjust if you don’t have a build script)
RUN npm run build

# Expose default Railway port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]