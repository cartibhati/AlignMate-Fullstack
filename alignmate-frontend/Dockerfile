FROM node:20-alpine

WORKDIR /app

# Copy package management files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Expose port
EXPOSE 5173

# Start Vite server binding to all network interfaces
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
