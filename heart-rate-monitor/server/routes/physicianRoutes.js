// server/routes/physicianRoutes.js
const express = require("express");
const jwt = require("jwt-simple");
const User = require("../models/user");
const Device = require("../models/device");
const Measurement = require("../models/measurement");

const router = express.Router();
const SECRET = "super-secret-key";

async function verifyPhysician(req, res) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return { error: "Missing auth token" };
        }

        const token = authHeader.replace("Bearer ", "").trim();
        const decoded = jwt.decode(token, SECRET);

        const user = await User.findById(decoded.id);
        if (!user) {
            return { error: "User not found" };
        }

        if (user.role !== "physician") {
            return { error: "Physician access required" };
        }

        return { user };
    } catch (err) {
        return { error: "Invalid or expired token" };
    }
}

router.get("/list", async (req, res) => {
    try {
        const physicians = await User.find(
            { role: "physician" },
            "_id email name"
        );

        res.json({ physicians });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch physicians" });
    }
});


router.put("/assign", async (req, res) => {
    try {
        const { userId, physicianId } = req.body;
        const user = await User.findById(userId);
        const physician = await User.findById(physicianId);

        if (!user || !physician) {
            return res.status(404).json({ error: "User or physician not found" });
        }

        user.assignedPhysician = physicianId;
        await user.save();

        res.json({ message: "Physician assigned", userId, physicianId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Assign failed" });
    }
});

router.get("/patients", async (req, res) => {
    const check = await verifyPhysician(req, res);
    if (check.error) return res.status(401).json({ error: check.error });

    try {
        const physicianId = check.user._id;
        const patients = await User.find({ assignedPhysician: physicianId })
            .populate("devices", "deviceId nickname");

        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - 6); // last 7 days including today

        const enriched = [];
        for (const p of patients) {
            const deviceIds = (p.devices || []).map((d) => d.deviceId);
            let avgHeartRate = null;
            let minHeartRate = null;
            let maxHeartRate = null;

            if (deviceIds.length > 0) {
                const readings = await Measurement.find({
                    deviceId: { $in: deviceIds },
                    timestamp: { $gte: start },
                }).select("heartRate");

                if (readings.length > 0) {
                    const rates = readings.map((r) => r.heartRate);
                    const total = rates.reduce((sum, v) => sum + v, 0);
                    avgHeartRate = Math.round(total / rates.length);
                    minHeartRate = Math.min(...rates);
                    maxHeartRate = Math.max(...rates);
                }
            }

            enriched.push({
                _id: p._id,
                email: p.email,
                devices: p.devices,
                stats: {
                    avgHeartRate,
                    minHeartRate,
                    maxHeartRate,
                },
            });
        }

        res.json({ patients: enriched });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed" });
    }
});

router.get("/patient/:id/summary", async (req, res) => {
    const check = await verifyPhysician(req, res);
    if (check.error) return res.status(401).json({ error: check.error });

    try {
        const patientId = req.params.id;
        const patient = await User.findById(patientId).populate("devices");

        if (!patient) {
            return res.status(404).json({ error: "Patient not found" });
        }

        if (String(patient.assignedPhysician) !== String(check.user._id)) {
            return res.status(403).json({ error: "Not allowed" });
        }

        const summaries = [];
        for (const d of patient.devices) {
            const latest = await Measurement.findOne({ deviceId: d.deviceId })
                .sort({ timestamp: -1 })
                .limit(1);

            summaries.push({
                device: {
                    deviceId: d.deviceId,
                    nickname: d.nickname,
                    measurementFrequencySeconds: d.measurementFrequencySeconds,
                },
                latest: latest
                    ? {
                          bpm: latest.heartRate,
                          spo2: latest.spo2,
                          timestamp: latest.timestamp,
                      }
                    : null,
            });
        }

        res.json({ patient: { id: patient._id, email: patient.email }, summaries });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed" });
    }
});

router.get("/patient/:id/daily", async (req, res) => {
    const check = await verifyPhysician(req, res);
    if (check.error) return res.status(401).json({ error: check.error });

    try {
        const patientId = req.params.id;
        const dateParam = req.query.date;

        if (!dateParam) {
            return res.status(400).json({ error: "date required" });
        }

        const dayStart = new Date(dateParam);
        dayStart.setUTCHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

        const patient = await User.findById(patientId).populate("devices");
        if (!patient) {
            return res.status(404).json({ error: "Patient not found" });
        }

        if (String(patient.assignedPhysician) !== String(check.user._id)) {
            return res.status(403).json({ error: "Not allowed" });
        }

        const details = [];
        for (const d of patient.devices) {
            const entries = await Measurement.find({
                deviceId: d.deviceId,
                timestamp: { $gte: dayStart, $lt: dayEnd },
            }).sort({ timestamp: 1 });

            details.push({
                device: { deviceId: d.deviceId, nickname: d.nickname },
                entries: entries.map((e) => ({
                    bpm: e.heartRate,
                    spo2: e.spo2,
                    timestamp: e.timestamp,
                })),
            });
        }

        res.json({ date: dateParam, details });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed" });
    }
});

router.put("/device/:deviceId/frequency", async (req, res) => {
    const check = await verifyPhysician(req, res);
    if (check.error) return res.status(401).json({ error: check.error });

    try {
        const { seconds } = req.body;
        const deviceId = req.params.deviceId;

        const device = await Device.findOne({ deviceId });
        if (!device) {
            return res.status(404).json({ error: "Device not found" });
        }

        const user = await User.findById(device.user);
        if (String(user.assignedPhysician) !== String(check.user._id)) {
            return res.status(403).json({ error: "Not allowed" });
        }

        device.measurementFrequencySeconds = seconds;
        await device.save();

        res.json({ message: "Frequency updated", device });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed" });
    }
});

module.exports = router;
