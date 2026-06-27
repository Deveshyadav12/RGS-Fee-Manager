import { useState } from "react";
import { api } from "../api/client";
import { setRole, setToken } from "./authStore";

export function Login() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [role, setRoleChoice] = useState("ADMIN");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await api.login({ username, password, role });
      setToken(response.token);
      setRole(response.role);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <h2>School ERP Login</h2>
        <p>Use admin or teacher credentials to continue.</p>
        <form onSubmit={submit}>
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} />

          <label>Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />

          <label>Role</label>
          <select value={role} onChange={(e) => setRoleChoice(e.target.value)}>
            <option value="ADMIN">ADMIN</option>
            <option value="TEACHER">TEACHER</option>
          </select>

          {error && <div className="alert alert-error">{error}</div>}
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

