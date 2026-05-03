# Knowledge Hub

## Prerequisites

- Git - [Download & Install Git](https://git-scm.com/downloads).
- Node.js - [Download & Install Node.js](https://nodejs.org/en/download/) and the npm package manager.

## Downloading

```
git clone {repository URL}
```

## Installing NPM modules

```
npm install
```

## Running application

```
npm start
```

After starting the app on port (4000 as default) you can open
in your browser OpenAPI documentation by typing http://localhost:4000/doc/.
For more information about OpenAPI/Swagger please visit https://swagger.io/.

## Testing

After application running open new terminal and enter:

To run all tests without authorization

```
npm run test
```

To run only one of all test suites

```
npm run test -- <path to suite>
```

To run all test with authorization

```
npm run test:auth
```

To run only specific test suite with authorization

```
npm run test:auth -- <path to suite>
```

To run refresh token tests

```
npm run test:refresh
```

To run RBAC (role-based access control) tests

```
npm run test:rbac
```

### Auto-fix and format

```
npm run lint
```

```
npm run format
```

### Debugging in VSCode

Press <kbd>F5</kbd> to debug.

For more information, visit: https://code.visualstudio.com/docs/editor/debugging

## Docker Hub

Docker image: [tati31/knowledge-hub-api](https://hub.docker.com/r/tati31/knowledge-hub-api)

## How to run

```bash
docker-compose up --build
```

## Security scan results
No critical vulnerabilities found 

48 vulnerabilities found in 18 packages
CRITICAL     0  
HIGH         24
MEDIUM       20
LOW          2  
UNSPECIFIED  2  

### Overview
Analyzed Image              

Target: nodejs-2026q1-knowledge-hub_app:latest  
digest: 8488f9c82e79                            
platform: linux/amd64                              
vulnerabilities :  0C    24H    20M     2L     2?        
size: 96 MB                                    
packages:  417                



## Gemini API Setup

This service uses **Google Gemini API** (free tier) for the `/ai/*` endpoints.
Default model: **`gemini-2.0-flash`** (configurable via `GEMINI_MODEL`).

### 1. Obtain a Gemini API key

1. Open [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in with any Google account.
3. Click **Create API key** → select or create a Google Cloud project.
4. Copy the generated key (starts with `AIza...`).

### 2. Configure environment variables

Copy the example file and paste your key into `.env`:

```bash
cp .env.example .env
```

Open `.env` and set at minimum:

```dotenv
GEMINI_API_KEY=<your-gemini-api-key>
GEMINI_MODEL=gemini-2.0-flash
GEMINI_API_BASE_URL=https://generativelanguage.googleapis.com
GEMINI_TIMEOUT_MS=30000
AI_RATE_LIMIT_RPM=20
AI_CACHE_TTL_SEC=300
```

> `.env` is git-ignored — never commit a real key. Only `.env.example`
> (with placeholder value) belongs in the repository.

### 3. Run the application

Locally:

```bash
npm install
npx prisma migrate deploy
npm run start:dev
```

Or with Docker:

```bash
docker-compose up --build
```

Swagger UI with all `/ai/*` endpoints: <http://localhost:4000/doc>

### 4. Try the AI endpoints

Get a JWT first (`POST /auth/login`), then call:

```bash
# Summarize an existing article
curl -X POST http://localhost:4000/ai/articles/<articleId>/summarize \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"maxLength":"short"}'

# Translate
curl -X POST http://localhost:4000/ai/articles/<articleId>/translate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"targetLanguage":"French"}'

# Analyze
curl -X POST http://localhost:4000/ai/articles/<articleId>/analyze \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"task":"review"}'
```

### Known limitations

- **Free-tier quotas.** Gemini free tier limits requests per minute and per
  day; the service additionally enforces `AI_RATE_LIMIT_RPM` and returns
  `429` with a `Retry-After` header on overflow.
- **Latency.** A single Gemini call typically takes 1–5 s; the service
  caches summarize/translate responses in memory for `AI_CACHE_TTL_SEC`
  seconds (keyed by `articleId` + request params + article `updatedAt`).
- **Regional availability.** Gemini API is not available in all regions —
  see Google AI Studio docs for the current list.
- **Upstream errors.** Network or 5xx errors from Gemini are retried up to
  3 times with exponential backoff; persistent failures return `503`,
  auth errors return `500` (without leaking the key).


