# ModernShop Enterprise Platform Documentation

ModernShop is a production-ready, highly available, full-stack enterprise e-commerce system built with React, Vite, Node.js, and MongoDB. Outfitted with intelligent automated MongoDB Atlas connection fallbacks, advanced request-tracing observability telemetry, Redis-inspired memory caching layers, security sandboxing, and a pluggable marketplace structure, ModernShop represents the pinnacle of operational security, architectural resilience, and extreme scalability.

---

## 🛠️ System Architecture Diagram

```
                 +---------------------------------------------+
                 |             WEB APP (React / Vite)          |
                 +----------------------+----------------------+
                                        | (HTTPS & WebSockets)
                                        v
                 +---------------------------------------------+
                 |            NGINX REVERSE PROXY              |
                 +----------------------+----------------------+
                                        | (Port 3000)
                                        v
  +-------------------------------------------------------------------------+
  |                      EXPRESS BACKEND ENGINE SECURE SHIELD               |
  |                                                                         |
  |  [HELMET SAFETY ENGINE]    [XSS SANITIZER & NOSQL]    [RATE LIMITER]    |
  |  Filters headers, logs suspicious activity, and throttles rapid vectors |
  +-------------------------+-------------------------+---------------------+
                            |                         |
                            v                         v
              +----------------------------+   +----------------------------+
              |   OBSERVABILITY METRICS    |   |     REDIS MEMORY CACHE     |
              |                            |   |                            |
              | Tracks req latency, route  |   | HIT/MISS route caching &  |
              | hits, status-code logging |   | instant static responses   |
              +----------------------------+   +----------------------------+
                            |
                            v
              +----------------------------+
              |     DATABASE ROUTING LAYER |
              +--------------+-------------+
                             |
              +--------------+--------------+
              | (Connected)                 | (Blocked/Failed Handshake)
              v                             v
+----------------------------+   +----------------------------+
|     MONGODB ATLAS CLOUD    |   |  HIGH-FIDELITY LOCAL JSON  |
|     (Primary Repository)   |   |   (Sovereign DB fallback)  |
+----------------------------+   +----------------------------+
```

---

## 🗄️ Database Schema Diagram

Below represents the data relations models mapped structurally:

```
+--------------------+            +--------------------+            +--------------------+
|       USERS        |            |      PRODUCTS      |            |       ORDERS       |
+--------------------+            +--------------------+            +--------------------+
| id (string) PK     | <----+     | id (string) PK     | <----+     | id (string) PK     |
| email (string)     |      |     | name (string)      |      |     | userId (string) FK |
| name (string)      |      |     | description (str)  |      |     | items (array)      |
| password (string)  |      |     | price (number)     |      |     | totalAmount (num)  |
| role (enum)        |      |     | brand (string)     |      |     | status (enum)      |
| loyaltyPoints (num)|      |     | category (string)  |      |     | createdAt (string) |
+--------------------+      |     | countInStock (num) |      |     +--------------------+
                            |     +--------------------+      |
+--------------------+      |                                 |     +--------------------+
|      REVIEWS       |      |     +--------------------+      |     |      VENDORS       |
+--------------------+      |     |      COUPONS       |      |     +--------------------+
| id (string) PK     |      |     +--------------------+      |     | id (string) PK     |
| userId (string) FK | -----+     | id (string) PK     |      |     | name (string)      |
| productId (str) FK | -----------+ | code (string)      |      |     | email (string)     |
| rating (number)    |            | discount (number)  |      |     | brandName (str) FK |
| comment (string)   |            | isActive (boolean) |      +-----+ status (enum)      |
+--------------------+            +--------------------+            | commissionPct (num)|
                                                                    +--------------------+
```

---

## 📡 REST API Documentation

### 🔓 Public / Authentication Endpoints
* **`POST /api/v2/auth/register`** 
  * Registers a new customer with a zero-start loyalty balance.
  * Inputs: `{ "name": "Jane Doe", "email": "jane@example.com", "password": "password123" }`
* **`POST /api/v2/auth/login`**
  * Exchange valid email and password for structured access tokens.
  * Inputs: `{ "email": "jane@example.com", "password": "password123" }`

### 📦 Products Catalog (Memory Cached)
* **`GET /api/v2/products`** *(Cache Live TTL: 60s)*
  * Access all active product lists with pagination filters.
* **`GET /api/v2/products/:idOrSlug`** *(Cache Live TTL: 30s)*
  * Retrieve specialized singular product metrics.

