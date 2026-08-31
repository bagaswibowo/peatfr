import numpy as np
from scipy.optimize import minimize
from typing import Dict, Any, Tuple, List

def calculate_df(pfvi_prev: float, temp_max: float, r0: float = 3000.0, dt: float = 1.0) -> float:
    """
    Evapotranspiration water loss DF_t equation from Mahdiyasa et al. (2025).
    """
    numerator = (300.0 - pfvi_prev) * (0.4982 * np.exp(0.0905 * temp_max + 1.6096) - 4.268) * dt * 1e-3
    denominator = 1.0 + 10.88 * np.exp(-0.00173582677165354 * r0)
    return float(numerator / denominator)

def calculate_rf(rf_current: float, rf_prev: float) -> float:
    """
    Effective rainfall factor RF_t accounting for initial canopy/surface interception (5.1 mm/day).
    """
    if rf_prev is None or np.isnan(rf_prev) or rf_prev <= 5.1:
        if rf_current < 5.1:
            return 0.0
        else:
            return float(rf_current - 5.1)
    else:
        if rf_current >= 5.1:
            return float(rf_current)
        else:
            return 0.0

def calculate_wtf(wt_depth: float, a_h: float, b_h: float, n: float, alpha: float) -> Tuple[float, float]:
    """
    Water table factor WTF_t using van Genuchten soil moisture retention function theta(v).
    wt_depth: positive depth from surface to water table in cm.
    """
    if n <= 0 or alpha <= 0:
        return 0.0, 0.0
    
    m = 1.0 - (1.0 / n)
    v = max(0.0, wt_depth)
    theta = (1.0 + (v / alpha) ** n) ** (-m)
    wtf = a_h - b_h * ((1.0 - theta) * 300.0)
    return float(wtf), float(theta)

def calculate_di_obs(sm: np.ndarray, fc: float = 40.0, sat: float = 70.0) -> np.ndarray:
    """
    Observed drought index derived from volumetric soil moisture (SM).
    """
    di = 300.0 * (1.0 - ((sm - fc) / (sat - fc)))
    return np.clip(di, 0.0, 300.0)

def simulate_pfvi(
    wt: np.ndarray,
    sm: np.ndarray,
    rf: np.ndarray,
    temp: np.ndarray,
    a_h: float,
    b_h: float,
    n: float,
    alpha: float,
    r0: float = 3000.0,
    dt: float = 1.0
) -> Dict[str, Any]:
    """
    Simulates time series of Peat Fire Vulnerability Index (PFVI).
    """
    time_steps = len(wt)
    depths = np.where(wt > 0, 0.0, -wt) * 100.0  # convert meters to cm if negative meters
    
    pfvi = np.zeros(time_steps)
    df_arr = np.zeros(time_steps)
    rf_arr = np.zeros(time_steps)
    wtf_arr = np.zeros(time_steps)
    theta_arr = np.zeros(time_steps)
    
    di_obs = calculate_di_obs(sm)
    current_pfvi = float(di_obs[0])
    
    for t in range(time_steps):
        pfvi_clamped = max(0.0, min(300.0, current_pfvi))
        rf_prev = rf[t-1] if t > 0 else None
        
        df_val = calculate_df(pfvi_clamped, temp[t], r0, dt)
        rf_val = calculate_rf(rf[t], rf_prev)
        wtf_val, theta_val = calculate_wtf(depths[t], a_h, b_h, n, alpha)
        
        next_pfvi = pfvi_clamped + df_val - rf_val - wtf_val
        next_pfvi = max(0.0, min(300.0, next_pfvi))
        
        pfvi[t] = next_pfvi
        df_arr[t] = df_val
        rf_arr[t] = rf_val
        wtf_arr[t] = wtf_val
        theta_arr[t] = theta_val
        current_pfvi = next_pfvi
        
    return {
        "pfvi": pfvi,
        "di_obs": di_obs,
        "df": df_arr,
        "rf": rf_arr,
        "wtf": wtf_arr,
        "theta": theta_arr
    }

def optimize_pfvi_parameters(
    wt: np.ndarray,
    sm: np.ndarray,
    rf: np.ndarray,
    temp: np.ndarray,
    r0: float = 3000.0,
    dt: float = 1.0
) -> Tuple[np.ndarray, float]:
    """
    Calibrates (a_H, b_H, n, alpha) using Nelder-Mead optimization against observed DI.
    """
    di_obs = calculate_di_obs(sm)
    
    def objective(params):
        a_h, b_h, n, alpha = params
        if n <= 0 or alpha <= 0:
            return 1e9
        sim = simulate_pfvi(wt, sm, rf, temp, a_h, b_h, n, alpha, r0, dt)
        mse = np.mean((sim["pfvi"] - di_obs) ** 2)
        return mse

    # Initial grid search for robust starting point
    best_params = np.array([0.1, 0.1, 0.1, 0.1])
    best_val = objective(best_params)
    
    for i in [0.2, 0.5, 1.0, 5.0]:
        for j in [0.01, 0.05, 0.1, 0.5]:
            for k in [1.5, 5.0, 15.0, 55.0]:
                for l in [0.5, 1.0, 5.0]:
                    init_p = np.array([i, j, k, l])
                    val = objective(init_p)
                    if val < best_val:
                        best_val = val
                        best_params = init_p
                        
    res = minimize(objective, best_params, method='Nelder-Mead', options={'maxiter': 2000, 'xatol': 1e-4, 'fatol': 1e-4})
    return res.x, float(res.fun)
