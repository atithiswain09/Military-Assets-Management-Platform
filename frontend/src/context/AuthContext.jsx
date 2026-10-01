import React, { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import { ROLES, ROLE_PERMISSIONS } from '../utils/constants';
import { authApi } from '../api/authApi';

export const AuthContext = createContext(null);


const normalizeRole = (roleName) => {
  if (!roleName) return ROLES.ADMIN;
  const upper = roleName.toUpperCase();
  if (upper === 'ADMIN') return ROLES.ADMIN;
  if (upper === 'BASE_COMMANDER') return ROLES.BASE_COMMANDER;
  if (upper === 'LOGISTICS_OFFICER') return ROLES.LOGISTICS_OFFICER;
  return roleName;
};

const normalizeUser = (backendUser) => {
  if (!backendUser) return null;
  return {
    ...backendUser,
    role: normalizeRole(backendUser.role_name || backendUser.role),
    base: backendUser.base_name || backendUser.base || 'HQ Command Center',
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('assetflow_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('assetflow_token');
  });
  const [loading, setLoading] = useState(true);

  // Restore auth state from backend on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('assetflow_token');
      if (token) {
        try {
          const res = await authApi.getMe();
          if (res?.success && res?.data) {
            const formatted = normalizeUser(res.data);
            setUser(formatted);
            setIsAuthenticated(true);
            localStorage.setItem('assetflow_user', JSON.stringify(formatted));
          } else {
            throw new Error('Failed to verify token');
          }
        } catch (err) {
          console.error('Session restore failed:', err);
          localStorage.removeItem('assetflow_token');
          localStorage.removeItem('assetflow_user');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const res = await authApi.login(email, password);
      if (res?.success && res?.data?.token) {
        const { token, user: backendUser } = res.data;
        const formattedUser = normalizeUser(backendUser);

        localStorage.setItem('assetflow_token', token);
        localStorage.setItem('assetflow_user', JSON.stringify(formattedUser));

        setUser(formattedUser);
        setIsAuthenticated(true);
        return { success: true, user: formattedUser };
      }
      throw new Error(res?.message || 'Login failed');
    } catch (err) {
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout notification error:', err);
    } finally {
      localStorage.removeItem('assetflow_token');
      localStorage.removeItem('assetflow_user');
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const switchRole = useCallback((role) => {
    if (user) {
      const updated = { ...user, role };
      setUser(updated);
      localStorage.setItem('assetflow_user', JSON.stringify(updated));
    }
  }, [user]);

  const hasPermission = useCallback(
    (module, action) => {
      if (!user) return false;
      const perms = ROLE_PERMISSIONS[user.role];
      if (!perms) return false;
      if (typeof perms[module] === 'boolean') return perms[module];
      return perms[module]?.[action] ?? false;
    },
    [user]
  );

  const canAccessModule = useCallback(
    (module) => {
      if (!user) return false;
      const perms = ROLE_PERMISSIONS[user.role];
      if (!perms) return false;
      if (typeof perms[module] === 'boolean') return perms[module];
      return perms[module]?.view ?? false;
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      loading,
      login,
      logout,
      switchRole,
      hasPermission,
      canAccessModule,
    }),
    [user, isAuthenticated, loading, login, logout, switchRole, hasPermission, canAccessModule]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

