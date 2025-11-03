import mongoose from "mongoose";

const threadSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Community",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  parentId: {
    type: String,
  },
  children: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread",
    },
  ],
  // 🆕 Campo de likes com default []
  likes: {
    type: [String],
    default: [],
  },
});

// Força atualização do modelo se ele já existir com schema antigo
if (mongoose.models.Thread) {
  delete mongoose.models.Thread;
}

const Thread = mongoose.model("Thread", threadSchema);

export default Thread;