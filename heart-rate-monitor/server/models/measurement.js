var db = require("mongoose");

var MeasurementSchema = new db.Schema({
    deviceId: { type: String, required: true },
    heartRate: { type: Number, required: true },
    spo2: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = db.model("Measurement", MeasurementSchema);
