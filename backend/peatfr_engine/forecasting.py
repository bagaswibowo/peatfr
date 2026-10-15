import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, List
from scipy.stats import boxcox
from scipy.special import inv_boxcox

# Machine learning PyTorch imports
import torch
import torch.nn as nn

class LSTMModel(nn.Module):
    def __init__(self, input_dim: int = 1, hidden_dim: int = 32, num_layers: int = 2, output_dim: int = 1):
        super(LSTMModel, self).__init__()
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_dim, output_dim)
        
    def forward(self, x):
        out, _ = self.lstm(x)
        out = self.fc(out[:, -1, :])
        return out

class GRUModel(nn.Module):
    def __init__(self, input_dim: int = 1, hidden_dim: int = 32, num_layers: int = 2, output_dim: int = 1):
        super(GRUModel, self).__init__()
        self.gru = nn.GRU(input_dim, hidden_dim, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_dim, output_dim)
        
    def forward(self, x):
        out, _ = self.gru(x)
        out = self.fc(out[:, -1, :])
        return out

def forecast_arima_single(series: np.ndarray, h: int) -> np.ndarray:
    """
    ARIMA forecasting with Box-Cox transformation & auto AR/MA fitting.
    """
    shift = 0.0
    min_val = np.min(series)
    if min_val <= 0:
        shift = abs(min_val) + 1.0
    
    shifted_series = series + shift
    
    try:
        transformed, lmbda = boxcox(shifted_series)
    except Exception:
        transformed = np.log(shifted_series)
        lmbda = 0.0
        
    try:
        from statsmodels.tsa.arima.model import ARIMA
        # Fit optimal ARIMA(p, d, q) based on AIC
        best_aic = 1e9
        best_model = None
        
        for p in [1, 2]:
            for d in [0, 1]:
                for q in [0, 1, 2]:
                    try:
                        m = ARIMA(transformed, order=(p, d, q)).fit()
                        if m.aic < best_aic:
                            best_aic = m.aic
                            best_model = m
                    except Exception:
                        continue
                        
        if best_model is None:
            best_model = ARIMA(transformed, order=(1, 1, 1)).fit()
            
        forecast_trans = best_model.forecast(steps=h)
        
        if lmbda == 0.0:
            forecast_shifted = np.exp(forecast_trans)
        else:
            forecast_shifted = inv_boxcox(forecast_trans, lmbda)
            
        forecast = forecast_shifted - shift
        return np.array(forecast)
    except Exception:
        # Fallback to linear trend if ARIMA fails
        last_val = series[-1]
        trend = (series[-1] - series[0]) / len(series)
        return np.array([last_val + trend * (i + 1) for i in range(h)])

def forecast_rnn_single(series: np.ndarray, h: int, model_type: str = "lstm", look_back: int = 12, hidden_units: int = 32, epochs: int = 50) -> np.ndarray:
    """
    LSTM/GRU neural network forecasting for univariate time series.
    """
    data = series.astype(np.float32)
    min_val, max_val = data.min(), data.max()
    scale = (max_val - min_val) if (max_val - min_val) != 0 else 1.0
    norm_data = (data - min_val) / scale
    
    if len(norm_data) <= look_back:
        look_back = max(2, len(norm_data) // 2)
        
    X, y = [], []
    for i in range(len(norm_data) - look_back):
        X.append(norm_data[i:i + look_back])
        y.append(norm_data[i + look_back])
        
    X_tensor = torch.tensor(np.array(X), dtype=torch.float32).unsqueeze(-1)
    y_tensor = torch.tensor(np.array(y), dtype=torch.float32).unsqueeze(-1)
    
    if model_type == "gru":
        model = GRUModel(input_dim=1, hidden_dim=hidden_units, num_layers=2, output_dim=1)
    else:
        model = LSTMModel(input_dim=1, hidden_dim=hidden_units, num_layers=2, output_dim=1)
        
    optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
    criterion = nn.MSELoss()
    
    model.train()
    for epoch in range(epochs):
        optimizer.zero_grad()
        output = model(X_tensor)
        loss = criterion(output, y_tensor)
        loss.backward()
        optimizer.step()
        
    model.eval()
    preds = []
    curr_input = torch.tensor(norm_data[-look_back:], dtype=torch.float32).unsqueeze(0).unsqueeze(-1)
    
    with torch.no_grad():
        for _ in range(h):
            next_pred = model(curr_input)
            preds.append(next_pred.item())
            # Update sliding window
            next_val_tensor = next_pred.unsqueeze(1)
            curr_input = torch.cat((curr_input[:, 1:, :], next_val_tensor), dim=1)
            
    preds = np.array(preds) * scale + min_val
    return preds

def forecast_peatfr_variables(
    wt: np.ndarray,
    sm: np.ndarray,
    rf: np.ndarray,
    temp: np.ndarray,
    h: int = 4,
    model: str = "arima",
    look_back: int = 12,
    hidden_units: int = 32,
    epochs: int = 50
) -> Dict[str, np.ndarray]:
    """
    Unified entry point for time series forecasting in peatfr.
    """
    model_name = model.lower()
    
    if model_name == "arima":
        wt_pred = forecast_arima_single(wt, h)
        sm_pred = forecast_arima_single(sm, h)
        rf_pred = forecast_arima_single(rf, h)
        temp_pred = forecast_arima_single(temp, h)
    else:
        wt_pred = forecast_rnn_single(wt, h, model_type=model_name, look_back=look_back, hidden_units=hidden_units, epochs=epochs)
        sm_pred = forecast_rnn_single(sm, h, model_type=model_name, look_back=look_back, hidden_units=hidden_units, epochs=epochs)
        rf_pred = forecast_rnn_single(rf, h, model_type=model_name, look_back=look_back, hidden_units=hidden_units, epochs=epochs)
        temp_pred = forecast_rnn_single(temp, h, model_type=model_name, look_back=look_back, hidden_units=hidden_units, epochs=epochs)
        
    return {
        "WT_pred": wt_pred,
        "SM_pred": sm_pred,
        "Rf_pred": rf_pred,
        "Temp_pred": temp_pred
    }