### 🔎 Enterprise Search Module
* **`GET /api/v2/search?q=laptop`** *(Cache Live TTL: 15s)*
  * Runs concurrent full-text fuzzy matching indexes or MongoDB regex lookups with trending metrics.

### 🧾 Orders & Payments Execution
* **`POST /api/v2/orders/checkout`** *(Protected)*
  * Check inventory stock alignment and submit clean orders.
* **`POST /api/v2/payments/intent`** *(Protected)*
  * Initiate secure payment gateways with checkout values.

### 📈 Business Intelligence Modules (Admin Protected)
* **`GET /api/v2/bi/analytics/advanced`**
  * Retrieve conversion funnels, monthly cohorts, sales trends, linear predictive forecasted revenue, and customer retention ratios.
* **`GET /api/v2/bi/export-sales-csv`**
  * Downloads standard high-performance tabular CSV logs reporting all order metrics.

### 🏪 Marketplace Foundation (Vendor Ecosystem)
* **`POST /api/v2/vendor/apply`**
  * prospective multi-vendor merchants submit onboarding application reviews.
* **`GET /api/v2/vendor/:vendorId/metrics`** *(Protected)*
  * Generates gross vendor revenue reports, items sold, and automatic platform commission takeaways.

### 🕵️ Observability & Telemetry (Public)
* **`GET /health`** (Redirects from root `/api/v2/health`)
  * Returns uptime status, socket logs, and detailed database fallback status.
* **`GET /metrics`** (Redirects from root `/api/v2/metrics`)
  * Returns real-time latency histograms, route counters, status distribution arrays, and [Prometheus v0.0.4](https://prometheus.io) metric lines for scrapers.

---

## 📑 Swagger OpenAPI 3.0 Sandbox Specification

Inject this raw blueprint into your Swagger UI to immediately test the ModernShop sandbox:

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "ModernShop Enterprise API Platform",
    "version": "2.1.0-Core",
    "description": "Production-grade endpoints servicing orders, caching databases, observability trace points, and vendor models."
  },
  "servers": [
    {
      "url": "http://localhost:3000/api/v2",
      "description": "Local Sandbox Container"
    }
  ],
  "paths": {
    "/health": {
      "get": {
        "summary": "Observability Check",
        "responses": {
          "200": {
            "description": "Uptime details returned."
          }
        }
      }
    },
    "/search": {
      "get": {
        "summary": "Enterprise Fuzzy Search catalog",
        "parameters": [
          {
            "name": "q",
            "in": "query",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": {
            "description": "Matching array returned."
          }
        }
      }
    }
  }
}
```

---

## 🚀 Deployment Playbook

### Frontend Deployment (Vercel)
Vercel is pre-mapped in our root `vercel.json` file. 
To deploy, install the Vercel CLI and run:
```bash
npm install -g vercel
vercel --prod
```

### Backend Container Deployment (Google Cloud Run / Render / Railway)
ModernShop provides native containerization configs. To run the full-stack system locally or on dynamic hosting engines, build the target images:
```bash
# Build unified self-contained image
docker build -t modernshop-enterprise .

# Serve container instantly on standard secure port 3000
docker run -p 3000:3000 --env-file .env modernshop-enterprise
```

Alternatively, launch the complete clustered multi-node stack complete with MongoDB replicas and cache nodes:
```bash
docker-compose up --build -d
```

---

## 💻 Developer Quick Start

1. Install local dependencies:
   ```bash
   npm install
   ```
2. Set up environments:
   ```bash
   cp .env.example .env
   ```
3. Run the fast-feedback test suites:
   ```bash
   npm run test
   ```
4. Run the validation linter:
   ```bash
   npm run lint
   ```
5. Spin up the local developer container:
   ```bash
   npm run dev
   ```

---

## 🛡️ Administrative Runbook & Backup Procedures

### Instant Database Backup Cycle
To run a zero-downtime, safe database snapshot dumping cycle, execute the backup binary runner:
```bash
chmod +x scripts/backup.sh
./scripts/backup.sh
```
This produces a compressed gzip format archive (`.tar.gz`) stored safely in `./backups` and automatically purges old archives past the 14-day storage allowance.

### Accessing Diagnostics Logs
Check system uptime telemetry directly in the web browser at `/health` or fetch Prometheus metrics at `/metrics`. Ensure that in production, you map third-party monitors (e.g., Datadog, Grafana, or NewRelic) to query `/metrics` at regular 15-second cycles.
