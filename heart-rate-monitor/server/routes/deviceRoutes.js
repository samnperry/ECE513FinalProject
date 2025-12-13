var express = require("express");
var Device = require("../models/device");
var User = require("../models/user");
var jwt = require("jwt-simple");

var router = express.Router();
var SECRET = "super-secret-key";

function getUserFromToken(req) {
    const token = req.headers.authorization?.split(" ")[1]; // x-auth 
    if (!token) {
        return null;
    }

    try {
        return jwt.decode(token, SECRET);
    } catch {
        return null;
    }
}

router.post("/register", async function (req, res) {
    const { deviceId, nickname } = req.body;

    const userData = getUserFromToken(req);
    if (!userData) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const user = await User.findById(userData.id);

        const existing = await Device.findOne({ deviceId });
        if (existing) {
            return res.status(400).json({ error: "Device already registered" });
        }

        const device = await Device.create({
            deviceId,
            nickname,
            user: user._id
        });

        user.devices.push(device._id);
        await user.save();

        res.json({
            message: "Device registered",
            device: {
                id: device._id,
                deviceId: device.deviceId,
                nickname: device.nickname
            }
        });
    } catch {
        res.status(500).json({ error: "Failed to register device" });
    }
});

router.delete("/:id", async function (req, res) {
    const userData = getUserFromToken(req);
    if (!userData) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const device = await Device.findById(req.params.id);
        if (!device) {
            return res.status(404).json({ error: "Device not found" });
        }

        if (String(device.user) !== String(userData.id)) {
            return res.status(403).json({ error: "Not allowed" });
        }

        await Device.findByIdAndDelete(req.params.id);
        await User.findByIdAndUpdate(userData.id, { $pull: { devices: device._id } });

        res.json({ message: "Device removed" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Delete failed" });
    }
});

router.get("/list", async function (req, res) {
    const userData = getUserFromToken(req);
    if (!userData) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        if (!userData.id || !Device.db.base.Types.ObjectId.isValid(userData.id)) {
            return res.status(400).json({ error: "Invalid user id" });
        }
        const devices = await Device.find({ user: userData.id }).select("deviceId nickname");
        res.json({ devices });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load devices" });
    }
});

router.get("/:id", async function (req, res) {
    const userData = getUserFromToken(req);
    if (!userData) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        if (!Device.db.base.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid device id" });
        }
        const device = await Device.findById(req.params.id).populate("user", "email");
        if (!device) {
            return res.status(404).json({ error: "Device not found" });
        }
        if (String(device.user._id) !== String(userData.id)) {
            return res.status(403).json({ error: "Not allowed" });
        }

        res.json({ device });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed" });
    }
});

module.exports = router;
