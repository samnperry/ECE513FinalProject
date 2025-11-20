var db = require("mongoose");

var DeviceSchema = new db.Schema({
  deviceId: { type: String, required: true, unique: true },
  nickname: { type: String },

  user: { type: db.Schema.Types.ObjectId, ref: "User", required: true }
});

module.exports = db.model("Device", DeviceSchema);
