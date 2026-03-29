import { useEffect, useState } from "react";
import axios from "axios";

function Leaderboard() {
  const [scores, setScores] = useState([]);

  const token = localStorage.getItem("token");


  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/leaderboard",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setScores(res.data.data);

      } catch (err) {
        alert("Failed to load leaderboard");
      }
    };

    fetchLeaderboard();
  }, []);


  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      <h2>🏆 Leaderboard</h2>

      {scores.length === 0 ? (
        <p>No scores yet</p>
      ) : (
        <table border="1" width="100%" cellPadding="10">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Username</th>
              <th>Final Price</th>
              <th>Score</th>
            </tr>
          </thead>

          <tbody>
            {scores.map((s, i) => (
              <tr key={s._id}>
                <td>{i + 1}</td>
                <td>{s.username}</td>
                <td>₹{s.finalPrice}</td>
                <td>{s.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Leaderboard;