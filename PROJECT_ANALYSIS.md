# CARBON-CHATBOT Project Analysis

## How to Understand This Project

### What this product is
CARBON-CHATBOT is a subscription-based educational AI web app with:

- a React frontend
- an Express backend
- MongoDB persistence when `MONGO_URI` is configured
- multiple AI/chat modes
- search and AI-assisted search
- payment and receipt workflows
- user signup, login, password reset, and plan management

At a high level, the app lets a user:

1. register for a free or paid plan
2. complete payment if needed
3. log in
4. chat with one of several AI modes
5. run search workflows
6. consume tokens from a shared usage pool tied to their plan

### Main user journeys

#### 1. Registration and payment
- User fills the registration form in the frontend.
- Backend creates a user record immediately.
- If the plan is `Free Trial`, backend generates a password, stores it, assigns tokens, and emails credentials.
- If the plan is paid, backend stores the user in a pending state, frontend starts Razorpay payment, and payment verification activates the plan and emails receipt plus credentials for new users.

#### 2. Login and account recovery
- User logs in with email and password.
- Backend checks plan expiry, recalculates remaining tokens from usage history, and returns age-aware user data.
- Forgot password sends a frontend reset link by email.
- Reset password writes a new hash back to the user record.

#### 3. Chat
- User opens the main chat page and chooses a bot.
- Frontend sends prompt, session info, and optional files to one of the chat endpoints.
- Backend processes files, validates token allowance, may add RAG context, calls the selected model provider, stores chat history, and updates remaining token balance.

#### 4. Search
- User runs a search from the UI.
- Frontend calls root-level backend endpoints such as `/search` and `/Searchhistory`.
- Backend uses Serper, optionally scrapes result pages, creates a summary, stores history, and deducts tokens from the same shared pool used by chat.

### Read these files first

If you want to learn this codebase quickly, read in this order:

1. `chatbot-backend/index.js`
2. `chatbot-backend/routes/aiRoutes.js`
3. `chatbot-backend/controller/authController.js`
4. `chatbot-backend/controller/paymentController.js`
5. `chatbot-backend/controller/searchController.js`
6. `chatbot-backend/controller/aiController.js`
7. `chatbot-backend/utils/tokenLimit.js`
8. `chatbot-backend/utils/planTokens.js`
9. `chatbot-backend/model/User.js`
10. `chatbot-backend/model/ChatSession.js`
11. `chatbot-frontend/src/App.jsx`
12. `chatbot-frontend/src/main.jsx`
13. `chatbot-frontend/src/ChatUi.jsx`
14. `chatbot-frontend/src/register.jsx`
15. `chatbot-frontend/src/login.jsx`

### Simple end-to-end flow

```text
Register page
  -> POST /api/ai/register
  -> user created as free-trial active user OR paid pending user

If paid:
  Register page / Payment modal
  -> POST /api/payments/create-order
  -> Razorpay checkout
  -> POST /api/payments/verify-payment
  -> plan activated, password emailed for new users, receipt emailed

Login page
  -> POST /api/ai/login
  -> frontend stores user and remaining tokens in localStorage

Chat page
  -> POST one of:
     /api/ai/ask
     /api/ai/SmartAIask
     /api/ai/SmartAIProask
     /api/ai/SmartAINxt_ask
  -> backend stores session history and deducts tokens

Search UI
  -> POST /search
  -> POST /Searchhistory
  -> POST /userTokenStats
```

---

## Technical Analysis

## Repository shape

### Top-level structure

| Area | Purpose |
|---|---|
| `chatbot-frontend/` | React + Vite client app |
| `chatbot-backend/` | Express API server and business logic |
| `PROJECT_ANALYSIS.md` | Detailed project analysis document |
| `QUICK_REFERENCE.md` | Shorter project summary, currently partly stale |
| `SECURITY_AUDIT.md` | Separate security notes |
| `*.pdf` | Sample/reference documents and generated-style assets |

### Important backend folders

