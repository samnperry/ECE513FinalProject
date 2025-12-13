const express = require("express");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jwt-simple");

const router = express.Router();

const SECRET = "super-secret-key";

function getUserFromToken(req) {
    const header = req.headers.authorization;
    if (!header) return null;

    const token = header.split(" ")[1];

    try {
        return jwt.decode(token, SECRET);
    } catch (err) {
        return null;
    }
}

router.put("/update", async function (req, res) {
    try {
        // Decode JWT manually
        const decoded = getUserFromToken(req);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid or missing token" });
        }

        const { password } = req.body;
        const updates = {};

        // Email updates are not allowed
        if (!password) {
            return res.status(400).json({ error: "Only password updates are allowed." });
        }

        // Password strength: at least 8 chars, upper, lower, number, special
        const strong =
            typeof password === "string" &&
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/.test(password);
        if (!strong) {
            return res.status(400).json({
                error: "Password must be at least 8 characters and include upper, lower, number, and special character.",
            });
        }

        updates.passwordHash = await bcrypt.hash(password, 10);

        const user = await User.findByIdAndUpdate(decoded.id, updates, { new: true });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            message: "Account updated",
            user: { id: user._id, email: user.email }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Update failed" });
    }
});

module.exports = router;
