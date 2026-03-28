// In-memory store for active games (MVP only, not persistent)
const games = new Map();


// Create a new game session for a user
export const createGame = (userId) => {
  const gameId = Math.random().toString(36).substring(7);

  const game = {
    gameId,
    userId,

    initialPrice: 10000,
    currentPrice: 10000,

    minPrice: 7000,     // seller will never go below this
    targetPrice: 9000,  // ideal selling price

    round: 1,
    maxRounds: 6,

    personality: Math.random() > 0.5 ? "greedy" : "desperate",

    status: "ongoing", // ongoing | accepted | ended
  };

  games.set(gameId, game);

  return game;
};


// Retrieve game by ID
export const getGame = (gameId) => {
  return games.get(gameId);
};


// Update game state
export const updateGame = (gameId, updatedGame) => {
  games.set(gameId, updatedGame);
};