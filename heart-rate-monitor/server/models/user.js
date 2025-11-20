var db = require("mongoose");

var UserSchema = new db.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  devices: [{ type: db.Schema.Types.ObjectId, ref: "Device" }]
});

module.exports = db.model("User", UserSchema);
