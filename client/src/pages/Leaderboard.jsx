import { useEffect, useState } from "react";
import { Trophy, Medal, User, CircleDollarSign, ChevronLeft, Star } from "lucide-react";
import axios from "axios";

function Leaderboard() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/leaderboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setScores(res.data.data);
      } catch (err) {
        console.error("Error fetching leaderboard");
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [token]);

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-container">
        <div className="leaderboard-header">
          <Trophy size={48} color="#fbbf24" style={{marginBottom: '15px'}} />
          <h1>Global Rankings</h1>
          <p>Top negotiators competing for the best price</p>
        </div>

        {loading ? (
          <div className="status-text">Fetching Scores...</div>
        ) : (
          <div className="table-wrapper">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th><Star size={14} /> Rank</th>
                  <th><User size={14} /> Player</th>
                  <th><CircleDollarSign size={14} /> Final Price</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((s, i) => (
                  <tr key={s._id} className={i === 0 ? "first-place" : ""}>
                    <td className="rank-col">
                      {i === 0 ? <Medal color="#fbbf24" /> : i === 1 ? <Medal color="#94a3b8" /> : i === 2 ? <Medal color="#cd7f32" /> : `#${i + 1}`}
                    </td>
                    <td className="player-name">{s.username}</td>
                    <td>₹{s.finalPrice}</td>
                    <td><span className="score-badge">{s.score}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button className="btn-primary back-btn" style={{display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center'}} onClick={() => (window.location.href = "/game")}>
          <ChevronLeft size={18} /> Back to Game
        </button>
      </div>
    </div>
  );
}

export default Leaderboard;