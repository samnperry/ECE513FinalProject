var express = require("express");
var Measurement = require("../models/measurement");
var Device = require("../models/device");
var router = express.Router();

async function requireApiKey(req, res, next) {
    try {
        const apiKey = req.headers["x-api-key"];
        if (!apiKey) {
            return res.status(401).json({ error: "Missing API key in 'x-api-key' header" });
        }

        const device = await Device.findOne({ apiKey });
        if (!device) {
            return res.status(401).json({ error: "Invalid API key" });
        }

        if (req.body.deviceId && req.body.deviceId !== device.deviceId) {
            return res.status(403).json({ 
                error: `Device ID in request does not match API key. Expected: ${device.deviceId}` 
            });
        }

        req.device = device;
        next();
    } catch (err) {
        console.error("API key validation failed:", err);
        res.status(500).json({ error: "API key validation error" });
    }
}

router.use(requireApiKey);

router.post("/", async function (req, res) {
    try {
        const { deviceId, heartRate, spo2 } = req.body;

        if (!deviceId || heartRate == null || spo2 == null) {
            return res.status(400).json({ error: "Missing required fields" });
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

        if (deviceId !== req.device.deviceId) {
            return res.status(403).json({ error: "Device ID mismatch" });
        }

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
