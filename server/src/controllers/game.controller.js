import {
  createGame,
  getGame,
  updateGame,
} from "../services/game.service.js";

import { generateAIResponse } from "../services/ai.service.js";
import Score from "../models/score.model.js";



// Start a new negotiation game
export const startGame = async (req, res) => {
  try {
    // Create a new game for the logged-in user
    const game = createGame(req.user._id);

    return res.status(201).json({
      success: true,
      message: "Game started successfully",
      data: game,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// Handle a negotiation round
export const negotiate = async (req, res) => {
  try {
    const { gameId, offer, message } = req.body;

    const game = getGame(gameId);


    // Ensure game exists
    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }


    // Ensure the game belongs to the logged-in user
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
        message: "Game already ended",
      });
    }


    // Convert and validate offer safely
    const numericOffer = Number(offer);

    if (!Number.isFinite(numericOffer) || numericOffer <= 0) {
      return res.status(400).json({
        success: false,
        message: "Offer must be a valid positive number",
      });
    }


    let decision = "counter";


    // Backend controls negotiation logic (AI does NOT decide price)
    if (numericOffer >= game.currentPrice) {
      decision = "accept";
      game.status = "accepted";
      game.currentPrice = numericOffer;
    }

    else if (numericOffer < game.minPrice) {
      decision = "reject";
    }

    else {
      // Reduce price based on seller personality
      const reduction =
        game.personality === "desperate" ? 800 : 400;

      game.currentPrice = Math.max(
        game.minPrice,
        game.currentPrice - reduction
      );
    }


    // Generate AI message based on decision and current state
    const aiMessage =
      (await generateAIResponse({
        personality: game.personality,
        currentPrice: game.currentPrice,
        minPrice: game.minPrice,
        userOffer: numericOffer,
        userMessage: message,
        decision,
      })) || "Processing your offer...";


    // Move to next round
    game.round += 1;


    // End game if max rounds reached
    if (game.round > game.maxRounds && game.status === "ongoing") {
      game.status = "ended";
    }


    // Save score ONLY once when game finishes
    if (
      (game.status === "accepted" || game.status === "ended") &&
      !game.scoreSaved
    ) {
      const score =
        (game.initialPrice - game.currentPrice) /
        game.initialPrice;

      // Remove old scores for this user (one score per user)
      await Score.deleteMany({ user: req.user._id });

      // Save new score
      await Score.create({
        user: req.user._id,
        username: req.user.username,
        finalPrice: game.currentPrice,
        initialPrice: game.initialPrice,
        score,
      });

      // Mark as saved to prevent duplicates
      game.scoreSaved = true;
    }


    // Update game AFTER all modifications
    updateGame(gameId, game);


    return res.status(200).json({
      success: true,
      message: "Negotiation updated successfully",
      data: {
        decision,
        aiMessage,
        currentPrice: game.currentPrice,
        round: game.round,
        status: game.status,
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};