| Path | Purpose |
|---|---|
| `controller/` | Main business logic for auth, chat, search, admin, payment |
| `model/` | Mongoose schemas |
| `routes/` | Express route modules |
| `utils/` | Token logic, RAG helpers, receipt helpers, date helpers |
| `middleware/` | Mail sending, upload, receipt, templates |
| `db/` | Mongo connection |
| `Math_Data/` | Source PDFs for NCERT-style RAG indexing |

### Important frontend folders

| Path | Purpose |
|---|---|
| `src/App.jsx` | Router setup |
| `src/main.jsx` | React bootstrap |
| `src/ChatUi.jsx` | Main app shell and dominant interaction layer |
| `src/register.jsx` | Registration and upgrade form |
| `src/login.jsx` | Login flow |
| `src/PaymentModal.jsx` | Razorpay checkout helper UI |
| `src/SearchUi.jsx` | Search-specific UI |
| `src/GrokSearchUI.jsx` | Alternate AI-assisted search UI |
| `src/context/GrokContext.jsx` | Shared token-related UI context |

---

## Frontend architecture

## Entry and routing

### `src/main.jsx`
- Bootstraps React.
- Wraps the app in `BrowserRouter`.
- Wraps the app in `GrokProvider`.
- Imports `App.css` rather than `index.css` in the current active path.

### `src/App.jsx`
- Defines the top-level routes.
- Current routes are:

| Route | Component |
|---|---|
| `/register` | `Register` |
| `/login` | `Login` |
| `/forgot-password` | `ForgotPassword` |
| `/reset-password` | `ResetPassword` |
| `/home` | `ChatUI` |

There is no active protected-route layer in the current implementation. A previously more guarded router exists only as commented code.

## Main frontend control center

### `src/ChatUi.jsx`
`ChatUi.jsx` is the main frontend orchestrator and the single most important file on the client side.

Key facts:

- It is extremely large: over 11,000 lines.
- It behaves as a combined:
  - page shell
  - bot switcher
  - chat session manager
  - search launcher
  - admin utility surface
  - token tracker
  - upgrade entry point
- It depends heavily on `localStorage` for:
  - current user
  - remaining tokens
  - last session IDs per bot
  - cached token counters

This means the frontend architecture is functionally centralized rather than split into many smaller feature modules.

## Auth and registration pages

### `src/register.jsx`
- Handles both new registration and upgrade-style plan changes.
- Computes age group on the client.
- Chooses whether parent contact details are required.
- Computes price breakdown on the client using hardcoded plan tables that mirror the backend price tables.
- Starts either:
  - free-trial registration directly, or
  - Razorpay payment flow for paid registration or plan upgrade

### `src/login.jsx`
- Calls backend login.
- Stores returned user data in `localStorage`.
- Stores `globalRemainingTokens` in `localStorage`.
- Navigates to `/home`.

### Password pages
- `ForgotPassword.jsx` calls `/api/ai/forgot-password`
- `ResetPassword.jsx` calls `/api/ai/reset-password`

## Search UI and shared state

### `src/SearchUi.jsx` and `src/GrokSearchUI.jsx`
- Both run search against root-level backend endpoints.
- Both load and save history from backend and `localStorage`.
- Both refresh token stats after search usage.

### `src/context/GrokContext.jsx`
- Persists `sessionRemainingTokens` to `localStorage`.
- Acts more like a token-sharing UI helper than a full application state store.

## Frontend API usage pattern

The frontend is not using one strict API module. Calls are spread across multiple components using both `fetch` and `axios`.

### Common backend calls from frontend

