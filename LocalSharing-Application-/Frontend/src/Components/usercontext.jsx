import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext(null);

const API_BASE = "http://localhost:5001/api";

export function UserProvider({ children }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await fetch(`${API_BASE}/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            setUserData(data);
          } else {
            localStorage.removeItem("token");
          }
        } catch (err) {
          console.error("Error verifying token:", err);
        }
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const loginUser = (user, token) => {
    localStorage.setItem("token", token);
    setUserData(user);
  };

  const logoutUser = () => {
    localStorage.removeItem("token");
    setUserData(null);
  };

  return (
    <UserContext.Provider value={{ userData, setUserData, loginUser, logoutUser, loading }}>
      {loading ? (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0f",
          color: "#e8e8f0",
          fontFamily: "system-ui, sans-serif"
        }}>
          <div style={{
            width: 40,
            height: 40,
            border: "3px solid rgba(229,56,59,0.2)",
            borderTop: "3px solid #E5383B",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            marginBottom: 16
          }} />
          <p style={{ fontSize: 14, opacity: 0.8 }}>Initializing secure connection...</p>
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      ) : children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}