var express = require("express");
var cors = require("cors");
require("./db");

var authRoutes = require("./routes/authRoutes");
var deviceRoutes = require("./routes/deviceRoutes");
var measurementRoutes = require("./routes/measurementRoutes");
const accountsRoutes = require("./routes/accountsRoutes");
const physicianRoutes = require("./routes/physicianRoutes.js");

var app = express();
// Respect proxy headers (needed when running behind Nginx/ALB for HTTPS)
app.set("trust proxy", 1);

// CORS: allow configured origin(s); default to permissive for local/dev
const allowedOrigins =
    process.env.FRONTEND_ORIGIN ||
    process.env.CORS_ORIGIN ||
    "*";

app.use(
    cors({
        origin: allowedOrigins === "*"
            ? "*"
            : allowedOrigins.split(",").map((o) => o.trim()),
    })
);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/device", deviceRoutes);
app.use("/api/measurements", measurementRoutes);
app.use("/api/account", accountsRoutes);
app.use("/api/physician", physicianRoutes);

app.listen(5001, function () {
    console.log("Server running on port 5001")
});