| Frontend area | Backend endpoint |
|---|---|
| Login | `/api/ai/login` |
| Register | `/api/ai/register` |
| Forgot password | `/api/ai/forgot-password` |
| Reset password | `/api/ai/reset-password` |
| Change password | `/api/ai/change-password` |
| Standard chat | `/api/ai/ask` |
| SmartAI chat | `/api/ai/SmartAIask` |
| SmartAI Pro chat | `/api/ai/SmartAIProask` |
| SmartAI Nxt chat | `/api/ai/SmartAINxt_ask` |
| Save partial chat | `/api/ai/save_partial` and model-specific variants |
| Get sessions/history | `/api/ai/history`, `/api/ai/get_user_sessions`, and model-specific variants |
| Search | `/search` |
| Search history | `/Searchhistory` |
| Token stats | `/userTokenStats` |
| Grok search | frontend still appears to target `/search` and `/Searchhistory` in active paths more often than `/grokSearch` |
| Payment order | `/api/payments/create-order` |
| Payment verification | `/api/payments/verify-payment` |
| Coupon validation | `/api/payments/validate-coupon` |
| Upgrade pricing | `/api/payments/upgrade-plan` |

## Frontend state style

The frontend relies on:

- React component state for page-local logic
- `localStorage` for persistence across reloads
- `GrokContext` for a small shared token state surface

Redux packages are installed, but the active app flow shown in the current codebase does not use Redux as the main state model.

---

## Backend architecture

## Express app setup

### `chatbot-backend/index.js`
This is the backend entrypoint.

Responsibilities:

- loads environment variables
- initializes Express
- applies CORS using `process.env.FRONTEND_URL`
- parses JSON with `express.json()` and `bodyParser.json()`
- mounts `/api/ai` routes from `aiRoutes.js`
- mounts `/api/payments` routes from `paymentController.js`
- exposes search endpoints directly at root level
- serves `/assets` statically
- connects to MongoDB
- installs an unhandled rejection handler

### Route registration reality

Mounted route modules:

| Mount | Source |
|---|---|
| `/api/ai` | `routes/aiRoutes.js` |
| `/api/payments` | `controller/paymentController.js` |

Direct root-level routes from `index.js`:

| Method | Path | Handler |
|---|---|---|
| `POST` | `/search` | `getAISearchResults` |
| `POST` | `/Searchhistory` | `getUserSearchHistory` |
| `POST` | `/userTokenStats` | `getUserTokenStats` |
| `POST` | `/grokSearch` | `grokSearchResults` |
| `POST` | `/grokSearchhistory` | `grokUserSearchHistory` |

This is important because a separate `routes/searchRoutes.js` file exists but is not currently mounted.

## Controller responsibilities

### `authController.js`
Handles:

- login
- register
- forgot password
- reset password
- change password
- delete user
- get all users

Also includes:

- age-group derivation
- free-trial password generation
- plan pricing
- coupon application during registration
- login-time plan expiry handling
- user response shaping through helper utilities

### `paymentController.js`
This file is both:

- a controller
- the Express router exported at `/api/payments`

Handles:

- coupon validation
- upgrade-plan pricing lookup
- Razorpay order creation
- Razorpay signature verification
- transaction creation
- user activation and token assignment after payment
- password generation for first-time paid users
- receipt PDF generation and email sending
- webhook verification

### `searchController.js`
Handles:

- Serper-backed search
- summary generation
- search history persistence
- token stats retrieval
- search restrictions based on user age

It also contains:

- scraping logic using `axios` + `cheerio`
- summary building heuristics
- token counting for search summaries

### `groksearchController.js`
Handles:

- alternate AI-assisted search flow
- prompt construction for trusted source search and general search
- search history persistence for grok-style searches
- token accounting for the search results and summary

Despite the name, the current active configuration points to OpenAI-style chat completions using environment-backed keys, not an isolated Grok-specific SDK.

### Chat controllers

| Controller | Main role |
|---|---|
| `aiController.js` | Standard chat mode |
| `smartAiController.js` | SmartAI variant |
| `smartAiProController.js` | SmartAI Pro variant |
| `smartAiNxtController.js` | SmartAI Nxt variant |

Across these files, the implementation pattern is similar:

- parse prompt and file attachments
- normalize math and chemistry text
- classify educational topic
- enforce input token rules
- load prior session context
- optionally add RAG context
- call external model APIs
- save final or partial chat entries
- return history and session summaries

