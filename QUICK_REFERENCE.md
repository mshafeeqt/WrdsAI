# CARBON-CHATBOT Quick Reference

## What This Project Is
CARBON-CHATBOT is a subscription-based educational AI platform with:

- React + Vite frontend
- Express backend
- MongoDB models for users, chat, search, and payments
- multiple AI chat modes
- web search and AI-assisted search
- Razorpay payments
- shared token accounting across chat and search

## Fast Mental Model

```text
Register / Upgrade
  -> /api/ai/register
  -> /api/payments/create-order
  -> /api/payments/verify-payment

Login
  -> /api/ai/login

Use app
  -> chat endpoints under /api/ai
  -> search endpoints at root level

Usage tracking
  -> token totals come from ChatSession + SearchHistory
  -> plan limits come from utils/planTokens.js
```

## Repo Map

| Path | Role |
|---|---|
| `chatbot-frontend/` | React client |
| `chatbot-backend/` | Express server |
| `chatbot-backend/controller/` | Main business logic |
| `chatbot-backend/model/` | Mongoose schemas |
| `chatbot-backend/utils/` | Tokens, dates, RAG, helpers |
| `PROJECT_ANALYSIS.md` | Full authoritative analysis |

## Frontend At A Glance

| File | Role |
|---|---|
| `src/main.jsx` | app bootstrap |
| `src/App.jsx` | router |
| `src/ChatUi.jsx` | main app shell and largest orchestration file |
| `src/register.jsx` | registration and upgrade flow |
| `src/login.jsx` | login flow |
| `src/PaymentModal.jsx` | payment helper UI |
| `src/SearchUi.jsx` | search UI |
| `src/GrokSearchUI.jsx` | alternate search UI |

Current routes:

- `/regix*ster`
- `/login`
- `/forgot-password`
- `/reset-password`
- `/home`

## Backend At A Glance

| File | Role |
|---|---|
| `index.js` | Express startup and route mounting |
| `routes/aiRoutes.js` | `/api/ai` routes |
| `controller/paymentController.js` | `/api/payments` router |
| `controller/authController.js` | auth, registration, user management |
| `controller/aiController.js` | standard chat |
| `controller/smartAiController.js` | SmartAI chat |
| `controller/smartAiProController.js` | SmartAI Pro chat |
| `controller/smartAiNxtController.js` | SmartAI Nxt chat |
| `controller/searchController.js` | search + token stats |
| `controller/groksearchController.js` | AI-assisted search |

## Active API Paths

### Auth and user
- `POST /api/ai/register`
- `POST /api/ai/login`
- `POST /api/ai/forgot-password`
- `POST /api/ai/reset-password`
- `POST /api/ai/change-password`
- `GET /api/ai/get_all_users`
- `DELETE /api/ai/delete_user/:id`
- `POST /api/ai/createUserManually`

### Chat
- `POST /api/ai/ask`
- `POST /api/ai/history`
- `POST /api/ai/get_user_sessions`
- `POST /api/ai/save_partial`
- `POST /api/ai/SmartAIask`
- `POST /api/ai/SmartAIhistory`
- `POST /api/ai/save_smartAi_partial`
- `POST /api/ai/get_smartAi_sessions`
- `POST /api/ai/SmartAIProask`
- `POST /api/ai/SmartAIProhistory`
- `POST /api/ai/save_smartAi_Pro_partial`
- `POST /api/ai/get_smartAi_Pro_sessions`
- `POST /api/ai/SmartAINxt_ask`
- `POST /api/ai/SmartAINxt_history`
- `POST /api/ai/save_smartAi_Nxt_partial`
- `POST /api/ai/get_smartAi_Nxt_sessions`

### Payments
- `POST /api/payments/validate-coupon`
- `POST /api/payments/create-upi`
- `POST /api/payments/upgrade-plan`
- `POST /api/payments/create-order`
- `POST /api/payments/verify-payment`
- `POST /api/payments/webhook`

### Search
- `POST /search`
- `POST /Searchhistory`
- `POST /userTokenStats`
- `POST /grokSearch`
- `POST /grokSearchhistory`

## Important Data Models

| Model | Stores |
|---|---|
| `User` | profile, guardian info, pricing fields, password, remaining tokens, plan dates |
| `ChatSession` | session history, prompts, responses, file metadata, token usage |
| `Transaction` | Razorpay payment records |
| `SearchHistory` | search summaries and token counts |
| `GrokSearchHistory` | AI-assisted search records and token usage |

## Token System

Single source of truth:

- `chatbot-backend/utils/planTokens.js`
- `chatbot-backend/utils/tokenLimit.js`

Current plan token totals:

| Plan | Child plan | Tokens |
|---|---|---|
| `WrdsAI` | `Glow Up` | `200,000` |
| `WrdsAI` | `Level Up` | `500,000` |
| `WrdsAI` | `Rise Up` | `1,000,000` |
| `WrdsAIPro` | `Step Up` | `500,000` |
| `WrdsAIPro` | `Speed Up` | `1,000,000` |
| `WrdsAIPro` | `Scale Up` | `2,000,000` |
| `WrdsAI Nxt` | `Boost Up` | `500,000` |
| `WrdsAi Nxt` | `Boost Up` | `500,000` |
| `Free Trial` | `DEFAULT` | `3,000` |

Shared usage logic:

- chat tokens come from `ChatSession`
- search tokens come from `SearchHistory`
- totals are calculated from `planStartDate`

## Key Flows

### Free trial
```text
Register -> /api/ai/register
  -> backend creates user
  -> generates password
  -> emails password
  -> assigns free-trial tokens
```

### Paid signup
```text
Register -> /api/ai/register
  -> pending user created
  -> Razorpay order
  -> /api/payments/verify-payment
  -> transaction saved
  -> plan activated
  -> password emailed for new users
  -> receipt emailed
```

### Chat
```text
ChatUi.jsx
  -> one of /api/ai/*ask endpoints
  -> backend processes files + context + tokens
  -> ChatSession updated
```

### Search
```text
Search UI
  -> /search
  -> summary + links returned
  -> SearchHistory updated
  -> token stats refreshed via /userTokenStats
```

### RAG
```text
Math_Data PDFs
  -> embeddings JSON
  -> similarity search
  -> relevant context injected into chat flow
```

## Known Code Realities

- `searchRoutes.js` exists but is not mounted.
- Active search endpoints are root-level, not `/api/search/...`.
- `src/ChatUi.jsx` is the dominant frontend controller/view and is very large.
- MongoDB startup is optional when `MONGO_URI` is missing.
- Some controller-used user fields are not explicitly declared in `model/User.js`.
- There is substantial commented legacy code in chat and provider logic.
- Pricing tables are duplicated in frontend and backend.
- `searchController.js` currently contains a hardcoded Serper API key.

## Read This Next

For the full repo-grounded walkthrough, read:

- `PROJECT_ANALYSIS.md`

For fastest code familiarization, open:

1. `chatbot-backend/index.js`
2. `chatbot-backend/controller/authController.js`
3. `chatbot-backend/controller/paymentController.js`
4. `chatbot-backend/controller/searchController.js`
5. `chatbot-backend/utils/tokenLimit.js`
6. `chatbot-frontend/src/ChatUi.jsx`
