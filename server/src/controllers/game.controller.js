import {
  createGame,
  getGame,
  updateGame,
} from "../services/game.service.js";



// Start a new negotiation game
export const startGame = async (req, res) => {
  try {
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

    // Check if game exists
    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    // Ensure game is still active
    if (game.status !== "ongoing") {
      return res.status(400).json({
        success: false,
        message: "Game already ended",
      });
    }

    let decision = "counter";
    let aiMessage = "";


    // If offer is equal or higher than current price → accept
    if (offer >= game.currentPrice) {
      decision = "accept";
      game.status = "accepted";
      game.currentPrice = offer;

      aiMessage = "Deal accepted.";

    }

    // If offer is below minimum threshold → reject strongly
    else if (offer < game.minPrice) {
      aiMessage = "This offer is too low. I cannot accept it.";

    }

    // Otherwise → counter offer based on personality
    else {
      const reduction =
        game.personality === "desperate" ? 800 : 400;

      game.currentPrice = Math.max(
        game.minPrice,
        game.currentPrice - reduction
      );

      aiMessage = `I can offer it for ₹${game.currentPrice}`;
    }


    // Move to next round
    game.round += 1;


    // End game if max rounds reached without agreement
    if (game.round > game.maxRounds && game.status === "ongoing") {
      game.status = "ended";
      aiMessage = "Negotiation ended. No agreement reached.";
    }


    updateGame(gameId, game);


    return res.status(200).json({
      success: true,
      message: "Negotiation updated",
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