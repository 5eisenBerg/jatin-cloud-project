import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (err) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    isAdmin: user?.role === 'admin',
    loading,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
    }
  }, [instance, accounts, isDevelopment]);

  // Load user profile
  const loadUserProfile = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.data);
    } catch (error) {
      console.error('Error loading user profile:', error);
      if (isDevelopment) {
        // Set mock user in development
        setUser({
          id: 'dev-user-id',
          email: 'dev@example.com',
          name: 'Development User',
          role: 'admin',
        });
      }
    }
  }, [isDevelopment]);

  // Login
  const login = async (role = 'user') => {
    try {
      setError(null);
      if (isDevelopment) {
        // Mock login in development
        const mockUser = {
          id: `dev-${role}-id`,
          email: `${role}@example.com`,
          name: role === 'admin' ? 'Admin User' : 'Test User',
          role,
        };
        setUser(mockUser);
        localStorage.setItem('devUser', JSON.stringify(mockUser));
        return;
      }
      await instance.loginPopup(loginRequest);
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
    }
  };

  // Logout
  const logout = async () => {
    try {
      if (isDevelopment) {
        setUser(null);
        localStorage.removeItem('devUser');
        return;
      }
      await instance.logoutPopup();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        if (isDevelopment) {
          const savedUser = localStorage.getItem('devUser');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
        } else if (isAuthenticated && accounts.length > 0) {
          await loadUserProfile();
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (inProgress === InteractionStatus.None) {
      checkAuth();
    }
  }, [isAuthenticated, accounts, inProgress, loadUserProfile, isDevelopment]);

  // Set API token
  useEffect(() => {
    const setApiToken = async () => {
      const token = await getAccessToken();
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    };

    if (isAuthenticated || (isDevelopment && user)) {
      setApiToken();
    }
  }, [isAuthenticated, user, getAccessToken, isDevelopment]);

  const value = {
    user,
    isAuthenticated: isAuthenticated || (isDevelopment && !!user),
    isAdmin: user?.role === 'admin',
    loading: loading || inProgress !== InteractionStatus.None,
    error,
    login,
    logout,
    getAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