These files contain a lot of duplicated structure with model-specific differences.

## Utility layer

Important helpers:

| File | Role |
|---|---|
| `utils/tokenLimit.js` | Unified token stats and limit checks across chat and search |
| `utils/planTokens.js` | Token allocations and input-token caps per plan |
| `utils/dateUtils.js` | Plan expiry calculation and expiry checks |
| `utils/userResponse.js` | Returns age-aware user payloads to frontend |
| `utils/ragHelper.js` | Indexes PDFs and retrieves relevant NCERT chunks |
| `utils/coupons.js` | Coupon definitions |
| `utils/generateReceiptNo.js` | Receipt number generation |
| `middleware/generateReceipt.js` | Builds receipt PDFs |

---

## Database layer

## MongoDB connection behavior

### `db/connectDB.js`
MongoDB is optional at runtime in the current setup.

Behavior:

- if `MONGO_URI` exists, backend attempts to connect
- if `MONGO_URI` is missing, backend logs that it is running without persistence
- if connection fails, backend logs the error and continues

This is different from many Node apps that crash on DB connection failure.

## Actual Mongoose schemas

### User model

Source: `model/User.js`

| Field | Meaning |
|---|---|
| `resetPasswordToken` | reset token |
| `resetPasswordExpire` | reset expiry field |
| `firstName`, `lastName` | profile identity |
| `email`, `mobile` | login/contact identity |
| `dateOfBirth`, `ageGroup` | age handling |
| `parentName`, `parentEmail`, `parentMobile` | guardian data for minors |
| `subscriptionPlan`, `childPlan`, `subscriptionType` | commercial plan details |
| `basePriceINR`, `discountINR`, `gstAmount`, `totalPriceINR` | pricing fields |
| `password` | bcrypt-hashed password |
| `remainingTokens` | current stored token balance |
| `planStartDate`, `planExpiryDate`, `planExpiryEmailSent` | plan validity |
| `createdAt`, `updatedAt` | timestamps |

### ChatSession model

Source: `model/ChatSession.js`

Top-level fields:

| Field | Meaning |
|---|---|
| `sessionId` | logical session identifier |
| `email` | user link |
| `history` | array of message records |
| `grandTotalTokens` | stored aggregate token field |
| `create_time` | creation time |
| `type` | session type, default `chat` |

Message fields inside `history`:

| Field | Meaning |
|---|---|
| `prompt` | user prompt |
| `response` | model response |
| `wordCount` | word count |
| `tokensUsed` | token usage for the entry |
| `totalTokensUsed` | total token count stored with the entry |
| `botName` | bot selection |
| `create_time` | timestamp |
| `files` | attached file metadata |
| `hasFiles` | file flag |
| `fileWordCount` | file-derived word count |
| `type` | optional per-message type |

File fields:

| Field | Meaning |
|---|---|
| `filename` | original name |
| `cloudinaryUrl` | uploaded file URL |
| `publicId` | Cloudinary public ID |
| `content` | extracted text |
| `wordCount` | extracted word count |

### Transaction model

Source: `model/Transaction.js`

| Field | Meaning |
|---|---|
| `razorpay_order_id` | order identifier |
| `razorpay_payment_id` | payment identifier |
| `amount` | paid amount |
| `currency` | usually `INR` |
| `status` | success status |
| `createdAt` | timestamp |

### SearchHistory model

Source: `model/SearchHistory.js`

| Field | Meaning |
|---|---|
| `email` | user link |
| `query` | search text |
| `category` | category tag |
| `resultsCount` | result count |
| `raw` | raw mode flag |
| `summaryWordCount` | summary words |
| `summaryTokenCount` | summary tokens |
| `summary` | final summary text |
| `timestamp` | created time |
| `createdAt`, `updatedAt` | timestamps |

### GrokSearchHistory model

Source: `model/grokSearchHistory.js`

