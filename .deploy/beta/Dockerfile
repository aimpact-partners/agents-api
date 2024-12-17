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
RUN npm i -g beyond@1.2.1

# Build the project
RUN beyond build --pkg=@aimpact/chat-api --distribution=http-beta --logs

# ------------------------------
# ------ Production Stage ------
# ------------------------------
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy only the necessary node_modules
COPY --from=build-stage /app/node_modules ./node_modules

# Copy only the built files from the previous stage
COPY --from=build-stage /app/.beyond/builds/http-beta/code/. .

# Your start command here
CMD [ "node", "index.js" ]
