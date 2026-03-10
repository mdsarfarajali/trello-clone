const mongoose = require("mongoose");
const crypto = require("crypto");

const MemberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, enum: ["leader", "member"], default: "member" },
  joinedAt: { type: Date, default: Date.now },
});

const TeamSchema = new mongoose.Schema({
  teamName: { type: String, required: true, trim: true, maxlength: 100 },
  teamGoal: { type: String, required: true, trim: true, maxlength: 500 },
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  teamCode: { type: String, unique: true },
  passKey: { type: String },
  members: [MemberSchema],
  createdAt: { type: Date, default: Date.now },
});

TeamSchema.pre("save", function (next) {
  if (!this.teamCode) {
    this.teamCode = crypto.randomBytes(4).toString("hex").toUpperCase();
  }
  if (!this.passKey) {
    this.passKey = String(Math.floor(100000 + Math.random() * 900000));
  }
  next();
});

module.exports = mongoose.model("Team", TeamSchema);
