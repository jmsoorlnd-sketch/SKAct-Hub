import { createContext, useEffect, useState } from "react";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      try {
        // storedUser may be the string "undefined" or "null" from incorrect writes;
        // guard against that and any malformed JSON.
        const cleaned = String(storedUser).trim();
        if (
          cleaned &&
          cleaned.toLowerCase() !== "undefined" &&
          cleaned.toLowerCase() !== "null"
        ) {
          setUser(JSON.parse(cleaned));
        }
      } catch (err) {
        console.warn("Failed to parse stored user from localStorage:", err);
        // keep user null
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
