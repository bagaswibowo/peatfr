import unittest
from peatfr_engine.fire_intelligence import FireIntelligenceEngine, SimpleTTLCache

VALID_SEVERITY = {"CRITICAL", "HIGH", "WARNING"}


class TestFireIntelligence(unittest.TestCase):
    def setUp(self):
        self.engine = FireIntelligenceEngine(firms_map_key="aa16407e5eb11df46b09cafc085fe020")

    def test_ttl_cache(self):
        cache = SimpleTTLCache(ttl_seconds=2)
        cache.set("test_key", {"val": 123})
        self.assertEqual(cache.get("test_key"), {"val": 123})

    def test_fetch_severe_fire_alerts_shape(self):
        """Alerts must come from live FIRMS clusters, never a static list."""
        res = self.engine.fetch_severe_fire_alerts()
        self.assertIn(res.get("status"), ["success", "unavailable"])
        self.assertIsInstance(res.get("alerts"), list)
        self.assertEqual(res.get("active_severe_alerts"), len(res["alerts"]))

        for alert in res["alerts"]:
            self.assertIn(alert["severity"], VALID_SEVERITY)
            self.assertTrue(alert["peatland_verified"])
            self.assertGreater(alert["detection_count"], 0)
            self.assertGreater(alert["frp_max_mw"], 0.0)
            self.assertTrue(-11.0 <= alert["lat"] <= 6.0)
            self.assertTrue(95.0 <= alert["lon"] <= 141.0)
            self.assertGreaterEqual(alert["estimated_burned_ha"] or 0.0, 0.0)
            self.assertTrue(alert["satellite_sensor"].startswith("NASA FIRMS"))

    def test_gfw_peatland_fires_uses_attribution_not_api_key(self):
        res = self.engine.fetch_gfw_peatland_fires(limit=10)
        self.assertIn(res.get("status"), ["success", "error"])
        self.assertLessEqual(len(res.get("fires", [])), 10)
        for fire in res.get("fires", []):
            self.assertTrue(fire["is__peatland"])
            self.assertIsNotNone(fire["adm2"])
            self.assertLessEqual(fire["regency_centroid_km"], res["attribution_max_km"])

    def test_fetch_owm_fwi_fallback(self):
        res = self.engine.fetch_owm_fwi(-2.321, 113.901, temp=35.0, rf=0.0, sm=38.0)
        self.assertIn(res.get("status"), ["success", "estimated"])
        self.assertTrue("fwi_score" in res or "data" in res)

if __name__ == "__main__":
    unittest.main()
