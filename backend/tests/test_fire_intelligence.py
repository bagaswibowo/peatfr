import unittest
from peatfr_engine.fire_intelligence import FireIntelligenceEngine, SimpleTTLCache

class TestFireIntelligence(unittest.TestCase):
    def setUp(self):
        self.engine = FireIntelligenceEngine(firms_map_key="aa16407e5eb11df46b09cafc085fe020")

    def test_ttl_cache(self):
        cache = SimpleTTLCache(ttl_seconds=2)
        cache.set("test_key", {"val": 123})
        self.assertEqual(cache.get("test_key"), {"val": 123})

    def test_fetch_severe_fire_alerts(self):
        res = self.engine.fetch_severe_fire_alerts()
        self.assertEqual(res.get("status"), "success")
        self.assertGreater(res.get("active_severe_alerts", 0), 0)
        self.assertTrue(isinstance(res.get("alerts"), list))

    def test_fetch_owm_fwi_fallback(self):
        res = self.engine.fetch_owm_fwi(-2.321, 113.901, temp=35.0, rf=0.0, sm=38.0)
        self.assertIn(res.get("status"), ["success", "estimated"])
        self.assertTrue("fwi_score" in res or "data" in res)

if __name__ == "__main__":
    unittest.main()
