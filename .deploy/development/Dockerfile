# -------------------------
# ------ Build Stage ------
# -------------------------
FROM node:18 AS build-stage

# Set the working directory in the container
WORKDIR /app

# Copy the package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Install beyond
RUN npm i -g beyond@1.3.2

# Build the project
RUN beyond build --pkg=@aimpact/agents-api --distribution=http --logs

# ------------------------------
# ------ Production Stage ------
# ------------------------------
FROM node:18-slim AS prod

# Set the working directory in the container
WORKDIR /app

# Copy the build result
COPY --from=build-stage /app/.beyond/builds/http/code/ ./

# Copy the package-lock.json for reproducible install
COPY --from=build-stage /app/package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Start the app
CMD [ "node", "index.js" ]
