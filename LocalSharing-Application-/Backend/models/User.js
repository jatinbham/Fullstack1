const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  name:     { type: String, required: [true, "Name is required"] },
  email:    { type: String, required: [true, "Email is required"], unique: true, lowercase: true, trim: true },
  phone:    { type: String, required: [true, "Phone is required"], unique: true, trim: true },
  password: { type: String, required: [true, "Password is required"] },
  role:     { type: String, required: [true, "Role is required"], enum: ["requester", "volunteer", "provider", "ngo"] },
  location: { type: String, required: [true, "Location is required"] },
  createdAt:{ type: Date, default: Date.now },
});

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ✅ Fixed: was "comparePassword", controller expects "matchPassword"
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);