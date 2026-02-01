FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Install dependencies (including production only if preferred, but we need devDeps for build? No, this is runtime worker)
# We installed deps in package.json, so npm ci works.
# But 'npm ci' requires package-lock.json. I confirmed it exists.
RUN npm ci --omit=dev

COPY . .

# Start the worker
CMD ["node", "worker.js"]
