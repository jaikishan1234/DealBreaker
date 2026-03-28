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


    // Validate offer input
    if (!offer || isNaN(offer)) {
      return res.status(400).json({
        success: false,
        message: "Valid offer amount is required",
      });
    }


    let decision = "counter";


    // Backend controls negotiation logic
    if (offer >= game.currentPrice) {
      decision = "accept";
      game.status = "accepted";
      game.currentPrice = offer;
    }

    else if (offer < game.minPrice) {
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


    // Generate AI message based on decision + state
    const aiMessage = await generateAIResponse({
      personality: game.personality,
      currentPrice: game.currentPrice,
      minPrice: game.minPrice,
      userOffer: offer,
      userMessage: message,
      decision,
    });


    // Move to next round
    game.round += 1;


    // End game if max rounds reached
    if (game.round > game.maxRounds && game.status === "ongoing") {
      game.status = "ended";
    }


    // Save updated game state
    updateGame(gameId, game);


    // Automatically save score when game finishes
    if (game.status === "accepted" || game.status === "ended") {

      // Calculate score based on negotiation performance
      const score =
        (game.initialPrice - game.currentPrice) /
        game.initialPrice;


      // Remove old scores for this user to avoid duplicates
      await Score.deleteMany({ user: req.user._id });


      // Save new score
      await Score.create({
        user: req.user._id,
        username: req.user.username,
        finalPrice: game.currentPrice,
        initialPrice: game.initialPrice,
        score,
      });
    }


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