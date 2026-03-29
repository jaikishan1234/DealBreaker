import Score from "../models/score.model.js";

// OPTIONAL: Manual save (for testing only, not needed in production)
export const saveScore = async (req, res) => {
  try {
    const { game } = req.body;

    // Validate input
    if (!game || !game.initialPrice || !game.currentPrice) {
      return res.status(400).json({
        success: false,
        message: "Valid game data is required",
      });
    }

    // Calculate score
    const score =
      (game.initialPrice - game.currentPrice) /
      game.initialPrice;

    // Upsert score (update if exists, create if not)
    const newScore = await Score.findOneAndUpdate(
      { user: req.user._id },
      {
        user: req.user._id,
        username: req.user.username,
        finalPrice: game.currentPrice,
        initialPrice: game.initialPrice,
        score,
      },
      { upsert: true, new: true }
    );

    return res.status(201).json({
      success: true,
      message: "Score saved successfully",
      data: newScore,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get leaderboard with ranking + formatted score
export const getLeaderboard = async (req, res) => {
  try {
    // Get all scores sorted by best performance
    const leaderboard = await Score.find().sort({ score: -1 });

    // Add rank and format score for better readability
    const formattedLeaderboard = leaderboard.map((item, index) => ({
      _id: item._id,
      username: item.username,
      finalPrice: item.finalPrice,
      initialPrice: item.initialPrice,

      // Convert score to percentage format
      score: (item.score * 100).toFixed(2) + "%",

      rank: index + 1,
      createdAt: item.createdAt,
    }));

    return res.status(200).json({
      success: true,
      message: "Leaderboard fetched successfully",
      data: formattedLeaderboard,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};