| Field | Meaning |
|---|---|
| `id` | client or generated search id |
| `email` | user link |
| `query` | search text |
| `summary` | generated summary |
| `tokenUsage.promptTokens` | prompt token estimate |
| `tokenUsage.summaryTokens` | summary token estimate |
| `tokenUsage.linkTokens` | link token estimate |
| `tokenUsage.totalTokens` | total token estimate |
| `category` | category tag |
| `resultsCount` | number of links |
| `raw` | raw mode flag |
| `timestamp` | created time |
| `createdAt`, `updatedAt` | timestamps |

## Schema drift and controller-only fields

Controllers reference or write some fields that are not explicitly declared in the current `User` schema, including:

- `country`
- `currency`
- `subscriptionStatus`
- `isActive`
- `tokensConsumed`

These fields appear in controller logic and response shaping assumptions, but they are not declared in `model/User.js`. This is important because the code suggests the product conceptually depends on them even though the formal schema does not document them.

There is also route/controller drift and helper drift, for example:

- `searchRoutes.js` suggests `/api/search/...` style routing, but actual runtime exposure is root-level search endpoints from `index.js`.
- some old commented code paths still describe older model/provider choices and older route conventions.

---

## API inventory

## Authentication and user management

Mounted under `/api/ai`:

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/ai/register` | register user or start paid signup flow |
| `POST` | `/api/ai/login` | log in |
| `POST` | `/api/ai/forgot-password` | send reset link |
| `POST` | `/api/ai/reset-password` | reset password |
| `POST` | `/api/ai/change-password` | change password |
| `GET` | `/api/ai/get_all_users` | admin-style user listing |
| `DELETE` | `/api/ai/delete_user/:id` | delete user |
| `POST` | `/api/ai/createUserManually` | manual user creation |

## Chat and session APIs

Mounted under `/api/ai`:

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/ai/ask` | standard chat |
| `POST` | `/api/ai/history` | standard chat history |
| `POST` | `/api/ai/get_user_sessions` | standard session listing |
| `POST` | `/api/ai/save_partial` | partial standard response save |
| `POST` | `/api/ai/SmartAIask` | SmartAI chat |
| `POST` | `/api/ai/SmartAIhistory` | SmartAI history |
| `POST` | `/api/ai/save_smartAi_partial` | partial SmartAI save |
| `POST` | `/api/ai/get_smartAi_sessions` | SmartAI session listing |
| `POST` | `/api/ai/SmartAIProask` | SmartAI Pro chat |
| `POST` | `/api/ai/SmartAIProhistory` | SmartAI Pro history |
| `POST` | `/api/ai/save_smartAi_Pro_partial` | partial SmartAI Pro save |
| `POST` | `/api/ai/get_smartAi_Pro_sessions` | SmartAI Pro session listing |
| `POST` | `/api/ai/SmartAINxt_ask` | SmartAI Nxt chat |
| `POST` | `/api/ai/SmartAINxt_history` | SmartAI Nxt history |
| `POST` | `/api/ai/save_smartAi_Nxt_partial` | partial SmartAI Nxt save |
| `POST` | `/api/ai/get_smartAi_Nxt_sessions` | SmartAI Nxt session listing |

## Payment APIs

Mounted under `/api/payments`:

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/payments/validate-coupon` | coupon validation |
| `POST` | `/api/payments/create-upi` | create/send UPI receipt workflow |
| `POST` | `/api/payments/upgrade-plan` | calculate upgrade pricing |
| `POST` | `/api/payments/create-order` | create Razorpay order |
| `POST` | `/api/payments/verify-payment` | verify Razorpay payment and activate plan |
| `POST` | `/api/payments/webhook` | webhook verification endpoint |

## Search APIs

Actual runtime endpoints exposed directly from `chatbot-backend/index.js`:

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/search` | primary search flow |
| `POST` | `/Searchhistory` | search history retrieval |
| `POST` | `/userTokenStats` | combined chat + search token stats |
| `POST` | `/grokSearch` | AI-assisted search |
| `POST` | `/grokSearchhistory` | AI-assisted search history |

## Not actively mounted

