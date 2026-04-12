# AI-Driven FinTech Platform

An intelligent, all-in-one financial health platform that combines AI-powered insights with practical tools. Track goals, optimize debt, simulate scenarios, and receive personalized financial guidance.

**Live Demo:** [https://ai-driven-fintech.vercel.app/](https://ai-driven-fintech.vercel.app/)

## ✨ Key Features

- **📊 Smart Dashboard** – Real-time financial health score with actionable insights
- **🎯 Goal Planner** – Set, track, and achieve financial goals with AI guidance
- **📈 Investment Insights** – Portfolio analysis and smart allocation recommendations
- **💳 Debt Optimizer** – Crush debt faster with avalanche & snowball strategies
- **🔬 What-If Simulator** – Model financial scenarios before you commit
- **🤖 AI Advisor** – Chat with Claude AI for personalised financial advice

## 🛠️ Tech Stack

- **Frontend:** React
- **Backend:** Node.js with Express
- **Database:** MongoDB
- **AI Integration:** Claude API
- **Deployment:** Vercel

## 🚀 Local Setup

### Prerequisites
- Node.js (v16+)
- npm or yarn
- MongoDB
- Python 3.9+ (for AI service)

### Backend Setup

bash
cd Backend
npm install
# Create .env file with MONGO_URI, JWT_SECRET, CLAUDE_API_KEY
npm run dev


### Frontend Setup
bash
cd frontend
npm install
npm start

### AI Service (Optional)
bash
cd python-ai-service
pip install -r requirements.txt
python app.py

###  📁 Project Structure
AI-Driven-FinTech/
├── Backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── styles/
│   └── package.json
├── python-ai-service/
└── README.md

### 🤝 Contributing
Fork the repository

Create a feature branch (git checkout -b feature/AmazingFeature)

Commit your changes (git commit -m 'Add some AmazingFeature')

Push to the branch (git push origin feature/AmazingFeature)

Open a Pull Request

### 📄 License
MIT License

###  🙏 Acknowledgements
Claude AI by Anthropic

Vercel for deployment

All open-source contributors
