import yfinance as yf

class DataFetcher:

    def get_data(self, symbol, period="1y"):
        # 1. Try the symbol exactly as entered (e.g. AAPL or RELIANCE.NS)
        ticker = yf.Ticker(symbol)
        data = ticker.history(period=period)

        # 2. If empty, try adding .NS (NSE India) as a fallback
        if data.empty and "." not in symbol:
            ticker = yf.Ticker(symbol + ".NS")
            data = ticker.history(period=period)
        
        # 3. If still empty, try adding .BO (BSE India) 
        if data.empty and "." not in symbol:
            ticker = yf.Ticker(symbol + ".BO")
            data = ticker.history(period=period)

        if data.empty:
            return None
        
        return data