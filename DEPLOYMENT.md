# 🚀 Deployment Guide: AI-FinTech (Monorepo)

To deploy your full-stack application on Vercel, you will need to follow these steps. Since you have a monorepo structure, you will create **two separate projects** in the Vercel Dashboard (one for Backend and one for Frontend).

---

## 1. Database Setup (Crucial)
Vercel is serverless and does not include a database. You must use a cloud-hosted MongoDB instance (like **MongoDB Atlas**).
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free cluster.
2. Get your connection string (e.g., `mongodb+srv://<username>:<password>@cluster.mongodb.net/AI-FinTech`).
3. Ensure you allow access from "Anywhere" (0.0.0.0/0) in Atlas Network Access settings, as Vercel IP addresses are dynamic.

---

## 2. Deploying the Backend
1. Go to the [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New" > "Project"**.
2. Select your GitHub repository.
3. **Project Name**: `ai-fintech-backend` (or similar).
4. **Root Directory**: Select `Backend`.
5. **Framework Preset**: Select `Other` (Vercel will detect `vercel.json`).
6. **Environment Variables**: Add the following:
   - `MONGODB_URI`: Your MongoDB Atlas string.
   - `JWT_SECRET`: A long random string.
   - `CLAUDE_API_KEY`: Your Anthropic key.
   - `FRONTEND_URL`: Leave blank or set to the URL of your frontend project after it's deployed.
7. Click **Deploy**.

---

## 3. Deploying the Frontend
1. Go to the Vercel Dashboard and click **"Add New" > "Project"** again.
2. Select the **same** GitHub repository.
3. **Project Name**: `ai-fintech-frontend`.
4. **Root Directory**: Select `frontend`.
5. **Framework Preset**: Select `Vite`.
6. **Build Command**: `npm run build`
7. **Output Directory**: `dist`
8. **Environment Variables**: Add the following:
   - `VITE_API_BASE_URL`: The URL of your **Backend** deployment + `/api` (e.g., `https://ai-fintech-backend.vercel.app/api`).
9. Click **Deploy**.

---

## 4. Final Updates (Sync URLs)
Once both are deployed:
1. Go to your **Backend** project on Vercel > Settings > Environment Variables.
2. Update/Add `FRONTEND_URL` with your **Frontend's** Vercel URL.
3. Redeploy the backend for changes to take effect.

---

### Important Notes:
- **CORS**: The backend is configured to allow requests from the origin specified in `FRONTEND_URL`. 
- **Serverless**: Vercel will spin up serverless functions for each route in your backend automatically based on the `vercel.json` I created for you.
