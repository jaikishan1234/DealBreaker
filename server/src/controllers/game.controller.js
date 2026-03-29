import {
  createGame,
  getGame,
  updateGame,
} from "../services/game.service.js";

import { generateAIResponse } from "../services/ai.service.js";
import Score from "../models/score.model.js";

// Constants
const DESPERATE_REDUCTION = 800;
const NORMAL_REDUCTION = 400;

/**
 * Start a new negotiation game
 * Initializes game with proper initial price tracking
 */
export const startGame = async (req, res) => {
  try {
    // Create game using service
    const game = createGame(req.user._id);

    console.log(
      `Game started for user ${req.user._id}:`,
      {
        gameId: game.gameId,
        initialPrice: game.initialPrice,
        currentPrice: game.currentPrice,
        personality: game.personality,
      }
    );

    return res.status(201).json({
      success: true,
      message: "Game started successfully",
      data: {
        gameId: game.gameId,
        initialPrice: game.initialPrice,
        currentPrice: game.currentPrice,
        personality: game.personality,
        round: game.round,
        maxRounds: game.maxRounds,
        status: game.status,
        minPrice: game.minPrice,
        targetPrice: game.targetPrice,
      },
    });
  } catch (error) {
    console.error("Error starting game:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to start game",
      error: error.message,
    });
  }
};

/**
 * Handle a negotiation round
 * Core game logic with proper price negotiation and score tracking
 */
export const negotiate = async (req, res) => {
  try {
    const { gameId, offer, message } = req.body;

    // Validate required fields
    if (!gameId || offer === undefined) {
      return res.status(400).json({
        success: false,
        message: "gameId and offer are required",
      });
    }

    // Retrieve game
    const game = getGame(gameId);

    // Check if game exists
    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    // Ensure user owns this game
    if (game.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to this game",
      });
    }

    // Ensure game is still active
    if (game.status !== "ongoing") {
      return res.status(400).json({
        success: false,
        message: `Game already ${game.status}`,
      });
    }

    // Convert offer safely
    const numericOffer = Number(offer);

    // Validate offer
    if (!Number.isFinite(numericOffer) || numericOffer <= 0) {
      return res.status(400).json({
        success: false,
        message: "Offer must be a valid positive number",
      });
    }

    let decision = "counter";
    const previousPrice = game.currentPrice;

    // ===== CORE NEGOTIATION LOGIC =====
    if (numericOffer >= game.currentPrice) {
      // Accept the offer
      decision = "accept";
      game.status = "accepted";
      game.currentPrice = numericOffer;
      game.acceptedRound = game.round;

      console.log(
        `Game ${gameId}: Offer accepted at ${numericOffer} (was ${previousPrice})`
      );
    } else if (numericOffer < game.minPrice) {
      // Reject the offer (too low - below seller's minimum)
      decision = "reject";
      console.log(
        `Game ${gameId}: Offer rejected - ${numericOffer} is below minimum ${game.minPrice}`
      );
    } else {
      // Counter offer - vendor reduces price
      const reduction =
        game.personality === "desperate" ? DESPERATE_REDUCTION : NORMAL_REDUCTION;

      game.currentPrice = Math.max(game.minPrice, game.currentPrice - reduction);

      console.log(
        `Game ${gameId}: Counter offer - reduced from ${previousPrice} to ${game.currentPrice} (personality: ${game.personality})`
      );
    }

    // Generate AI response
    let aiMessage = "Let me think about that offer...";
    try {
      const generatedMessage = await generateAIResponse({
        personality: game.personality,
        currentPrice: game.currentPrice,
        minPrice: game.minPrice,
        userOffer: numericOffer,
        userMessage: message,
        decision,
      });
      aiMessage = generatedMessage || aiMessage;
    } catch (aiError) {
      console.error("AI response generation failed:", aiError);
      // Continue with default message if AI fails
    }

    // Move to next round
    game.round += 1;

    // End game if max rounds reached
    if (game.round > game.maxRounds && game.status === "ongoing") {
      game.status = "ended";
      console.log(`Game ${gameId}: Max rounds reached, game ended`);
    }

    // ===== SAVE SCORE WHEN GAME FINISHES =====
    if (
      (game.status === "accepted" || game.status === "ended") &&
      !game.scoreSaved
    ) {
      try {
        // Calculate score properly
        const scoreProportion =
          (game.initialPrice - game.currentPrice) / game.initialPrice;

        // Ensure score is between 0 and 1
        const finalScore = Math.max(0, Math.min(1, scoreProportion));

        console.log(
          `Saving score for user ${req.user._id}:`,
          {
            initialPrice: game.initialPrice,
            currentPrice: game.currentPrice,
            scoreProportion: scoreProportion,
            finalScore: finalScore,
            finalScorePercentage: (finalScore * 100).toFixed(2) + "%",
            gameStatus: game.status,
          }
        );

        // Upsert score (keeps latest, avoids duplicates)
        const savedScore = await Score.findOneAndUpdate(
          { user: req.user._id },
          {
            user: req.user._id,
            username: req.user.username,
            gameId: gameId,
            finalPrice: game.currentPrice,
            initialPrice: game.initialPrice,
            score: finalScore,
            personality: game.personality,
            roundsPlayed: game.round - 1,
            negotiationStatus: game.status,
            savedAt: new Date(),
          },
          { upsert: true, new: true }
        );

        game.scoreSaved = true;

        console.log(`Score saved successfully:`, {
          userId: req.user._id,
          scoreId: savedScore._id,
          scorePercentage: (finalScore * 100).toFixed(2) + "%",
        });
      } catch (scoreError) {
        console.error("Error saving score:", scoreError);
        // Don't fail the request if score save fails
      }
    }

    // Save updated game state
    updateGame(gameId, game);

    return res.status(200).json({
      success: true,
      message: "Negotiation updated successfully",
      data: {
        decision,
        aiMessage,
        previousPrice,
        currentPrice: game.currentPrice,
        initialPrice: game.initialPrice,
        minPrice: game.minPrice,
        round: game.round,
        maxRounds: game.maxRounds,
        status: game.status,
        scoreSaved: game.scoreSaved || false,
      },
    });
  } catch (error) {
    console.error("Error during negotiation:", error);
    return res.status(500).json({
      success: false,
      message: "Negotiation failed",
      error: error.message,
    });
  }
};

