from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import yfinance as yf
import numpy as np
import uvicorn
import traceback

# Import Veer's models
from models.risk_analyzer import RiskAnalyzer
from models.stock_predictor import StockPredictor
from services.data_fetcher import DataFetcher
from models.goal_advisor import GoalAdvisor

app = FastAPI(title="AI Unified FinTech Services")

# Enable CORS for everyone
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Error Handler to stop 500 errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"CRITICAL ERROR: {str(exc)}")
    traceback.print_exc()
    return JSONResponse(
        status_code=200, # Return 200 with error message so the frontend doesn't crash
        content={"error": True, "message": str(exc)}
    )

# Initialize models
fetcher = DataFetcher()
risk_analyzer = RiskAnalyzer()
predictor = StockPredictor()
goal_advisor = GoalAdvisor()

# --- MODELS ---
class InvestmentPlan(BaseModel):
    initial_investment: float
    monthly_sip: float
    annual_return: float
    years: int

class InvestmentSuggestionsRequest(BaseModel):
    risk_appetite: str 

# --- STOCK FEATURES ---
@app.get("/risk/{symbol}")
def analyze_stock_risk(symbol: str):
    data = fetcher.get_data(symbol)
    if data is None:
        return {"error": True, "message": "Stock not found"}
    result = risk_analyzer.analyze(data)
    return {"symbol": symbol, "analysis": result}

@app.get("/predict/{symbol}/{days}")
def predict_stock(symbol: str, days: int):
    data = fetcher.get_data(symbol)
    if data is None:
        return {"error": True, "message": "Stock not found"}
    
    current_price = float(data['Close'].iloc[-1])
    predicted_price = float(predictor.train_and_predict(data, days))
    
    return {
        "symbol": symbol,
        "current_price": round(current_price, 2),
        "predicted_price": round(predicted_price, 2)
    }

@app.post("/predict-growth")
async def predict_growth(plan: InvestmentPlan):
    avg_rate = plan.annual_return / 100
    volatility = 0.12 + (plan.annual_return / 100) * 0.2
    results = []
    current_val = float(plan.initial_investment)
    current_inv = float(plan.initial_investment)
    
    for y in range(int(plan.years) + 1):
        # Ensure we use standard Python floats, not NumPy floats
        market_variance = float(np.random.normal(0, volatility * 0.5)) if y > 0 else 0.0
        yearly_yield = avg_rate + market_variance
        
        results.append({
            "year": f"Y{y}",
            "invested": int(round(current_inv)),
            "value": int(round(current_val)),
            "ai_forecast": int(round(current_val * (1 + market_variance * 0.1))),
            "volatility_hit": float(round(market_variance * 100, 2))
        })
        
        for m in range(12):
            current_val = (current_val + plan.monthly_sip) * (1 + (yearly_yield / 12))
            current_inv += plan.monthly_sip
            
    return {"data": results}

@app.post("/risk-estimation")
async def risk_estimation(plan: InvestmentPlan):
    return_fac = plan.annual_return / 30 
    dur_fac = 1 - (plan.years / 30)
    risk_score = (return_fac * 0.75 + dur_fac * 0.25) * 100
    risk_score = min(max(risk_score, 8), 98)
    success_prob = 100 - (risk_score * 0.35)
    
    return {
        "risk_level": "High" if risk_score > 70 else "Moderate" if risk_score > 35 else "Low",
        "risk_score": int(round(risk_score)),
        "probability_of_success": float(round(min(success_prob, 99.5), 1)),
        "volatility_index": float(round(1.1 + (risk_score/25), 2)),
        "market_sentiment": "Technical Analysis (Balanced)"
    }

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

@app.post("/analyze-goal")
async def analyze_goal(data: dict):
    # data: { target, saved, monthly_sip }
    # Using python dict for flexibility since we are coming from node
    target = float(data.get('target', 0))
    saved = float(data.get('saved', 0))
    monthly_sip = float(data.get('monthly_sip', 0))
    
    result = goal_advisor.analyze_goal(target, saved, monthly_sip)
    return result

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)