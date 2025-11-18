import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('authUser');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('authUser', JSON.stringify(user));
    else localStorage.removeItem('authUser');
  }, [user]);

  const login = async ({ email, password }) => {
    // Demo: accept any non-empty email/password
    if (!email || !password) throw new Error('Email and password are required');
    const demoUser = { id: 'demo', email };
    setUser(demoUser);
    return demoUser;
  };

  const signup = async ({ name, email, password }) => {
    if (!name || !email || !password) throw new Error('All fields are required');
    const newUser = { id: 'demo', name, email };
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    setUser(null);
  };

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user),
    login,
    signup,
    logout,
  }), [user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

