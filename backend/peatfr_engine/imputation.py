import numpy as np
import pandas as pd
from scipy.interpolate import interp1d, CubicSpline
from typing import Dict, Any, List

def linear_impute(arr: np.ndarray) -> np.ndarray:
    """Linear interpolation for 1D numpy array."""
    series = pd.Series(arr)
    imputed = series.interpolate(method='linear', limit_direction='both')
    return imputed.to_numpy()

def spline_impute(arr: np.ndarray) -> np.ndarray:
    """Cubic spline interpolation for 1D numpy array."""
    valid_idx = np.where(~np.isnan(arr))[0]
    if len(valid_idx) < 4:
        return linear_impute(arr)
    cs = CubicSpline(valid_idx, arr[valid_idx], extrapolate=True)
    all_idx = np.arange(len(arr))
    return cs(all_idx)

def loess_impute(arr: np.ndarray, span: float = 0.5) -> np.ndarray:
    """LOESS / LOWESS local regression smoothing for imputation."""
    valid_idx = np.where(~np.isnan(arr))[0]
    if len(valid_idx) < 10:
        return linear_impute(arr)
    try:
        from statsmodels.nonparametric.smoothers_lowess import lowess
        res = lowess(arr[valid_idx], valid_idx, frac=span, is_sorted=True, return_sorted=False)
        f = interp1d(valid_idx, res, kind='linear', fill_value='extrapolate')
        all_idx = np.arange(len(arr))
        return f(all_idx)
    except Exception:
        return linear_impute(arr)

def knn_impute_dataset(df: pd.DataFrame, k: int = 5) -> pd.DataFrame:
    """
    kNN Imputation using Gower-like normalized Euclidean distance on multivariate time series.
    """
    cols = df.columns
    data = df.to_numpy(dtype=float, copy=True)
    n_samples, n_features = data.shape
    
    # Normalize features to [0, 1] for Gower-like scaling
    mins = np.nanmin(data, axis=0)
    maxs = np.nanmax(data, axis=0)
    ranges = np.where((maxs - mins) == 0, 1.0, maxs - mins)
    norm_data = (data - mins) / ranges
    
    for i in range(n_samples):
        if np.isnan(data[i]).any():
            missing_cols = np.where(np.isnan(data[i]))[0]
            observed_cols = np.where(~np.isnan(data[i]))[0]
            
            if len(observed_cols) == 0:
                continue
                
            # Compute distance to other samples based on observed columns
            distances = []
            for j in range(n_samples):
                if i == j or np.isnan(data[j]).any():
                    distances.append((1e9, j))
                else:
                    dist = np.mean(np.abs(norm_data[i, observed_cols] - norm_data[j, observed_cols]))
                    distances.append((dist, j))
                    
            distances.sort(key=lambda x: x[0])
            neighbors_idx = [idx for dist, idx in distances[:k] if dist < 1e8]
            
            if neighbors_idx:
                for c in missing_cols:
                    neighbor_vals = data[neighbors_idx, c]
                    data[i, c] = np.mean(neighbor_vals)

    # Final fallback for any remaining NaNs
    res_df = pd.DataFrame(data, columns=cols)
    return res_df.interpolate(method='linear', limit_direction='both')

def impute_peatfr_data(
    wt: np.ndarray,
    sm: np.ndarray,
    rf: np.ndarray,
    temp: np.ndarray,
    method: str = "knn",
    k: int = 5
) -> Dict[str, np.ndarray]:
    """
    Unified entry point for data imputation in peatfr.
    """
    df = pd.DataFrame({"WT": wt, "SM": sm, "Rf": rf, "Temp": temp})
    
    if method == "knn":
        imputed_df = knn_impute_dataset(df, k=k)
    elif method == "spline":
        imputed_df = df.apply(spline_impute)
    elif method == "loess":
        imputed_df = df.apply(loess_impute)
    else:
        imputed_df = df.apply(linear_impute)
        
    return {
        "WT": imputed_df["WT"].to_numpy(),
        "SM": imputed_df["SM"].to_numpy(),
        "Rf": imputed_df["Rf"].to_numpy(),
        "Temp": imputed_df["Temp"].to_numpy()
    }
