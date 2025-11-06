import mongoose, { Schema, model, models } from "mongoose";

const ActivitySchema = new Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // quem fez a ação
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // dono do post
    thread: { type: mongoose.Schema.Types.ObjectId, ref: "Thread", required: true },
    type: { type: String, enum: ["like", "reply", "repost"], required: true },
    isRead: { type: Boolean, default: false }, // 🔹 controle de leitura
  },
  { timestamps: true }
);

const Activity = models.Activity || model("Activity", ActivitySchema);
export default Activity;
