import numpy as np

class RiskAnalyzer:

    def analyze(self, data):
        returns = data['Close'].pct_change().dropna()

        volatility = returns.std() * np.sqrt(252)
        avg_return = returns.mean() * 252

        risk_free_rate = 0.07
        sharpe = (avg_return - risk_free_rate) / volatility if volatility != 0 else 0

        # Max Drawdown
        cumulative = (1 + returns).cumprod()
        peak = cumulative.cummax()
        drawdown = (cumulative - peak) / peak
        max_drawdown = drawdown.min()

        # Simple Risk Score
        risk_score = min(10, volatility * 15)

        if risk_score < 3:
            level = "Low"
        elif risk_score < 6:
            level = "Medium"
        else:
            level = "High"

        # Explicitly cast everything to float for JSON compatibility
        return {
            "volatility": float(round(volatility * 100, 2)),
            "avg_return": float(round(avg_return * 100, 2)),
            "sharpe_ratio": float(round(sharpe, 2)),
            "max_drawdown": float(round(max_drawdown * 100, 2)),
            "risk_score": float(round(risk_score, 2)),
            "risk_level": str(level)
        }