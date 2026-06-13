const mongoose = require("mongoose");

const RequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  requestId: { type: String },
  location: { type: String, required: true },
  resourceNeeded: { type: String, required: true },
  email: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  priority: { type: String, default: "med", enum: ["low", "med", "high", "critical"] },
  status: { type: String, default: "pending", enum: ["pending", "matched", "in-progress", "completed", "cancelled"] },
  responder: {
    name: { type: String },
    type: { type: String },
    eta: { type: String },
    phone: { type: String }
  },
  timeline: [
    {
      label: { type: String },
      time: { type: String },
      done: { type: Boolean, default: false }
    }
  ],
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

// Location is now a string


module.exports = mongoose.model("Request", RequestSchema);