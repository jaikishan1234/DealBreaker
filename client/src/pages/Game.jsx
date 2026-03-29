import { useEffect, useState, useRef } from "react";
import axios from "axios";

function Game() {
  const [game, setGame] = useState(null);
  const [offer, setOffer] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const chatRef = useRef();

  const token = localStorage.getItem("token");


  // Start game on load
  useEffect(() => {
    const startGame = async () => {
      try {
        const res = await axios.post(
          "http://localhost:5000/api/game/start",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const gameData = res.data.data;

        setGame(gameData);

        // Initial AI message
        setChat([
          {
            sender: "ai",
            text: `Starting price is ₹${gameData.currentPrice}`,
          },
        ]);

      } catch (err) {
        alert("Failed to start game");
      }
    };

    startGame();
  }, []);


  // Auto-scroll chat when new message comes
  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chat]);


  // Send offer to backend
  const handleSend = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/game/negotiate",
        {
          gameId: game.gameId,
          offer: Number(offer),
          message,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = res.data.data;

      // Add user + AI messages
      setChat((prev) => [
        ...prev,
        { sender: "user", text: `₹${offer} - ${message}` },
        { sender: "ai", text: data.aiMessage },
      ]);

      // Clear inputs
      setOffer("");
      setMessage("");

      // Update game state
      setGame((prev) => ({
        ...prev,
        currentPrice: data.currentPrice,
        round: data.round,
        status: data.status,
      }));

    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };


  if (!game) return <p>Loading game...</p>;


  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      <h2>Negotiation Game</h2>

      <p><b>Current Price:</b> ₹{game.currentPrice}</p>
      <p><b>Round:</b> {game.round}</p>
      <p><b>Status:</b> {game.status}</p>


      {/* Chat Box */}
      <div
        ref={chatRef}
        style={{
          border: "1px solid #ccc",
          padding: "10px",
          height: "300px",
          overflowY: "scroll",
          marginBottom: "10px",
          borderRadius: "10px",
        }}
      >
        {chat.map((msg, i) => (
          <div
            key={i}
            style={{
              textAlign: msg.sender === "user" ? "right" : "left",
              margin: "5px 0",
            }}
          >
            <span
              style={{
                background: msg.sender === "user" ? "#4caf50" : "#333",
                color: "#fff",
                padding: "8px 12px",
                borderRadius: "12px",
                display: "inline-block",
                maxWidth: "70%",
              }}
            >
              {msg.text}
            </span>
          </div>
        ))}
      </div>


      {/* Inputs */}
      {game.status === "ongoing" && (
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            placeholder="Your offer"
            value={offer}
            onChange={(e) => setOffer(e.target.value)}
            style={{ flex: 1 }}
          />

          <input
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ flex: 2 }}
          />

          <button
            onClick={handleSend}
            disabled={!offer || !message}
          >
            Send
          </button>
        </div>
      )}


      {/* Game Over */}
      {game.status !== "ongoing" && (
        <h3 style={{ marginTop: "20px" }}>
          Game Over 🎯
        </h3>
      )}

      <button onClick={() => (window.location.href = "/leaderboard")}>
        View Leaderboard
        </button>
    </div>
  );
}

export default Game;