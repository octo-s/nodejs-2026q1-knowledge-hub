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

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in with a Google account.
3. Click **Create API key** → choose / create a Google Cloud project.
4. Copy the generated key.
5. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
                                    

