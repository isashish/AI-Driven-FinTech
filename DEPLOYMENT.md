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
2. Click **Import** next to your GitHub repository.
3. On the **"Configure Project"** screen, look for **"Root Directory"**. 
4. Click the small **"Edit"** link next to the folder path (it might just show `./`). Select the `Backend` folder and click **Continue**.
5. **Framework Preset**: This should automatically switch to **"Other"** (Vercel will correctly use your `vercel.json`).
6. **Environment Variables**: Scroll down and click the **"Environment Variables"** bar to expand it. Add your keys:
   - `MONGODB_URI`: Your Atlas string.
   - `JWT_SECRET`: Any random strong string.
   - `CLAUDE_API_KEY`: Your Anthropic key.
7. Click **Deploy**.

---

## 3. Deploying the Frontend
1. Repeat: **"Add New" > "Project"** and select the **same** repository.
2. **Root Directory**: Click the small **"Edit"** link and select the `frontend` folder.
3. **Framework Preset**: Vercel should auto-detect **"Vite"**.
4. **Environment Variables**: Expand the accordion and add:
   - `VITE_API_BASE_URL`: The URL of your **Backend** (e.g., `https://your-backend.vercel.app/api`).
5. Click **Deploy**.

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
