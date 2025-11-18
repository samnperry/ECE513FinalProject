const mongoose = require("../db"); // use the same connection

const measurementSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  deviceId: { type: String, required: true },
  heartRate: { type: Number, required: true },
  spo2: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Measurement", measurementSchema);