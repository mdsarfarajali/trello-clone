const mongoose = require("mongoose");

const TeamTaskSchema = new mongoose.Schema({
  step: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TeamStep",
    required: true,
    index: true,
  },
  taskName: { type: String, required: true, trim: true, maxlength: 300 },
  status: {
    type: String,
    enum: ["pending", "done"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("TeamTask", TeamTaskSchema);
