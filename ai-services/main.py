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
    
    # 1. Inflation & Step-up Logic (6% inflation benchmark)
    if plan.years >= 8:
        suggestions.append(f"In {plan.years} years, inflation will likely double costs. Consider a 10% annually increasing 'Step-up SIP' to maintain real purchasing power.")
    
    # 2. Tax Efficiency (Real-world LTCG)
    if plan.years >= 1:
        suggestions.append("Long-term holding (1yr+) qualifies for 12.5% LTCG tax on gains above ₹1.25L. Plan your partial withdrawals to minimize tax liability.")
    
    # 3. High Return Analysis (Small-Cap focus)
    if plan.annual_return >= 15:
        suggestions.append(f"Targeting {plan.annual_return}% requires 60%+ exposure to Small/Mid-cap stocks. Ensure you have high risk tolerance for 20-30% temporary drawdowns.")
    elif plan.annual_return <= 8:
        suggestions.append("Your target return is below Index benchmarks. A simple Diversified Nifty 50 Index fund could potentially outperform this with lower cost.")

    # 4. Initial Investment vs SIP (STP Logic)
    if plan.initial_investment > (plan.monthly_sip * 12):
        suggestions.append("Large lumpsum detected: Instead of direct entry, use a Systematic Transfer Plan (STP) from a Liquid fund into Equity over 6-12 months to average costs.")

    # 5. Horizon Safety
    if plan.years < 3:
        suggestions.append("Short horizon (<3yrs) alert: Equities are volatile here. Arbitrage or Debt funds are safer for capital protection.")
    elif plan.years > 10:
        suggestions.append("Generational wealth horizon: Power of compounding is highest in Years 8-10. Avoid checking portfolio weekly to prevent emotional selling.")

    return {"suggestions": suggestions}

@app.post("/predict-cashflow")
async def predict_cashflow(data: dict):
    income = float(data.get('income', 0))
    expenses = float(data.get('expenses', 0))
    emi = float(data.get('emi', 0))
    investments = float(data.get('investments', 0))
    
    months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"]
    results = []
    
    current_savings = income - expenses - emi - investments
    
    for i, month in enumerate(months):
        # AI simulation factors: 
        # - Income variance (small +/- 2%)
        # - Expense variance (seasonal spending +/- 8%)
        # - Investment growth (0.5% - 1.5% monthly)
        inc_v = income * (1 + np.random.uniform(-0.02, 0.03))
        exp_v = expenses * (1 + np.random.uniform(-0.05, 0.10))
        sav_v = inc_v - exp_v - emi - investments
        
        results.append({
            "month": month,
            "Income": int(round(inc_v)),
            "Expenses": int(round(exp_v)),
            "Savings": int(round(max(0, sav_v)))
        })
        
    return {"forecast": results}

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