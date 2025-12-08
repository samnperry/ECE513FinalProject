var express = require("express");
var Measurement = require("../models/measurement");

var router = express.Router();

router.post("/", async function (req, res) {
    try {
        const { deviceId, heartRate, spo2 } = req.body;

        if (!deviceId || heartRate == null || spo2 == null) {
            return res.status(400).json({ error: "Missing fields" });
        }

        const m = await Measurement.create({ deviceId, heartRate, spo2 });
        res.status(201).json(m);
    } catch (err) {
        console.error("Save measurement failed:", err);
        res.status(500).json({ error: "Failed to save measurement" });
    }
});

router.get("/:deviceId", async function (req, res) {
    try {
        const deviceId = req.params.deviceId;

        const list = await Measurement.find({ deviceId })
            .sort({ timestamp: -1 })
            .limit(50);

        res.json(list);
    } catch (err) {
        console.error("Fetch measurements failed:", err);
        res.status(500).json({ error: "Failed to load measurements" });
    }
});

module.exports = router;
