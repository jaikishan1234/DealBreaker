import mongoose from "mongoose";


// Stores final result of a completed game
const scoreSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    username: {
      type: String,
      required: true,
    },

    finalPrice: {
      type: Number,
      required: true,
    },

    initialPrice: {
      type: Number,
      required: true,
    },

    score: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const Score = mongoose.model("Score", scoreSchema);

export default Score;