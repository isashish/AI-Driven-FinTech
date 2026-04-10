from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yfinance as yf
import numpy as np
import uvicorn

# Import Veer's models
from models.risk_analyzer import RiskAnalyzer
from models.stock_predictor import StockPredictor
from services.data_fetcher import DataFetcher

app = FastAPI(title="AI Unified FinTech Services")

# Enable CORS for frontend/backend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models
fetcher = DataFetcher()
risk_analyzer = RiskAnalyzer()
predictor = StockPredictor()

# --- MODELS ---
class InvestmentPlan(BaseModel):
    initial_investment: float
    monthly_sip: float
    annual_return: float
    years: int

class InvestmentSuggestionsRequest(BaseModel):
    risk_appetite: str  # Low / Medium / High

# --- CORE ROUTES ---
@app.get("/")
def home():
    return {"message": "AI Unified FinTech Services Running (Stock + Investment)"}

# --- STOCK FEATURES (from ai-services) ---
@app.get("/risk/{symbol}")
def analyze_stock_risk(symbol: str):
    data = fetcher.get_data(symbol)
    if data is None:
        raise HTTPException(status_code=404, detail="Stock not found")
    result = risk_analyzer.analyze(data)
    return {"symbol": symbol, "analysis": result}

@app.get("/predict/{symbol}/{days}")
def predict_stock(symbol: str, days: int):
    data = fetcher.get_data(symbol)
    if data is None:
        raise HTTPException(status_code=404, detail="Stock not found")
    current_price = data['Close'].iloc[-1]
    predicted_price = predictor.train_and_predict(data, days)
    return {
        "symbol": symbol,
        "current_price": round(current_price, 2),
        "predicted_price": round(predicted_price, 2)
    }

@app.post("/suggestions")
def get_stock_suggestions(request: InvestmentSuggestionsRequest):
    symbols = ['RELIANCE', 'TCS', 'INFY', 'SBIN', 'ITC']
    results = []
    for symbol in symbols:
        ticker = yf.Ticker(symbol + ".NS")
        data = ticker.history(period="6mo")
        if data.empty: continue
        returns = data['Close'].pct_change().dropna()
        volatility = float(returns.std() * np.sqrt(252))
        current_price = float(data['Close'].iloc[-1])
        
        risk = "Low" if volatility < 0.2 else "Medium" if volatility < 0.4 else "High"
        if risk.lower() == request.risk_appetite.lower():
            results.append({"symbol": symbol, "price": round(current_price, 2), "risk": risk})
            
    return {"risk_appetite": request.risk_appetite, "suggestions": results}

# --- INVESTMENT FEATURES (from ai_worker) ---
@app.post("/predict-growth")
async def predict_growth(plan: InvestmentPlan):
    try:
        years = plan.years
        avg_rate = plan.annual_return / 100
        volatility = 0.12 + (plan.annual_return / 100) * 0.2
        results = []
        current_val = plan.initial_investment
        current_inv = plan.initial_investment
        
        for y in range(years + 1):
            market_variance = np.random.normal(0, volatility * 0.5) if y > 0 else 0
            yearly_yield = avg_rate + market_variance
            results.append({
                "year": f"Y{y}",
                "invested": round(current_inv),
                "value": round(current_val),
                "ai_forecast": round(current_val * (1 + market_variance * 0.1)),
                "volatility_hit": round(market_variance * 100, 2)
            })
            for m in range(12):
                current_val = (current_val + plan.monthly_sip) * (1 + (yearly_yield / 12))
                current_inv += plan.monthly_sip
        return {"data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/risk-estimation")
async def risk_estimation(plan: InvestmentPlan):
    try:
        return_fac = plan.annual_return / 30 
        dur_fac = 1 - (plan.years / 30)
        risk_score = (return_fac * 0.75 + dur_fac * 0.25) * 100
        risk_score = min(max(risk_score, 8), 98)
        success_prob = 100 - (risk_score * 0.35)
        if plan.years > 10: success_prob += 5
        return {
            "risk_level": "High" if risk_score > 70 else "Moderate" if risk_score > 35 else "Low",
            "risk_score": round(risk_score),
            "probability_of_success": round(min(success_prob, 99.5), 1),
            "volatility_index": round(1.1 + (risk_score/25), 2),
            "market_sentiment": "Technical Analysis (ML Mode)"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai-suggestions")
async def ai_suggestions(plan: InvestmentPlan):
    suggestions = []
    if plan.annual_return > 14:
        suggestions.append("14%+ returns require Small/Mid-cap exposure. Mix with 20% Index funds for protection.")
    else:
        suggestions.append("Your target is safe. Consider a 'Step-up SIP' of 10% annually to reach goals faster.")
    if plan.years < 3:
        suggestions.append("Short term horizon detected. Liquid/Hybrid funds are safer than pure equity.")
    elif plan.years > 7:
        suggestions.append("Excellent long-term outlook. staying disciplined is key for compounding.")
    return {"suggestions": suggestions}