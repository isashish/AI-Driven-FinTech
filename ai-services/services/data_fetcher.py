import yfinance as yf

class DataFetcher:

    def get_data(self, symbol, period="1y"):
        ticker = yf.Ticker(symbol + ".NS")
        data = ticker.history(period=period)

        if data.empty:
            return None
        
        return data