`chatbot-backend/routes/searchRoutes.js` defines:

- `POST /search`
- `POST /Searchhistory`

But this router is not mounted in `index.js`, so those routes do not currently exist under an `/api/search` prefix.

---

## End-to-end flows

## 1. Registration and free-trial flow

```text
Frontend register form
  -> POST /api/ai/register
  -> backend calculates age group
  -> if minor, parent data becomes mandatory and parent email can become login email
  -> if plan is Free Trial:
       generate password from first name + birth year
       hash password
       assign token limit from planTokens.js
       set plan start date
       set plan expiry using "One Time" logic
       send password email
       return activated user payload
```

Notes:

- free trial uses `getTokenLimit({ subscriptionPlan: "Free Trial" })`
- `calculatePlanExpiry("One Time")` returns `null`, so free-trial plan expiry is effectively non-date-based in the current utility implementation

## 2. Paid registration and payment verification flow

```text
Frontend register form
  -> POST /api/ai/register
  -> backend validates plan and computes price, discount, GST, and total
  -> backend creates pending user record
  -> frontend starts Razorpay with /api/payments/create-order
  -> frontend posts Razorpay payload to /api/payments/verify-payment
  -> backend verifies signature
  -> backend stores transaction
  -> backend activates user and sets plan dates
  -> if new user and password absent:
       generate password and email it
  -> backend generates receipt PDF and emails it
```

Upgrade flow uses the same payment verification path with `isUpgrade` set, but instead of creating a new user it updates the existing user's plan and tokens.

## 3. Login and password reset flow

### Login

```text
Frontend login
  -> POST /api/ai/login
  -> backend normalizes email
  -> finds user and compares bcrypt hash
  -> checks plan expiry
  -> may send plan-expired mail once
  -> recalculates remainingTokens from global token usage
  -> returns age-aware user response
  -> frontend stores user and token state in localStorage
```

### Forgot password

```text
Frontend forgot password page
  -> POST /api/ai/forgot-password
  -> backend creates JWT-based reset token
  -> stores token on user
  -> emails frontend reset URL
```

### Reset password

```text
Frontend reset page
  -> POST /api/ai/reset-password
  -> backend matches user id and reset token
  -> hashes new password
  -> clears reset token
```

## 4. Standard chat flow

```text
ChatUi.jsx
  -> user selects bot and prompt
  -> optional files are included
  -> frontend sends request to /api/ai/ask
  -> aiController processes prompt, files, tokens, session context, and response
  -> chat entry saved to ChatSession
  -> token usage added to shared usage accounting
  -> frontend refreshes token stats and session state
```

Common chat controller behaviors include:

- session creation or retrieval by `sessionId`
- token counting
- plan-based input token cap enforcement
- optional file extraction
- math/chemistry normalization
- storing per-message usage in `ChatSession.history`

## 5. SmartAI / Pro / Nxt flow differences

All three alternate chat controllers largely mirror the standard controller shape, but they differ in model selection logic and fallback/provider behavior.

### StandardAI
- main baseline chat path
- uses `aiController.js`

### SmartAI
- handled in `smartAiController.js`
- appears intended for a different provider/model strategy than standard chat

### SmartAI Pro
- handled in `smartAiProController.js`
- includes model branching and fallback behavior for stronger paid variants

### SmartAI Nxt
- handled in `smartAiNxtController.js`
- appears to be the most experimental or provider-flexible branch

Across all of them, the storage model is still `ChatSession`, with different route names and session retrieval endpoints.

## 6. Search flow

```text
Search UI
  -> POST /search with query, category, email, linkCount
  -> backend checks user exists
  -> backend limits total searches per user to 50
  -> backend blocks restricted queries for minors
  -> backend calls Serper
  -> backend takes top N organic results
  -> backend scrapes up to 3 URLs for richer summary text
  -> backend creates summary
  -> backend counts summary tokens
  -> backend checks shared token limit
  -> backend stores SearchHistory
  -> backend recalculates remaining tokens
  -> frontend can read history via /Searchhistory
```

