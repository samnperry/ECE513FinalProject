var express = require("express");
var bcrypt = require("bcrypt");
var jwt = require("jwt-simple");
var User = require("../models/user");

var router = express.Router();
var SECRET = "super-secret-key";

router.post("/signup", async function(req, res) {
  const { email, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email already exists" });
    } 

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      passwordHash: hash
    });

    const token = jwt.encode({ id: user._id, email: user.email }, SECRET);

    res.json({
      message: "Account created",
      token,
      user: { id: user._id, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ error: "Signup failed" });
  }
});

router.post("/login", async function(req, res) {
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
      user: { id: user._id, email: user.email }
    });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;
