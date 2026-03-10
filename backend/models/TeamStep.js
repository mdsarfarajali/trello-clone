const mongoose = require("mongoose");

const TeamStepSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true,
    index: true,
  },
  stepName: { type: String, required: true, trim: true, maxlength: 200 },
  status: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending",
  },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("TeamStep", TeamStepSchema);
