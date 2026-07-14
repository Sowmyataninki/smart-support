# Implementation Plan - SmartSupport AI Triage & Resolution Hub

SmartSupport is a modern, AI-powered customer support dashboard designed to automate ticket classification (sentiment, urgency, and category), suggest resolutions using Retrieval-Augmented Generation (RAG) over a knowledge base, detect historically similar resolved tickets, and provide executive analytics for support managers.

This plan details a **MERN (MongoDB, Express, React, Node.js)** architecture. To guarantee immediate usability, we will build a **local-fallback architecture** that uses local file-based storage and in-memory vector search if MongoDB Atlas or Pinecone API keys are not provided.

---

## User Review Required

> [!IMPORTANT]
> **API Keys & Credentials Configuration**
> To run the AI features, a `GEMINI_API_KEY` is required. We will create a `.env` file template in the backend root directory.
> - **MongoDB:** If no `MONGODB_URI` is provided, the backend will fallback to a local JSON file database under `backend/data/db.json`.
> - **Pinecone:** If no `PINECONE_API_KEY` is provided, the backend will run a local cosine similarity search on the generated embeddings.

> [!TIP]
> **Premium Dark Mode & Visual Polish**
> The interface will be styled with Vanilla CSS using CSS Custom Properties for a premium dark mode, glassmorphism card styling, responsive flex/grid layouts, and micro-interactions (hover translations, smooth loading indicators, state transitions).

---

## Open Questions

None at this time. The requirements are fully detailed. The local fallbacks will ensure the app runs immediately even if cloud credentials are not supplied yet.

---

## Proposed Changes

We will divide the workspace into two main subdirectories:
1. `backend/` - Node.js Express server with Gemini integration.
2. `frontend/` - React SPA built with Vite and styled with Vanilla CSS.

---

### Backend Component

Summary: A Node.js and Express API server handling MongoDB connection (with JSON fallback), embedding generation, vector similarity searches, and Gemini model interactions.

#### [NEW] [backend/package.json](file:///d:/vs%20codes/project%201/backend/package.json)
Contains backend dependencies: `express`, `cors`, `dotenv`, `mongoose`, `@google/genai` (Gemini SDK), and developer tooling.

#### [NEW] [backend/.env.template](file:///d:/vs%20codes/project%201/backend/.env.template)
Template configuration showing environment variables: `PORT`, `GEMINI_API_KEY`, `MONGODB_URI`, `PINECONE_API_KEY`, `PINECONE_ENVIRONMENT`, `PINECONE_INDEX_NAME`.

#### [NEW] [backend/src/db.js](file:///d:/vs%20codes/project%201/backend/src/db.js)
Database client managing Mongoose connection to MongoDB Atlas. If `MONGODB_URI` is missing, it will serve a custom lightweight repository interface reading/writing to a local file `backend/data/db.json`.

#### [NEW] [backend/src/services/geminiService.js](file:///d:/vs%20codes/project%201/backend/src/services/geminiService.js)
Orchestrates Gemini API requests:
- **Triage classification:** Returns structured JSON containing `{ sentiment: 'Angry'|'Negative'|'Neutral'|'Positive', priority: 'High'|'Medium'|'Low', category: 'Billing'|'Technical'|'Feature Request' }`.
- **Embedding generation:** Calls Gemini's `text-embedding-004` to embed text for articles and tickets.
- **RAG Response Drafting:** Receives complaint context and articles to generate professional agent responses.
- **Summarization:** Formats email threads or long ticket histories into short handoff summaries.

#### [NEW] [backend/src/services/vectorService.js](file:///d:/vs%20codes/project%201/backend/src/services/vectorService.js)
Coordinates vector search operations. If `PINECONE_API_KEY` is not present, performs in-memory cosine-similarity calculations on embedded articles/resolved tickets stored in the local database.

#### [NEW] [backend/src/server.js](file:///d:/vs%20codes/project%201/backend/src/server.js)
Main entry point setting up Express routes, error handlers, and initializing mock articles.

---

### Frontend Component

Summary: A React single-page application configured with Vite. Styled with modern, high-fidelity Vanilla CSS (`index.css`) containing custom color tokens, responsive UI structures, and premium dark/glassmorphic panels.

#### [NEW] [frontend/package.json](file:///d:/vs%20codes/project%201/frontend/package.json)
Configures Vite, React, and `lucide-react` for modern icon components.

#### [NEW] [frontend/src/index.css](file:///d:/vs%20codes/project%201/frontend/src/index.css)
The global style guide defining:
- Harmony-tailored Dark Mode variables (Midnight Navy `#0B0F19`, slate-gray cards `#161B2B`, gradient accents, etc.)
- Fluid grid and flexbox layouts
- Glassmorphic card styling (`backdrop-filter`)
- High-fidelity tags for priority, sentiment, and categories

#### [NEW] [frontend/src/App.jsx](file:///d:/vs%20codes/project%201/frontend/src/App.jsx)
Core layout containing the top navigation (Dashboard, Customer Form, Analytics) and state management.

#### [NEW] [frontend/src/components/Dashboard.jsx](file:///d:/vs%20codes/project%201/frontend/src/components/Dashboard.jsx)
Agent's hub. Displays a beautiful Kanban-style or searchable List view of active tickets. Grouped by status: "Open", "In Progress", "Resolved".

#### [NEW] [frontend/src/components/TicketSolver.jsx](file:///d:/vs%20codes/project%201/frontend/src/components/TicketSolver.jsx)
The agent workspace. Clicking a ticket loads:
- Sentiment/Priority triage details
- Embedded KB suggestions (RAG context)
- Previously resolved similar tickets (Closed ticket database query)
- Draft response generator (Agent reviews, edits, and sends)
- Automated thread summary/handoff card

#### [NEW] [frontend/src/components/CustomerForm.jsx](file:///d:/vs%20codes/project%201/frontend/src/components/CustomerForm.jsx)
Simulation of the customer perspective. Submit tickets with title and body.
- **Voice-to-Text Feature:** Integrates browser Web Speech API (`webkitSpeechRecognition`) to let customers record voice notes that auto-transcribe directly into the ticket box.

#### [NEW] [frontend/src/components/Analytics.jsx](file:///d:/vs%20codes/project%201/frontend/src/components/Analytics.jsx)
Management dashboard showing sentiment distributions, ticket urgencies, category load, and resolution performance using custom-styled HTML/SVG visual graphics.

---

## Verification Plan

### Automated Verification
We will verify endpoints and compilation through:
- Local launch commands: `npm run dev` for both frontend and backend.
- Adding a seeding route `POST /api/articles/seed` to populate the database with 12 mock articles spanning billing, tech support, and generic FAQ policies.

### Manual Verification
1. Open the customer form, test voice-to-text transcription, and submit a ticket.
2. Verify that the backend automatically runs Gemini classification and stores it.
3. Open the Agent Dashboard, select the ticket, and verify:
   - Category/Sentiment/Priority labels are rendered accurately.
   - 3 matching KB articles are retrieved.
   - A draft reply is generated based on retrieved articles.
   - Similar past tickets are displayed (if available).
4. Edit and send the draft, checking that the ticket moves to "Resolved".
5. Navigate to Manager Analytics and confirm statistical summaries match the database.