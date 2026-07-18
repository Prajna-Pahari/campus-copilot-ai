# Dockerfile
#
# Builds a production image for the Campus Copilot AI backend.
# Single-stage build (see Slice 7 discussion): this app has no compile/
# build step, so there's nothing for a second stage to strip out.

# --- Base image ---
# node:22-alpine: matches the Node 22 line this project was built against,
# on minimal Alpine Linux. Safe here because our dependencies (express,
# cors, dotenv) are pure JavaScript with no native bindings that could be
# affected by Alpine's musl libc.
FROM node:22-alpine

# All following instructions run relative to /app inside the container.
# Docker creates this directory automatically if it doesn't exist.
WORKDIR /app

# --- Dependency installation (cache-optimized) ---
# Copy ONLY the dependency manifest first, not the whole project. As long
# as package.json/package-lock.json don't change, Docker reuses the cached
# result of `npm install` on future builds, even if application code changes.
COPY package.json package-lock.json* ./

# --omit=dev: skip devDependencies in the production image (currently a
# no-op since we have none today, but this is the correct default so a
# future dev-only tool never accidentally ships to production).
#
# NOTE: this project doesn't have a package-lock.json committed yet.
# Once you run `npm install` locally and commit the generated lockfile,
# switch this to `npm ci --omit=dev` for stricter, faster, fully
# reproducible installs (see Slice 7 discussion for why).
RUN npm ci --omit=dev

# --- Application code ---
# Copied AFTER dependency install, so editing source files never
# invalidates the (expensive) npm install layer above.
COPY src ./src

# --- Runtime configuration ---
# Safe default only — matches env.js's own default. Real secrets
# (OPENAI_API_KEY, etc.) are injected at `docker run` time, never baked
# into the image.
ENV PORT=5000

# Documents which port the app listens on inside the container.
# This does NOT publish the port to your host machine — that happens
# separately via `docker run -p`.
EXPOSE 5000

# --- Security: run as a non-root user ---
# node:22-alpine ships with a built-in unprivileged "node" user.
# Switching to it means the app doesn't run as root inside the container.
USER node

# --- Health check ---
# Reuses the existing GET /api/health endpoint (built back in Slice 1)
# so `docker ps` and container orchestrators can see whether the app is
# actually responding, not just "the process is running."
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "fetch('http://localhost:5000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# --- Startup command ---
# Plain CMD (not ENTRYPOINT): a single, simple, overridable default start
# command — no need for ENTRYPOINT's extra rigidity for a standard web server.
CMD ["node", "src/server.js"]
