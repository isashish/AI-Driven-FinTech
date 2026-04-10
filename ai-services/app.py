from fastapi import FastAPI, HTTPException
from models.risk_analyzer import RiskAnalyzer
from models.stock_predictor import StockPredictor
from services.data_fetcher import DataFetcher
from pydantic import BaseModel
import yfinance as yf
import numpy as np    


app = FastAPI()

fetcher = DataFetcher()
risk_analyzer = RiskAnalyzer()
predictor = StockPredictor()


@app.get("/")
def home():
    return {"message": "Stock API Running"}


# 📊 Risk Analysis
@app.get("/risk/{symbol}")
def analyze_risk(symbol: str):
    data = fetcher.get_data(symbol)

    if data is None:
        raise HTTPException(status_code=404, detail="Stock not found")

    result = risk_analyzer.analyze(data)
    return {"symbol": symbol, "analysis": result}


#  Prediction
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




class InvestmentSuggestionsRequest(BaseModel):
    risk_appetite: str  # Low / Medium / High

@app.post("/suggestions")
def get_suggestions(request: InvestmentSuggestionsRequest):

    symbols = ['RELIANCE', 'TCS', 'INFY', 'SBIN', 'ITC']

    results = []

    for symbol in symbols:
        ticker = yf.Ticker(symbol + ".NS")
        data = ticker.history(period="6mo")

        if data.empty:
            continue

        returns = data['Close'].pct_change().dropna()

        volatility = float(returns.std() * np.sqrt(252))
        current_price = float(data['Close'].iloc[-1])

        # Simple risk classification
        if volatility < 0.2:
            risk = "Low"
        elif volatility < 0.4:
            risk = "Medium"
        else:
            risk = "High"

        # Match with user preference
        if risk.lower() == request.risk_appetite.lower():

            results.append({
                "symbol": symbol,
                "price": round(current_price, 2),
                "risk": risk
            })

    return {
        "risk_appetite": request.risk_appetite,
        "suggestions": results
    }