# 🚨 SECURITY FINDINGS: API Keys & Secrets Exposure

## Critical Issues Found

### 1. ❌ HARDCODED SERPER API KEY (EXPOSED)
**File**: [chatbot-backend/controller/searchController.js](chatbot-backend/controller/searchController.js#L17)

```javascript
// EXPOSED KEYS:
const SERPER_API_KEY = "030caba1631ac33e868536cda190dd632ea99d82";  // ← ACTIVE

// COMMENTED OUT (also exposed):
// const SERPER_API_KEY = "49d09f756085ba3e5cc2d434cdea914b271ceb05";
// const SERPER_API_KEY = "4065c8aa208d00278c9dfedbc5bbeaae7aaed872";
```

**Risk Level**: 🔴 **CRITICAL**
- API key is hardcoded and visible in version control
- Anyone with access to repo can abuse Serper API
- Can incur unlimited charges
- Likely already compromised (exists in GitHub history)

**Status**: ✅ Should be in `.env` file

---

### 2. ✅ OPENAI_API_KEY (Protected)
**File**: Multiple files use `process.env.OPENAI_API_KEY`

✅ **Status**: PROPERLY HANDLED - Uses environment variables
- [chatbot-backend/index.js](chatbot-backend/index.js#L24)
- [chatbot-backend/controller/groksearchController.js](chatbot-backend/controller/groksearchController.js#L13)
- [chatbot-backend/controller/smartAiProController.js](chatbot-backend/controller/smartAiProController.js#L28)
- [chatbot-backend/utils/ragHelper.js](chatbot-backend/utils/ragHelper.js#L11)

```javascript
// ✅ SECURE - Uses environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

**Note**: Key itself NOT found in repo (good!)

---

### 3. ✅ OPENAI_FREE_API_KEY (Protected)
**File**: [chatbot-backend/controller/smartAiProController.js](chatbot-backend/controller/smartAiProController.js#L28)

✅ **Status**: PROPERLY HANDLED - Uses environment variables

```javascript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_FREE_API_KEY,
});
```

---

### 4. ✅ RAZORPAY CREDENTIALS (Protected)
**File**: [chatbot-backend/controller/paymentController.js](chatbot-backend/controller/paymentController.js)

✅ **Status**: PROPERLY HANDLED - Uses environment variables

```javascript
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
```

---

### 5. ✅ CLOUDINARY CREDENTIALS (Protected)
**File**: [chatbot-backend/config/cloudinary.js](chatbot-backend/config/cloudinary.js)

✅ **Status**: PROPERLY HANDLED - Uses environment variables

```javascript
api_key: process.env.CLOUDINARY_API_KEY,
```

---

### 6. ⚠️ GROK_API_KEY References
**Files**:
- [chatbot-backend/controller/groksearchController.js](chatbot-backend/controller/groksearchController.js#L13)
- [chatbot-backend/controller/smartAiProController.js](chatbot-backend/controller/smartAiProController.js#L2077)

⚠️ **Status**: MIXED
- Uses `process.env.OPENAI_API_KEY` for Grok (same as OpenAI)
- No hardcoded values found

---

## 📋 Summary Table

| Service | API Key | Storage | Status | Risk |
|---------|---------|---------|--------|------|
| **Serper** | 3 Keys | Hardcoded | ❌ EXPOSED | 🔴 CRITICAL |
| **OpenAI** | OPENAI_API_KEY | .env | ✅ PROTECTED | 🟢 SAFE |
| **OpenAI** | OPENAI_FREE_API_KEY | .env | ✅ PROTECTED | 🟢 SAFE |
| **Razorpay** | KEY_ID + SECRET | .env | ✅ PROTECTED | 🟢 SAFE |
| **Cloudinary** | API_KEY | .env | ✅ PROTECTED | 🟢 SAFE |
| **Brevo** | BREVO_API_KEY | .env | ✅ PROTECTED | 🟢 SAFE |
| **Google Translate** | - | SDK | ✅ PROTECTED | 🟢 SAFE |
| **Ollama** | - | localhost | ✅ LOCAL | 🟢 SAFE |

---

## ⚡ Action Items

### URGENT - Do Immediately:

1. **Revoke Serper API Keys** (All 3)
   - Go to https://serper.dev/dashboard
   - Delete keys:
     - `030caba1631ac33e868536cda190dd632ea99d82`
     - `49d09f756085ba3e5cc2d434cdea914b271ceb05`
     - `4065c8aa208d00278c9dfedbc5bbeaae7aaed872`
   - Generate new key
   - Add to `.env` file

2. **Create `.env` file in backend**
   ```env
   # .env file for chatbot-backend
   MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/carbon-chatbot
   OPENAI_API_KEY=sk-...
   OPENAI_FREE_API_KEY=sk-...
   SERPER_API_KEY=new_key_here
   RAZORPAY_KEY_ID=rzp_live_...
   RAZORPAY_KEY_SECRET=...
   CLOUDINARY_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   BREVO_API_KEY=...
   FRONTEND_URL=http://localhost:5173
   GROK_API_KEY=sk-...
   CLAUDE_API_KEY=...
   MISTRAL_API_KEY=...
   ```

3. **Remove Hardcoded Serper Keys from searchController.js**

4. **Update .gitignore** (Already has `.env`, verify it's working)

5. **Rotate all API keys** in case they were used maliciously
   - Check Serper usage logs for suspicious activity
   - Check OpenAI usage for unexpected charges
   - Check Razorpay logs for fraudulent transactions

---

## 🔍 Where Each Key Should Be

### Backend (.env file - NOT in repo)
```env
# Required for Chat AI
OPENAI_API_KEY=sk-proj-...
OPENAI_FREE_API_KEY=sk-proj-...

# Required for Web Search
SERPER_API_KEY=...

# Required for Payments
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...

# Required for File Upload
CLOUDINARY_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Required for Email
BREVO_API_KEY=...

# Database
MONGO_URI=mongodb+srv://...

# Frontend URL
FRONTEND_URL=http://localhost:5173 (or production URL)
```

### Frontend (.env file - Present ✅)
```env
VITE_API_BASE_URL=https://carbon-chatbot.onrender.com
# or for local development:
# VITE_API_BASE_URL=http://localhost:8080
```

---

## 📝 Exposed in Repository

### Files with hardcoded keys:
1. ✅ `chatbot-backend/controller/searchController.js` - Line 17 (SERPER_API_KEY)

### Files with safe env references:
1. ✅ `chatbot-backend/index.js`
2. ✅ `chatbot-backend/config/cloudinary.js`
3. ✅ `chatbot-backend/controller/aiController.js`
4. ✅ `chatbot-backend/controller/smartAiController.js`
5. ✅ `chatbot-backend/controller/smartAiProController.js`
6. ✅ `chatbot-backend/controller/groksearchController.js`
7. ✅ `chatbot-backend/controller/paymentController.js`
8. ✅ `chatbot-backend/utils/ragHelper.js`

---

## 🚀 How to Fix

### Step 1: Create .env in Backend
```bash
cd chatbot-backend
touch .env
# Edit .env with your keys (see template above)
```

### Step 2: Update searchController.js
Replace hardcoded key with environment variable:

**Current (BAD):**
```javascript
const SERPER_API_KEY = "030caba1631ac33e868536cda190dd632ea99d82";
```

**Fixed (GOOD):**
```javascript
const SERPER_API_KEY = process.env.SERPER_API_KEY;

if (!SERPER_API_KEY) {
  throw new Error("SERPER_API_KEY not found in .env");
}
```

### Step 3: Add to .gitignore (Already done ✅)
```
.env
```

### Step 4: Revoke Old Keys
- Serper: https://serper.dev/dashboard
- OpenAI: https://platform.openai.com/account/api-keys
- Razorpay: https://dashboard.razorpay.com/app/keys
- Cloudinary: https://cloudinary.com/console

### Step 5: Update git history (If pushed to GitHub)
```bash
# Remove file from git history (IMPORTANT!)
git filter-branch --tree-filter 'rm -f chatbot-backend/controller/searchController.js' HEAD

# Or use git-filter-repo
git filter-repo --path chatbot-backend/controller/searchController.js --invert-paths
```

---

## ✅ Security Checklist

- [ ] Revoke Serper API keys
- [ ] Generate new Serper key
- [ ] Create .env file in backend
- [ ] Add new key to .env
- [ ] Update searchController.js to use process.env.SERPER_API_KEY
- [ ] Verify .gitignore includes .env
- [ ] Commit changes
- [ ] Remove exposed keys from git history
- [ ] Rotate all other API keys (as precaution)
- [ ] Monitor all service usage logs
- [ ] Add pre-commit hook to prevent .env commits

---

## 🛡️ Prevent Future Leaks

### Install git-secrets
```bash
# Install
brew install git-secrets

# Configure for your repo
cd CARBON_CHATBOT
git secrets --install
git secrets --register-aws  # For AWS keys
git secrets --add "sk-proj-"  # For OpenAI keys
git secrets --add "rzp_live"  # For Razorpay

# Test
echo "OPENAI_API_KEY=sk-proj-test123" | git secrets --stdin
```

### Use Environment-based CI/CD
```yaml
# Example GitHub Actions
env:
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  SERPER_API_KEY: ${{ secrets.SERPER_API_KEY }}
```

---

## 📞 Summary

| Finding | Severity | Action | Timeline |
|---------|----------|--------|----------|
| Serper keys hardcoded | 🔴 CRITICAL | Revoke immediately | NOW |
| Missing .env file | 🔴 CRITICAL | Create .env | NOW |
| Other keys in env vars | 🟢 SAFE | Monitor | Ongoing |
| Git history cleanup | 🟠 IMPORTANT | Clean history | TODAY |

**Overall Security Status**: ⚠️ **PARTIALLY COMPROMISED** (Serper key exposed)

---

*Generated: March 31, 2026*
*Recommendation: Address CRITICAL items immediately before pushing code*
