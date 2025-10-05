// authContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Define the types for the context
interface AuthContextType {
  token: string | null;
  userData: any | null;
  setAuth: (token: string, userData: any) => void;
  logout: () => void;
}

// Define the type for children
interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("authToken")
  );
  const [userData, setUserData] = useState<any | null>(
    JSON.parse(localStorage.getItem("userData") || "null")
  );

  useEffect(() => {
    if (token) {
      // Optional: Make a request to /me to fetch user data based on the token
    }
  }, [token]);

  const setAuth = (token: string, userData: any) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("userData", JSON.stringify(userData));
    setToken(token);
    setUserData(userData);
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    setToken(null);
    setUserData(null);
  };

  return (
    <AuthContext.Provider value={{ token, userData, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
