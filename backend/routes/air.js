import express from "express";
import axios from "axios";

const router = express.Router();

const AIR4THAI_URL = "http://air4thai.pcd.go.th/services/getNewAQI_JSON.php";

router.get("/", async (req, res) => {
  try {
    const response = await axios.get(AIR4THAI_URL, {
      timeout: 10000,
      headers: {
        Accept: "application/json",
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Air4Thai fetch error:", error.message);
    res.status(500).json({
      error: "Failed to fetch Air4Thai data",
      detail: error.message,
    });
  }
});

router.get("/station/:stationID", async (req, res) => {
  try {
    const { stationID } = req.params;

    const response = await axios.get(AIR4THAI_URL, {
      timeout: 10000,
      params: { stationID },
      headers: {
        Accept: "application/json",
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Air4Thai station fetch error:", error.message);
    res.status(500).json({
      error: "Failed to fetch station data",
      detail: error.message,
    });
  }
});

export default router;