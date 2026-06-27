import { useEffect, useState } from "react";
import { Login } from "../auth/Login";
import { getToken } from "../auth/authStore";
import App from "../App";

export function LoginGate() {
  const [token, setTokenState] = useState<string | null>(null);

  useEffect(() => {
    setTokenState(getToken());
  }, []);

  if (!token) {
    return <Login />;
  }

  return <App />;
}