/**
 * Get current game status
 */
export const getGameStatus = async (req, res) => {
  try {
    const { gameId } = req.params;

    const game = getGame(gameId);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    if (game.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to this game",
      });
    }

    // Calculate current score
    const currentScore =
      game.initialPrice && game.currentPrice
        ? (game.initialPrice - game.currentPrice) / game.initialPrice
        : 0;

    return res.status(200).json({
      success: true,
      message: "Game status retrieved successfully",
      data: {
        gameId: game.gameId,
        initialPrice: game.initialPrice,
        currentPrice: game.currentPrice,
        minPrice: game.minPrice,
        targetPrice: game.targetPrice,
        round: game.round,
        maxRounds: game.maxRounds,
        status: game.status,
        personality: game.personality,
        currentScore: parseFloat((currentScore * 100).toFixed(2)),
        currentScorePercentage: (currentScore * 100).toFixed(2) + "%",
        scoreSaved: game.scoreSaved || false,
      },
    });
  } catch (error) {
    console.error("Error getting game status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get game status",
      error: error.message,
    });
  }
};

/**
 * End game manually
 */
export const endGame = async (req, res) => {
  try {
    const { gameId } = req.params;

    const game = getGame(gameId);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    if (game.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to this game",
      });
    }

    if (game.status !== "ongoing") {
      return res.status(400).json({
        success: false,
        message: "Game is not ongoing",
      });
    }

    // Mark game as ended
    game.status = "ended";

    // Save score if not already saved
    if (!game.scoreSaved) {
      try {
        const finalScore =
          (game.initialPrice - game.currentPrice) / game.initialPrice;

        await Score.findOneAndUpdate(
          { user: req.user._id },
          {
            user: req.user._id,
            username: req.user.username,
            gameId: gameId,
            finalPrice: game.currentPrice,
            initialPrice: game.initialPrice,
            score: finalScore,
            personality: game.personality,
            roundsPlayed: game.round,
            negotiationStatus: "ended",
            savedAt: new Date(),
          },
          { upsert: true, new: true }
        );

        game.scoreSaved = true;

        console.log(`Game ${gameId} ended, score saved:`, {
          finalScore: (finalScore * 100).toFixed(2) + "%",
        });
      } catch (scoreError) {
        console.error("Error saving score on game end:", scoreError);
      }
    }

    updateGame(gameId, game);

    return res.status(200).json({
      success: true,
      message: "Game ended successfully",
      data: {
        gameId: game.gameId,
        finalPrice: game.currentPrice,
        initialPrice: game.initialPrice,
        finalScore: parseFloat(
          (((game.initialPrice - game.currentPrice) / game.initialPrice) * 100).toFixed(2)
        ),
        finalScorePercentage: (
          ((game.initialPrice - game.currentPrice) / game.initialPrice) *
          100
        ).toFixed(2) + "%",
        roundsPlayed: game.round,
        personality: game.personality,
      },
    });
  } catch (error) {
    console.error("Error ending game:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to end game",
      error: error.message,
    });
  }
};