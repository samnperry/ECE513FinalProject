const mongoose = require("mongoose");

mongoose.set("strictQuery", true);

mongoose.connect(
  "mongodb+srv://amberparker_db_user:HUXq0ZvJxMF3ZI7I@ece513.wbdx1wo.mongodb.net/hrm",
  { useNewUrlParser: true, useUnifiedTopology: true }
)
.then(function() { console.log("MongoDB connected") })
.catch(function (err) {
  console.error("MongoDB connection failed:", err);
  process.exit(1); // exit the application if the database connection fails
});

module.exports = mongoose;
