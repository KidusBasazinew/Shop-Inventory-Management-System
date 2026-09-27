import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e) => {
    e.preventDefault();
    login(email, password).catch(() => {});
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>ShopOS Admin</h1>
        <p>Platform owner console subscriptions, shops and usage.</p>
        <form onSubmit={submit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error ? <div className="error-text">{error}</div> : null}
          <button className="primary" disabled={isLoading}>
            {isLoading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