## 7. Token accounting flow

The important architectural point is that chat and search share one token pool.

### Shared token source of truth
`utils/tokenLimit.js` is the effective source of truth for remaining tokens.

`getGlobalTokenStats(email)`:

- loads the user
- gets plan limit from `planTokens.js`
- sums chat tokens from all `ChatSession` records since `planStartDate`
- sums search tokens from `SearchHistory` since `planStartDate`
- returns:
  - plan limit
  - chat tokens used
  - search tokens used
  - total used
  - remaining tokens

`checkGlobalTokenLimit(email, newTokens)`:

- computes current stats
- checks whether the new operation would exhaust tokens
- throws if not enough tokens remain

### Current plan token allocations

From `utils/planTokens.js`:

| Plan | Child plan | Total tokens |
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

### Current input token caps

Also from `utils/planTokens.js`:

| Plan | Child plan | Input token cap |
|---|---|---|
| `WrdsAI` | `Glow Up` | `5,000` |
| `WrdsAI` | `Level Up` | `5,000` |
| `WrdsAI` | `Rise Up` | `10,000` |
| `WrdsAIPro` | `Step Up` | `10,000` |
| `WrdsAIPro` | `Speed Up` | `Infinity` |
| `WrdsAIPro` | `Scale Up` | `Infinity` |
| `WrdsAI Nxt` | `Boost Up` | `Infinity` |
| `WrdsAi Nxt` | `Boost Up` | `Infinity` |
| `Free Trial` | `DEFAULT` | `5,000` |

## 8. Plan expiry behavior

Plan expiry is handled by `utils/dateUtils.js`.

Rules:

- `Monthly` adds the number of days in the current month
- `Yearly` adds the number of days in the current year
- `One Time` returns `null`

`checkPlanExpiry(user)` returns true only when `planExpiryDate` exists and is in the past.

Login flow uses this check and can:

- send a plan-expired email
- mark subscription-related status fields
- return a user whose plan is effectively expired

## 9. RAG indexing and retrieval flow

RAG is implemented in `utils/ragHelper.js`.

### Indexing

```text
Math_Data/*.pdf
  -> text extraction via pdf-parse
  -> chunk into 1000-char windows with 200-char overlap
  -> embed each chunk using text-embedding-3-small
  -> write JSON index to MathDataEmbeddings.json
```

### Retrieval

```text
Query
  -> embed query with text-embedding-3-small
  -> compare with stored embeddings using cosine similarity
  -> sort by relevance
  -> reject if best match below 0.45
  -> keep only matches >= 0.40
  -> return up to 6 chunks as text context
```

The current RAG dataset is math-focused and backed by local JSON, not a vector database.

---

## External integrations

| Integration | Current use |
|---|---|
| MongoDB / Mongoose | persistence for users, chat sessions, search history, transactions |
| OpenAI-compatible APIs | chat completions and embeddings in multiple controllers |
| Razorpay | paid plan checkout and verification |
| Cloudinary | uploaded file storage |
| Nodemailer / email middleware | password, reset, expiry, and receipt emails |
| Serper | search results source |
| OCR/document parsing libs | file content extraction |
| Optional local/provider variants | present in controller logic for alternate chat modes |

## Notes on provider usage

The repository contains evidence of multiple provider strategies across time:

- OpenAI SDK and OpenAI-style chat completions
- references to OpenRouter-style usage in docs/comments
- fallback/provider branches for Grok, Gemini, Mistral, and others in controller logic
- local-model intentions in SmartAI-related controllers

The codebase should be understood as multi-provider capable in intent, but uneven and partially legacy in implementation.

---

## Code Reality vs Existing Docs

This section is the most important corrective part of the analysis.

## Confirmed mismatches and realities

### 1. `searchRoutes.js` exists but is not mounted
- `chatbot-backend/routes/searchRoutes.js` defines search routes.
- `chatbot-backend/index.js` does not use `app.use(...searchRoutes)`.
- Actual search endpoints are registered directly in `index.js`.

