var db = require("mongoose");

var DeviceSchema = new db.Schema({
    deviceId: { type: String, required: true, unique: true },
    nickname: { type: String },
    user: { type: db.Schema.Types.ObjectId, ref: "User", required: true },
    apiKey: { type: String, required: true, unique: true },
    // Physician-set measurement interval (seconds). Default to 15 minutes if unset.
    measurementFrequencySeconds: { type: Number, default: 1800 },
});

module.exports = db.model("Device", DeviceSchema);
