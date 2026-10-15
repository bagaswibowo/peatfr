import unittest

from peatfr_engine.fire_intelligence import (
    PEAT_ATTRIBUTION_MAX_KM,
    PEAT_REGENCIES,
    attribute_peatland,
    haversine_km,
)


class TestPeatlandAttribution(unittest.TestCase):
    """Offline checks: the FIRMS->peatland attribution must be real and bounded."""

    def test_regency_dataset_loaded(self):
        self.assertGreater(len(PEAT_REGENCIES), 20)
        self.assertTrue(any(r["peat"] for r in PEAT_REGENCIES))

    def test_peat_regency_centroid_attributes_true(self):
        # Kab. Siak, Riau — flagged peat: true in indonesia_admin.json.
        res = attribute_peatland(0.820, 102.050)
        self.assertTrue(res["is_peatland"])
        self.assertEqual(res["adm2"], "Kab. Siak")
        self.assertAlmostEqual(res["distance_km"], 0.0, delta=1.0)

    def test_far_from_any_peat_centroid_is_not_peatland(self):
        # Mid-ocean, ~1100 km from Sumatra.
        res = attribute_peatland(-8.0, 95.0)
        self.assertFalse(res["is_peatland"])
        self.assertGreater(res["distance_km"], PEAT_ATTRIBUTION_MAX_KM)

    def test_haversine_matches_known_distance(self):
        # Jakarta -> Bandung is ~120 km.
        self.assertAlmostEqual(haversine_km(-6.2, 106.8167, -6.9175, 107.6191), 121.0, delta=8.0)


if __name__ == "__main__":
    unittest.main()
