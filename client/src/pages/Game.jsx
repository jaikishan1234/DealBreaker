import { useEffect, useState, useRef } from "react";
import { 
  TrendingDown, 
  Clock, 
  Activity, 
  Send, 
  Trophy, 
  MessageSquare, 
  AlertCircle 
} from "lucide-react";
import axios from "axios";

function Game() {
  const [game, setGame] = useState(null);
  const [offer, setOffer] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const chatRef = useRef();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const startGame = async () => {
      try {
        const res = await axios.post(
          "http://localhost:5000/api/game/start",
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const gameData = res.data.data;
        setGame(gameData);
        setChat([{ sender: "ai", text: `Welcome! Starting price is ₹${gameData.currentPrice}.` }]);
      } catch (err) {
        window.location.href = "/";
      }
    };
    startGame();
  }, [token]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chat]);

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/game/negotiate",
        { gameId: game.gameId, offer: Number(offer), message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = res.data.data;
      setChat((prev) => [
        ...prev,
        { sender: "user", text: `₹${offer} | ${message}` },
        { sender: "ai", text: data.aiMessage },
      ]);
      setOffer("");
      setMessage("");
      setGame((prev) => ({ ...prev, currentPrice: data.currentPrice, round: data.round, status: data.status }));
    } catch (err) {
      alert("Error sending offer");
    } finally {
      setLoading(false);
    }
  };

  if (!game) return <div className="auth-page"><Activity className="spinning" /></div>;

  return (
    <div className="game-page">
      <div className="game-container">
        
        {/* Stats Bar with Lucide Icons */}
        <div className="game-stats">
          <div className="stat-card">
            <span className="label"><TrendingDown size={14} /> Current Price</span>
            <span className="value">₹{game.currentPrice}</span>
          </div>
          <div className="stat-card">
            <span className="label"><Clock size={14} /> Round</span>
            <span className="value">{game.round}/5</span>
          </div>
          <div className="stat-card">
            <span className="label"><Activity size={14} /> Status</span>
            <span className={`status-badge ${game.status}`}>{game.status}</span>
          </div>
        </div>

        {/* Chat Window */}
        <div className="chat-window" ref={chatRef}>
          {chat.map((msg, i) => (
            <div key={i} className={`chat-bubble-container ${msg.sender}`}>
              <div className="chat-bubble">
                {msg.sender === 'ai' && <MessageSquare size={12} style={{marginRight: '8px'}} />}
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Action Area */}
        <div className="game-actions">
          {game.status === "ongoing" ? (
            <form onSubmit={handleSend} className="input-group">
              <input
                className="game-input offer-input"
                type="number"
                placeholder="Offer"
                value={offer}
                onChange={(e) => setOffer(e.target.value)}
                required
              />
              <input
                className="game-input msg-input"
                placeholder="Message AI..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button type="submit" className="btn-success send-btn" disabled={loading}>
                <Send size={18} />
              </button>
            </form>
          ) : (
            <div className="game-over-area">
              <AlertCircle color="#ef4444" size={32} />
              <h3>Negotiation Ended</h3>
              <p>Final Price: ₹{game.currentPrice}</p>
            </div>
          )}

          <button className="btn-primary" style={{marginTop: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}} onClick={() => (window.location.href = "/leaderboard")}>
            <Trophy size={18} /> View Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default Game;