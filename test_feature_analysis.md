# Test Feature End-to-End Analysis

The Test Preparation Feature provides a dynamically generated 10-question MCQ quiz for specific user-selected chapters. It uses a combination of retrieval-augmented generation (RAG) and fallback concept mapping to provide a resilient, automated testing flow.

Here is a full architectural breakdown:

## 1. Frontend Flow & User Interface (`chatbot-frontend`)
The frontend organizes the test via `TestMain.jsx`, implementing a multi-step user flow. 

**Component Flow:**
1. **`TestDashboard.jsx` (Class/Subject/Chapter Selection):**
   - Fetches the curriculum structure from **`GET /api/ai/math-chapters`**. 
   - Displays selectable grids (Class \> Subject \> Chapter).
2. **`TestInterface.jsx` (Active Test Context):**
   - Fetches generated questions from **`POST /api/ai/test-prep/questions`**.
   - Initiates a **`10-minute countdown timer`** (`600s`).
   - Handles tracking of the current active test, iterating through questions, and matching standard options (A, B, C, D) tracked globally using an `answers` object mapping question indexes to selected `optionIndex`.
   - Renders Math properties cleanly with `MathText.jsx`.
3. **`TestResults.jsx` & `TestReview.jsx`:**
   - Evaluates correct choices locally by comparing state and `test.correctIndex`.
   - Evaluates a total score and final time tracking once the test is explicitly submitted or timer exhausts.

## 2. API Communication Details & JSON Formats
The system routes two primary calls from the React UI to the Node/Express backend (`chatbot-backend`).

### A) Curriculum Loading (`GET /api/ai/math-chapters`)
Provided by `chapterController.js`. It recursively scans the backend's local `Math_Data` directory tree structure (`Math_Data/{Class}/{Subject}/{Chapter.pdf}`).

**Response Schema:**
```json
{
  "success": true,
  "count": 55,
  "structure": [
    {
      "id": "Class_10",
      "name": "Class_10",
      "subjects": [
        {
           "id": "Class_10/Maths",
           "name": "Maths",
           "className": "Class_10",
           "chapters": [
              {
                 "id": "Class_10/Maths/Polynomials",
                 "name": "Polynomials",
                 "fileName": "Polynomials.pdf",
                 "className": "Class_10",
                 "subjectName": "Maths"
              }
           ]
        }
      ]
    }
  ],
  "chapters": [ ...list of all extracted flattened chapters ]
}
```

### B) Question Generation (`POST /api/ai/test-prep/questions`)
Triggered when the user hits "Start Test". Provided by `testPrepController.js`. Payload format:
```json
{
  "chapterId": "Class_10/Maths/Polynomials",
  "chapterName": "Polynomials",
  "difficulty": "easy" // or medium/difficult 
}
```

## 3. RAG (Retrieval-Augmented Generation) Service (`python-rag-service`)
Before engaging the LLM to generate the questions, the backend fetches context related to standard definitions and logic found inside the specific PDF chapter. 
1. The Express backend asks the Python service (via `axios.post` to `/rag/chapters/retrieve` inside `chapterRagBridge.js`).
2. Payload asks the Python FAISS store to understand core NCERT concepts, pulling top matches (`8` for generalized vectors, `10` specific to math).
3. The sentences from the Python chunk vectors are processed securely with `cleanText` and `splitIntoSentences` in Node. This is then flattened into an aggregated Markdown snippet (max 9000 chars) forming `contextText`.

## 4. LLM Calling & Prompts (`chatbot-backend`)
Controlled primarily via `testPrepController.js` logic and error fallbacks.

- **Primary Model:** Custom explicit endpoint referencing `gpt-5-nano` (`https://api.openai.com/v1/responses`) using reasoning effort `low`.
- **Secondary Fallback:** `gpt-4o-mini` standard chat completion via OpenAI SDK.

**LLM Flow Setup:**
1. A prompt enforces exactly **`10 questions`**, self-contained nature (`No "as seen above" phrasing`), and avoiding explicit LaTeX notation (escapes directly to `sin theta` and `pi`). Focuses entirely on NCERT schema alignments mapping back exactly to the context block injected safely via the RAG store.
2. An attempt looping logic (`max 3 attempts`) engages if parsing fails. It requests specific "repairs" via additional prompt injections such as *"You returned only X usable questions... Keep the new questions self-contained"*.
3. **Data Verification**: Custom algorithms verify regex matches and text patterns of the questions specifically disallowing references like `What is ab` which hallucinate external context. Options matching identically or breaking boundaries fail parsing and trigger repairs. 
4. If invalid JSON is presented, an additional standalone `repairQuestionsJson` prompt attempts to forcibly extract just the array payload. 

**Schema LLM provides on output:**
```json
{
  "questions": [
    {
      "question": "Which of the following describes the degree of a non-zero constant polynomial?",
      "options": ["0", "1", "Not defined", "Any real number"],
      "correctIndex": 0,
      "explanation": "A constant polynomial has a degree measuring 0."
    }
  ]
}
```

## 5. Absolute Failure Backup mechanism (`buildFallbackMathPaper`)
If the LLM absolutely structurally fails returning standard outputs locally during connection loss (or if 3 generative attempts continually crash/hallucinate structure details):
- The `testPrepController.js` attempts to structurally write its *own* quiz dynamically scanning the pure string text array given by RAG. 
- Using regex `^(.{12,170}?)\s+is called\s+(.{3,90})$/i`, it isolates terms natively mapping definitions to objects.
- It slices distracting logic and creates standard text prompts like `Which of the following best describes ___?` effectively building questions independent of any generative model runtime dynamically entirely via JS.
