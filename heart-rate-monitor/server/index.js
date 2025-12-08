var express = require("express");
var cors = require("cors");
require("./db");

var authRoutes = require("./routes/authRoutes");
var deviceRoutes = require("./routes/deviceRoutes");
var measurementRoutes = require("./routes/measurementRoutes");
const accountsRoutes = require("./routes/accountsRoutes");
const physicianRoutes = require("./routes/physicianRoutes.js");

var app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/device", deviceRoutes);
app.use("/api/measurements", measurementRoutes);
app.use("/api/account", accountsRoutes);
app.use("/api/physician", physicianRoutes);

app.listen(5001, function () {
    console.log("Server running on port 5001")
});
