# 🚀 Production Deployment: AI-FinTech (Triple-Stack)

Since your project contains **Frontend (React)**, **Backend (Node.js)**, and **AI Worker (Python)**, you should deploy them as three separate projects on Vercel or similar platforms.

---

## 1. AI Worker (The ML Brain)
*   **Platform**: [Vercel](https://vercel.com) or [Render](https://render.com)
*   **Root Directory**: `ai_worker`
*   **Build Command**: `pip install -r requirements.txt`
*   **Environment Variables**: 
    - `GEMINI_API_KEY`: (Optional for ML mode)
*   **Note**: Copy the provided `vercel.json` in the `ai_worker` folder to ensure it runs as a serverless function.

---

## 2. Backend (The Node.js API)
*   **Platform**: [Vercel](https://vercel.com)
*   **Root Directory**: `Backend`
*   **Environment Variables**:
    - `MONGODB_URI`: Your MongoDB Atlas connection string.
    - `JWT_SECRET`: A secure random string.
    - `FRONTEND_URL`: The URL of your **deployed frontend** (Step 3).
    - `AI_WORKER_URL`: The URL of your **deployed AI worker** (Step 1).
*   **CORS**: The backend will automatically whitelist your deployed frontend once `FRONTEND_URL` is set.

---

## 3. Frontend (The React App)
*   **Platform**: [Vercel](https://vercel.com)
*   **Root Directory**: `frontend`
*   **Framework Preset**: Vite
*   **Environment Variables**:
    - `VITE_API_BASE_URL`: The URL of your **deployed backend** + `/api` (e.g., `https://backend.vercel.app/api`)
    - `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID.

---

## 🔄 Final Sync Checklist
1. Deploy **AI Worker** first -> Get its URL.
2. Deploy **Backend** next -> Add `AI_WORKER_URL` to settings.
3. Deploy **Frontend** -> Add `VITE_API_BASE_URL`.
4. **Final Step**: Go back to **Backend** settings and add the `FRONTEND_URL` from Step 3.
5. **Redeploy** both for the connection to "lock in."

## 🔒 Security Reminder
- Never commit your `.env` files.
- Ensure MongoDB Atlas Network Access is set to `0.0.0.0/0` (Allow all) so Vercel can connect.
