# -------------------------
# ------ Build Stage ------
# -------------------------
FROM node:20-bullseye AS build-stage

# Set the working directory in the container
WORKDIR /app

# Install beyond first to enable Docker caching, as the layer will not change with the installation of beyond unless the lines above are changed.
RUN npm i -g beyond@1.4.1

# Copy the package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build the project
RUN beyond build --pkg=@aimpact/agents-api --distribution=http-production --logs

# ------------------------------
# ------ Production Stage ------
# ------------------------------
FROM node:20-slim AS prod

# Set the working directory in the container
WORKDIR /app

# Copy the build result
COPY --from=build-stage /app/.beyond/builds/http-production/code/ ./

# Copy the package-lock.json for reproducible install
COPY --from=build-stage /app/package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Start the app
CMD [ "node", "index.js" ]