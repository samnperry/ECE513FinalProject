var db = require("mongoose");

var DeviceSchema = new db.Schema({
    deviceId: { type: String, required: true, unique: true },
    user: { type: db.Schema.Types.ObjectId, ref: "User", required: true },
    apiKey: { type: String, required: true, unique: true }
});

module.exports = db.model("Device", DeviceSchema);
