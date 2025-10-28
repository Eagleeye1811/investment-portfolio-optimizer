import React, { createContext, useState, useEffect, useContext } from 'react';
// Fix import path
import { Auth } from 'aws-amplify/auth';

const AuthContext = createContext({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  signIn: async () => {},
  signUp: async () => {},
  confirmSignUp: async () => {},
  signOut: async () => {},
  forgotPassword: async () => {},
  forgotPasswordSubmit: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAmplifyConfigured, setIsAmplifyConfigured] = useState(false);

  // Check if Amplify is configured
  useEffect(() => {
    try {
      // Check if Auth is properly configured by attempting to get the config
      if (Auth && Auth.configure) {
        const config = Auth.configure();
        if (config && config.userPoolId && config.userPoolWebClientId) {
          setIsAmplifyConfigured(true);
        } else {
          console.error('Amplify Auth configuration is incomplete. Missing userPoolId or userPoolWebClientId.');
        }
      }
    } catch (error) {
      console.error('Error checking Amplify configuration:', error);
    }
  }, []);

  // Only check auth state after confirming Amplify is configured
  useEffect(() => {
    if (isAmplifyConfigured) {
      checkAuthState();
    }
  }, [isAmplifyConfigured]);

  async function checkAuthState() {
    try {
      const currentUser = await Auth.currentAuthenticatedUser();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      // Not treating this as an error - user may simply not be logged in
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }

  const signIn = async (username, password) => {
    try {
      const user = await Auth.signIn(username, password);
      setUser(user);
      setIsAuthenticated(true);
      return user;
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (username, password, email) => {
    try {
      const { user } = await Auth.signUp({
        username,
        password,
        attributes: { email }
      });
      return user;
    } catch (error) {
      throw error;
    }
  };

  const confirmSignUp = async (username, code) => {
    try {
      return await Auth.confirmSignUp(username, code);
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await Auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      throw error;
    }
  };

  const forgotPassword = async (username) => {
    try {
      return await Auth.forgotPassword(username);
    } catch (error) {
      throw error;
    }
  };

  const forgotPasswordSubmit = async (username, code, newPassword) => {
    try {
      return await Auth.forgotPasswordSubmit(username, code, newPassword);
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        isAmplifyConfigured,
        signIn,
        signUp,
        confirmSignUp,
        signOut,
        forgotPassword,
        forgotPasswordSubmit,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