### 2. Search endpoints are root-level, not `/api/search/...`
Actual runtime paths are:

- `/search`
- `/Searchhistory`
- `/userTokenStats`
- `/grokSearch`
- `/grokSearchhistory`

Any older docs describing mounted `/api/search/getSearchResults` style routes are stale unless clearly labeled as historical or intended.

### 3. `ChatUi.jsx` is a monolithic controller/view
- The main UI file is over 11,000 lines.
- It centralizes too many concerns to think of the frontend as strongly modular.
- Any documentation that describes the frontend as cleanly separated page-by-page is overstating the current architecture.

### 4. Token limits in older docs are outdated
The live token plan numbers come from `chatbot-backend/utils/planTokens.js` and are much higher than simple example values often shown in older docs.

### 5. MongoDB is optional in runtime startup
`connectDB.js` explicitly allows the server to continue when `MONGO_URI` is missing or connection fails.

### 6. Existing docs contain encoding noise and stale route descriptions
The prior `PROJECT_ANALYSIS.md` and `QUICK_REFERENCE.md` include mojibake/garbled characters and some outdated route assumptions.

### 7. Some business fields are used in controllers but not declared in schema
The code conceptually uses user fields such as:

- `subscriptionStatus`
- `isActive`
- `currency`
- `country`
- `tokensConsumed`

These are not explicitly declared in `User.js`, so the mental model in controllers is richer than the formal schema documentation.

### 8. There is legacy and duplicated code throughout the codebase
- large commented sections remain in many files
- chat controllers repeat similar logic across four variants
- historical provider code remains beside current behavior

This means documentation should describe the live path and mention legacy presence, rather than treating all code equally active.

### 9. Some sensitive or fragile implementation details are hardcoded
Examples visible in the current code include:

- hardcoded pricing tables mirrored in frontend and backend
- a hardcoded Serper API key in `searchController.js`
- route naming inconsistencies such as `Searchhistory` and mixed capitalization

These are real implementation facts and should be described as operational risks, not ideal design.

### 10. Search and Grok-style search are not fully aligned
- the backend exposes both `/search` and `/grokSearch`
- active frontend code often still targets `/search` and `/Searchhistory`
- alternate search UI paths contain commented or partially switched logic

This suggests the search experience has evolved without a single final contract being enforced everywhere.

---

## Operational risks and fragility to keep in mind

- The frontend depends heavily on `localStorage`, so session consistency can drift from backend truth.
- The main chat UI is large enough that changes in one area can easily affect unrelated behavior.
- Search route naming and mounting are inconsistent with route file organization.
- Multiple controller branches suggest old and new provider code coexist.
- User schema and controller assumptions are not perfectly synchronized.
- Search controller contains a hardcoded external API key, which is a security and maintainability concern.
- Mongo optional mode is convenient for booting locally but can hide broken persistence in deployment-like environments.

---

## Suggested mental model for future engineers

Think about this project in five layers:

1. `register/login/payment` establishes who the user is and what plan they have
2. `tokenLimit + planTokens` decides whether the user is allowed to keep using features
3. `chat controllers + search controllers` execute the actual product behavior
4. `ChatSession + SearchHistory + User` record what happened
5. `ChatUi.jsx` stitches most of the frontend user experience together

If you hold that model in mind, the codebase becomes much easier to navigate even though the implementation has drift and duplication.

---

## Final takeaway

CARBON-CHATBOT is not just a chatbot. It is a subscription-backed educational AI platform with four overlapping chat modes, shared token accounting across chat and search, payment-driven plan activation, age-aware registration behavior, optional RAG enrichment, and a frontend centered around one very large orchestration component.

The most important thing to remember is this:

- trust the current code over the old docs
- treat root-level search endpoints as the active search API
- treat `planTokens.js` and `tokenLimit.js` as the real source of token truth
- treat `ChatUi.jsx` as the real frontend control center
- treat legacy/commented code as historical context, not proof of active architecture
