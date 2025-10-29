import React, { createContext, useState, useEffect, useContext } from 'react';
import { signIn, signUp, confirmSignUp, signOut, getCurrentUser, fetchAuthSession, resetPassword, confirmResetPassword } from 'aws-amplify/auth';

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

  useEffect(() => {
    checkAuthState();
  }, []);

  async function checkAuthState() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(true);
      console.log('✅ User authenticated:', currentUser.username);
    } catch (error) {
      // User not authenticated - this is normal
      setUser(null);
      setIsAuthenticated(false);
      console.log('ℹ️ No authenticated user');
    } finally {
      setIsLoading(false);
    }
  }

  const handleSignIn = async (username, password) => {
    try {
      const { isSignedIn, nextStep } = await signIn({ username, password });
      
      if (isSignedIn) {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        setIsAuthenticated(true);
        console.log('✅ Sign in successful');
        return currentUser;
      }
      
      // Handle additional steps (MFA, etc.)
      console.log('Next step:', nextStep);
      return { nextStep };
    } catch (error) {
      console.error('❌ Sign in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  const handleSignUp = async (username, password, email) => {
    try {
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username,
        password,
        options: {
          userAttributes: {
            email
          }
        }
      });
      
      console.log('✅ Sign up successful, confirmation needed');
      return { userId, nextStep };
    } catch (error) {
      console.error('❌ Sign up error:', error);
      throw new Error(error.message || 'Failed to sign up');
    }
  };

  const handleConfirmSignUp = async (username, code) => {
    try {
      const { isSignUpComplete, nextStep } = await confirmSignUp({
        username,
        confirmationCode: code
      });
      
      console.log('✅ Email confirmed successfully');
      return { isSignUpComplete, nextStep };
    } catch (error) {
      console.error('❌ Confirmation error:', error);
      throw new Error(error.message || 'Failed to confirm sign up');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setIsAuthenticated(false);
      console.log('✅ Signed out successfully');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  };

  const handleForgotPassword = async (username) => {
    try {
      const output = await resetPassword({ username });
      console.log('✅ Password reset code sent');
      return output;
    } catch (error) {
      console.error('❌ Forgot password error:', error);
      throw new Error(error.message || 'Failed to initiate password reset');
    }
  };

  const handleForgotPasswordSubmit = async (username, code, newPassword) => {
    try {
      await confirmResetPassword({
        username,
        confirmationCode: code,
        newPassword
      });
      console.log('✅ Password reset successful');
    } catch (error) {
      console.error('❌ Password reset error:', error);
      throw new Error(error.message || 'Failed to reset password');
    }
  };

  // Helper function to get JWT token (for API calls later)
  const getAuthToken = async () => {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString();
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        signIn: handleSignIn,
        signUp: handleSignUp,
        confirmSignUp: handleConfirmSignUp,
        signOut: handleSignOut,
        forgotPassword: handleForgotPassword,
        forgotPasswordSubmit: handleForgotPasswordSubmit,
        getAuthToken // Export this for API calls
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);