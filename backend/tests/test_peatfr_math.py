import unittest
import numpy as np
import pandas as pd
from peatfr_engine.pfvi import (
    calculate_df,
    calculate_rf,
    calculate_wtf,
    calculate_di_obs,
    simulate_pfvi,
    optimize_pfvi_parameters
)
from peatfr_engine.imputation import impute_peatfr_data
from peatfr_engine.forecasting import forecast_peatfr_variables

class TestPeatFRMath(unittest.TestCase):
    def test_calculate_df(self):
        df_val = calculate_df(100.0, 34.0, 3000.0, 1.0)
        self.assertIsInstance(df_val, float)
        self.assertGreaterThan = self.assertGreater(df_val, 0.0)
        self.assertLess(df_val, 50.0)

    def test_calculate_rf(self):
        self.assertEqual(calculate_rf(3.0, None), 0.0)
        self.assertEqual(calculate_rf(3.0, 2.0), 0.0)
        self.assertAlmostEqual(calculate_rf(10.1, 2.0), 5.0, delta=0.01)
        self.assertAlmostEqual(calculate_rf(10.1, 6.0), 10.1, delta=0.01)

    def test_calculate_wtf(self):
        wtf_val, theta_val = calculate_wtf(80.0, 6.5, 0.02, 18.0, 0.9)
        self.assertIsInstance(wtf_val, float)
        self.assertIsInstance(theta_val, float)
        self.assertTrue(0.0 <= theta_val <= 1.0)

    def test_calculate_di_obs(self):
        sm = np.array([40.0, 55.0, 70.0])
        di = calculate_di_obs(sm, fc=40.0, sat=70.0)
        self.assertEqual(di[0], 300.0)
        self.assertEqual(di[2], 0.0)

    def test_imputation_all_methods(self):
        wt = np.array([-0.5, -0.6, np.nan, -0.8, -0.9])
        sm = np.array([55.0, 52.0, np.nan, 45.0, 42.0])
        rf = np.array([0.0, 12.0, np.nan, 0.0, 0.0])
        temp = np.array([33.0, 34.0, np.nan, 35.0, 36.0])
        
        for method in ["knn", "spline", "loess", "linear"]:
            res = impute_peatfr_data(wt, sm, rf, temp, method=method)
            self.assertFalse(np.isnan(res["WT"]).any())
            self.assertFalse(np.isnan(res["SM"]).any())

    def test_forecasting_models(self):
        np.random.seed(42)
        wt = np.linspace(-0.5, -1.0, 30) + np.random.normal(0, 0.02, 30)
        sm = np.linspace(60.0, 40.0, 30) + np.random.normal(0, 1.0, 30)
        rf = np.random.exponential(2.0, 30)
        temp = 32.0 + np.random.normal(0, 0.5, 30)
        
        for model in ["arima", "lstm", "gru"]:
            res = forecast_peatfr_variables(wt, sm, rf, temp, h=4, model=model, epochs=5)
            self.assertEqual(len(res["WT_pred"]), 4)

if __name__ == "__main__":
    unittest.main()
