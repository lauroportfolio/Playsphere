import mongoose from "mongoose";

const threadSchema = new mongoose.Schema(
  {
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
      default: null,
    },
    parentId: {
      type: String,
      default: null,
    },
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Thread",
      },
    ],
    likes: {
      type: [String],
      default: [],
    },

    // ✅ Lista de usuários que repostaram
    reposts: [
      {
        type: String, // usamos string porque o userId do Clerk é string
      },
    ],

    // ✅ quem fez o repost (para o post de tipo “repost”)
    repostedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ✅ referência ao post original
    repostOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread",
      default: null,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

if (mongoose.models.Thread) {
  delete mongoose.models.Thread;
}

const Thread = mongoose.model("Thread", threadSchema);
export default Thread;
