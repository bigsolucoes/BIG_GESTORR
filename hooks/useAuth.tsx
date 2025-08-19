
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types'; // Assuming User type is defined
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import * as blobService from '../services/blobStorageService';

// NOTE: This is a basic prototype authentication.
// DO NOT use localStorage for sensitive data like passwords in production.
// Use secure methods like hashing passwords server-side and JWTs.

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (username: string, pass: string) => Promise<string | null>; // Returns error message string or null on success
  register: (username: string, email: string, pass: string) => Promise<string | null>; // Returns error message string or null on success
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SYSTEM_USER_ID = 'system_data'; // A fixed ID for non-user-specific data like the user list.

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for logged-in user in localStorage on initial load. This is session state, not DB.
    try {
      const storedUser = localStorage.getItem('big_currentUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error parsing stored user:", error);
      localStorage.removeItem('big_currentUser');
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, pass: string): Promise<string | null> => {
    setLoading(true);
    // Failsafe login
    if (username.toLowerCase() === 'admin' && pass === 'admin') {
      const adminUser: User = { id: 'admin_user_id', username: 'admin', email: 'admin@big.com' };
      localStorage.setItem('big_currentUser', JSON.stringify(adminUser));
      setCurrentUser(adminUser);
      setLoading(false);
      return null;
    }

    try {
      const storedUsers = await blobService.get<User[]>(SYSTEM_USER_ID, 'users');
      const users = storedUsers || [];
      const foundUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());

      if (!foundUser) {
        setLoading(false);
        return "Usuário não encontrado.";
      }

      // Simulate password check (highly insecure, for prototype only)
      const storedUserPass = await blobService.get<string>(SYSTEM_USER_ID, `user_pass_${username.toLowerCase()}`);

      if (storedUserPass === pass) {
        const sessionUser: User = { id: foundUser.id, username: foundUser.username, email: foundUser.email };
        localStorage.setItem('big_currentUser', JSON.stringify(sessionUser));
        setCurrentUser(sessionUser);
        setLoading(false);
        return null; // Success
      } else {
        setLoading(false);
        return "Senha incorreta.";
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoading(false);
      return "Ocorreu um erro inesperado. Tente novamente.";
    }
  }, []);

  const register = useCallback(async (username: string, email: string, pass: string): Promise<string | null> => {
    setLoading(true);
    // Prevent admin username registration
    if (username.toLowerCase() === 'admin') {
        setLoading(false);
        return "Este nome de usuário é reservado."; 
    }
    try {
      const storedUsers = await blobService.get<User[]>(SYSTEM_USER_ID, 'users');
      const users = storedUsers || [];
      
      if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        setLoading(false);
        return "Este nome de usuário já está em uso.";
      }
       if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        setLoading(false);
        return "Este email já está cadastrado.";
      }
      
      const newUser: User = { id: uuidv4(), username: username, email: email };
      const updatedUsers = [...users, newUser];
      
      await blobService.set(SYSTEM_USER_ID, 'users', updatedUsers);
      // Store plain password for prototype login check - EXTREMELY INSECURE
      await blobService.set(SYSTEM_USER_ID, `user_pass_${username.toLowerCase()}`, pass);

      // Automatically log in the new user
      const sessionUser: User = { id: newUser.id, username: newUser.username, email: newUser.email };
      localStorage.setItem('big_currentUser', JSON.stringify(sessionUser));
      setCurrentUser(sessionUser);
      setLoading(false);
      return null; // Success
    } catch (error) {
      console.error("Registration error:", error);
      setLoading(false);
      return "Ocorreu um erro inesperado durante o registro.";
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('big_currentUser');
    sessionStorage.removeItem('brandingSplashShown'); // Clear session splash state on logout
    setCurrentUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};