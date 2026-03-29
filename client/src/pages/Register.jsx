import { useState } from "react";
import axios from "axios";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/auth/register", { username, email, password });
      alert("Registration successful! Please login.");
      window.location.href = "/";
    } catch (err) {
      alert(err.response?.data?.message || "Error during registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Create Account</h2>
        <p className="subtitle">Join the leaderboard and start playing</p>
        <form onSubmit={handleRegister}>
          <input 
            placeholder="Username" 
            required 
            onChange={(e) => setUsername(e.target.value)} 
          />
          <input 
            type="email" 
            placeholder="Email Address" 
            required 
            onChange={(e) => setEmail(e.target.value)} 
          />
          <input 
            type="password" 
            placeholder="Create Password" 
            required 
            onChange={(e) => setPassword(e.target.value)} 
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>
        <p className="footer-text">
          Already have an account? <a href="/" className="link-primary">Log In</a>
        </p>
      </div>
    </div>
  );
}

export default Register;