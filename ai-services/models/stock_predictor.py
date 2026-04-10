import numpy as np
from sklearn.preprocessing import MinMaxScaler   # ✅ FIX
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense

class StockPredictor:

    def __init__(self):
        self.scaler = MinMaxScaler()
        self.model = None
        self.sequence_length = 60

    def prepare_data(self, data):
        close_prices = data['Close'].values.reshape(-1, 1)
        scaled = self.scaler.fit_transform(close_prices)

        X, y = [], []
        for i in range(self.sequence_length, len(scaled)):
            X.append(scaled[i-self.sequence_length:i])
            y.append(scaled[i])

        return np.array(X), np.array(y)

    def build_model(self, input_shape):
        model = Sequential()
        model.add(LSTM(50, input_shape=input_shape))
        model.add(Dense(1))

        model.compile(optimizer='adam', loss='mse')
        return model

    # ✅ MUST BE INSIDE CLASS
    def train_and_predict(self, data, days=10):
        X, y = self.prepare_data(data)

        self.model = self.build_model((X.shape[1], 1))
        self.model.fit(X, y, epochs=3, batch_size=32, verbose=0)

        current_sequence = X[-1]
        predictions = []

        for _ in range(days):
            current_sequence = current_sequence.reshape(1, self.sequence_length, 1)

            next_pred = self.model.predict(current_sequence, verbose=0)
            predictions.append(next_pred[0][0])

            current_sequence = np.append(current_sequence[0][1:], next_pred)

        predictions = self.scaler.inverse_transform(
            np.array(predictions).reshape(-1, 1)
        )

        return float(predictions[-1][0])