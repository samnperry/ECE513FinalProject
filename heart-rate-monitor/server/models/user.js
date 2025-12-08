var db = require("mongoose");

const UserSchema = new db.Schema({
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "physician"], default: "user" },
    devices: [{ type: db.Schema.Types.ObjectId, ref: "Device" }],
    assignedPhysician: { type: db.Schema.Types.ObjectId, ref: "User", default: null }
});

module.exports = db.model("User", UserSchema);
