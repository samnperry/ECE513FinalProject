var express = require("express");
var bcrypt = require("bcrypt");
var jwt = require("jwt-simple");
var User = require("../models/user");

var router = express.Router();
var SECRET = "super-secret-key";

function isStrongPassword(pw) {
    if (typeof pw !== "string") return false;
    // At least 8 chars, 1 upper, 1 lower, 1 number, 1 special
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;
    return re.test(pw);
}

router.post("/signup", async function (req, res) {
    const { email, password } = req.body;

    try {
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: "Email already exists" });
        }

        if (!isStrongPassword(password)) {
            return res.status(400).json({
                error:
                    "Password must be at least 8 characters and include upper, lower, number, and special character.",
            });
        }

        const hash = await bcrypt.hash(password, 10);

        const user = await User.create({
            email,
            passwordHash: hash,
            role: "user"
        });

        const token = jwt.encode({ id: user._id, email: user.email }, SECRET);

        res.json({
            message: "Account created",
            token,
            user: { id: user._id, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ error: "Signup failed" });
    }
});

router.post("/physician/signup", async function (req, res) {
    const { email, password } = req.body;

    try {
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: "Email already exists" });
        }

        if (!isStrongPassword(password)) {
            return res.status(400).json({
                error:
                    "Password must be at least 8 characters and include upper, lower, number, and special character.",
            });
        }

        const hash = await bcrypt.hash(password, 10);
        const user = await User.create({
            email,
            passwordHash: hash,
            role: "physician"
        });

        const token = jwt.encode({ id: user._id, email: user.email }, SECRET);
        res.json({
            message: "Physician account created",
            token,
            user: { id: user._id, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ error: "Signup failed" });
    }
});

router.post("/login", async function (req, res) {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Invalid email/password" });
        }

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
            return res.status(400).json({ error: "Invalid email/password" });
        }

        const token = jwt.encode({ id: user._id, email: user.email }, SECRET);

        res.json({
            message: "Logged in",
            token,
            user: { id: user._id, email: user.email, role: user.role }
        });
    } catch {
        res.status(500).json({ error: "Login failed" });
    }
});

module.exports = router;
