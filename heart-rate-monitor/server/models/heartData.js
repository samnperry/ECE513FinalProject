// server/models/heartData.js
const db = require("mongoose");

const HeartDataSchema = new db.Schema({
    device: { type: db.Schema.Types.ObjectId, ref: "Device", required: true },
    bpm: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = db.model("HeartData", HeartDataSchema);
