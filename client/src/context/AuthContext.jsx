import React, { createContext, useContext, useState, useEffect } from 'react';
import { initDb, logAuditAction } from '../services/db';

const AuthContext = createContext();

const SESSION_KEY = 'fv_user_session';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuthSession() {
      // Initialize database cache from SQLite
      await initDb();

      // Only persist sales_rep sessions (on mobile devices).
      // For admin and manager: strictly in-memory session! Refreshing logs them out immediately.
      const savedRepSession = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
      if (savedRepSession) {
        try {
          const userObj = JSON.parse(savedRepSession);
          if (userObj.role === 'sales_rep') {
            const res = await fetch('/api/users');
            if (res.ok) {
              const allUsers = await res.json();
              const freshUser = allUsers.find(u => u.id === userObj.id || u.email.toLowerCase() === userObj.email.toLowerCase());
              if (freshUser && freshUser.status !== 'Inactive') {
                setCurrentUser(freshUser);
              } else {
                localStorage.removeItem(SESSION_KEY);
                sessionStorage.removeItem(SESSION_KEY);
              }
            } else {
              setCurrentUser(userObj);
            }
          } else {
            // Admin and manager are never restored on page refresh
            localStorage.removeItem(SESSION_KEY);
            sessionStorage.removeItem(SESSION_KEY);
          }
        } catch (err) {
          localStorage.removeItem(SESSION_KEY);
          sessionStorage.removeItem(SESSION_KEY);
        }
      }
      setLoading(false);
    }

    checkAuthSession();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          message: data.message || 'Authentication failed. Please verify your credentials.'
        };
      }

      setCurrentUser(data.user);

      // Requirement: For admin and manager it would be session-wise (refreshing should logout the person)
      if (data.user.role === 'sales_rep') {
        localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
      } else {
        // Admin and Manager: kept strictly in-memory; refresh logs them out immediately
        localStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_KEY);
      }

      return { success: true, user: data.user };
    } catch (err) {
      return {
        success: false,
        message: 'Could not connect to FieldVision Database Server. Ensure backend is running.'
      };
    }
  };

  const logout = () => {
    if (currentUser) {
      logAuditAction('User logged out', currentUser.name);
    }
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  };

  const sendPasswordResetOtp = async (email) => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const users = await res.json();
        const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
        if (!user) {
          return { success: false, message: 'Email address not registered in system.' };
        }
        const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
        return {
          success: true,
          message: `Authentication OTP sent to registered number ${user.phone || 'on file'}. (OTP Code: ${generatedOtp})`,
          otp: generatedOtp,
          user
        };
      }
    } catch (err) {
      console.error(err);
    }
    return { success: false, message: 'Could not communicate with database.' };
  };

  const resetPasswordWithOtp = async (userId, newPassword) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });
      if (res.ok) {
        return { success: true, message: 'Password updated successfully! You can now log in.' };
      }
    } catch (err) {
      console.error(err);
    }
    return { success: false, message: 'Failed to update password.' };
  };

  const updateCurrentUserAvatar = async (avatarBase64) => {
    if (!currentUser) return { success: false, message: 'No authenticated user' };
    try {
      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: avatarBase64 })
      });
      if (res.ok) {
        const data = await res.json();
        const updated = data.user || { ...currentUser, avatar: avatarBase64 };
        setCurrentUser(updated);
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
        logAuditAction('Updated profile avatar from device', updated.name);
        return { success: true, user: updated };
      }
    } catch (err) {
      console.error('Failed to update profile avatar:', err);
    }
    return { success: false, message: 'Failed to update avatar in database.' };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        login,
        logout,
        sendPasswordResetOtp,
        resetPasswordWithOtp,
        updateCurrentUserAvatar,
        isAdmin: currentUser?.role === 'admin',
        isManager: currentUser?.role === 'manager',
        isSalesRep: currentUser?.role === 'sales_rep'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
