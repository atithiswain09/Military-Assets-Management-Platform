import React, { useState, useEffect } from 'react';
import { Moon, Sun, Bell, Shield, Eye, Monitor, Laptop, Smartphone, X, Clock, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { settingsApi } from '../../api/settingsApi';

const Settings = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  // State management
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [notifications, setNotifications] = useState({
    transfers: true,
    purchases: true,
    assignments: true,
    system: false,
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  const [is2faEnabled, setIs2faEnabled] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessions, setSessions] = useState([]);

  const [loading, setLoading] = useState({
    appearance: false,
    notifications: false,
    password: false,
    twoFA: false,
    export: false,
    sessions: false,
    revokeId: null,
  });

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Sync initial theme with context
  useEffect(() => {
    setSelectedTheme(theme);
  }, [theme]);

  // Load saved settings from backend on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await settingsApi.getSettings();
        if (response.success && response.data) {
          const { theme: savedTheme, notifications: savedNotifs, is2faEnabled: saved2FA } = response.data;
          const localTheme = localStorage.getItem('assetflow_theme');
          const rawTheme = localTheme || savedTheme;
          const activeTheme = rawTheme === 'dark' ? 'dark' : 'light';
          setSelectedTheme(activeTheme);
          setTheme(activeTheme);
          
          if (savedNotifs) {
            setNotifications((prev) => ({ ...prev, ...savedNotifs }));
          }
          if (saved2FA !== undefined) {
            setIs2faEnabled(saved2FA);
          }
        }
      } catch (err) {
        console.warn('Could not load user settings from backend:', err);
      }
    };
    fetchSettings();
  }, []);

  // 1. Save Appearance Settings
  const handleSaveAppearance = async () => {
    setLoading((prev) => ({ ...prev, appearance: true }));
    try {
      setTheme(selectedTheme);
      await settingsApi.updateSettings({ theme: selectedTheme, notifications });
      showToast('Appearance settings saved successfully');
    } catch (err) {
      showToast(err.message || 'Failed to save appearance settings', 'error');
    } finally {
      setLoading((prev) => ({ ...prev, appearance: false }));
    }
  };

  // 2. Save Notification Preferences
  const handleSaveNotifications = async () => {
    setLoading((prev) => ({ ...prev, notifications: true }));
    try {
      await settingsApi.updateSettings({ theme: selectedTheme, notifications });
      showToast('Notification preferences saved successfully');
    } catch (err) {
      showToast(err.message || 'Failed to save notification preferences', 'error');
    } finally {
      setLoading((prev) => ({ ...prev, notifications: false }));
    }
  };

  // 3. Update Password
  const handleUpdatePassword = async (e) => {
    if (e) e.preventDefault();
    setPasswordError('');

    const { currentPassword, newPassword, confirmPassword } = passwords;

    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    if (!newPassword) {
      setPasswordError('New password is required');
      return;
    }
    if (!confirmPassword) {
      setPasswordError('Confirm new password is required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    setLoading((prev) => ({ ...prev, password: true }));
    try {
      const response = await settingsApi.changePassword({ currentPassword, newPassword, confirmPassword });
      if (response.success) {
        showToast('Password updated successfully');
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password. Verify current password.');
    } finally {
      setLoading((prev) => ({ ...prev, password: false }));
    }
  };

  // 4. Toggle 2FA
  const handleToggle2FA = async () => {
    setLoading((prev) => ({ ...prev, twoFA: true }));
    try {
      const targetState = !is2faEnabled;
      const response = await settingsApi.toggle2FA(targetState);
      if (response.success) {
        setIs2faEnabled(targetState);
        showToast(targetState ? 'Two-Factor Authentication enabled' : 'Two-Factor Authentication disabled');
      }
    } catch (err) {
      showToast(err.message || 'Failed to update Two-Factor Authentication', 'error');
    } finally {
      setLoading((prev) => ({ ...prev, twoFA: false }));
    }
  };

  // 5. Fetch Active Sessions
  const handleViewSessions = async () => {
    setShowSessionModal(true);
    setLoading((prev) => ({ ...prev, sessions: true }));
    try {
      const response = await settingsApi.getSessions();
      if (response.success && response.data) {
        setSessions(response.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load active sessions', 'error');
    } finally {
      setLoading((prev) => ({ ...prev, sessions: false }));
    }
  };

  // 6. Revoke Active Session
  const handleRevokeSession = async (sessionId) => {
    setLoading((prev) => ({ ...prev, revokeId: sessionId }));
    try {
      const response = await settingsApi.revokeSession(sessionId);
      if (response.success) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId || s.isCurrent));
        showToast('Session revoked successfully');
      }
    } catch (err) {
      showToast(err.message || 'Failed to revoke session', 'error');
    } finally {
      setLoading((prev) => ({ ...prev, revokeId: null }));
    }
  };

  // 7. Export Account Data
  const handleExportData = async () => {
    setLoading((prev) => ({ ...prev, export: true }));
    try {
      await settingsApi.exportUserData();
      showToast('Account data exported successfully');
    } catch (err) {
      showToast(err.message || 'Data export failed', 'error');
    } finally {
      setLoading((prev) => ({ ...prev, export: false }));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg shadow-lg animate-slide-in text-sm font-medium flex items-center gap-2 ${
            toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500">Manage your preferences and account settings</p>
      </div>

      {/* Appearance */}
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <Monitor size={16} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700">Appearance</h3>
        </div>
        <div className="card-body space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">Theme</p>
            <div className="flex gap-3">
              {[
                { key: 'light', label: 'Light', icon: Sun },
                { key: 'dark', label: 'Dark', icon: Moon },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    setSelectedTheme(t.key);
                    setTheme(t.key);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                    selectedTheme === t.key
                      ? 'bg-navy-50 border-navy-300 text-navy-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <t.icon size={15} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              size="sm"
              disabled={loading.appearance}
              onClick={handleSaveAppearance}
            >
              {loading.appearance ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <Bell size={16} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700">Notification Preferences</h3>
        </div>
        <div className="card-body space-y-4">
          {[
            { key: 'transfers', label: 'Transfer Notifications', desc: 'Get notified when assets are transferred' },
            { key: 'purchases', label: 'Purchase Notifications', desc: 'Get notified about new purchases and approvals' },
            { key: 'assignments', label: 'Assignment Notifications', desc: 'Get notified about asset assignments and returns' },
            { key: 'system', label: 'System Notifications', desc: 'Maintenance windows and system updates' },
          ].map((pref) => (
            <div key={pref.key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-slate-700">{pref.label}</p>
                <p className="text-xs text-slate-500">{pref.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifications((prev) => ({ ...prev, [pref.key]: !prev[pref.key] }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications[pref.key] ? 'bg-navy-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications[pref.key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <Button
              size="sm"
              disabled={loading.notifications}
              onClick={handleSaveNotifications}
            >
              {loading.notifications ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <Shield size={16} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700">Security Settings</h3>
        </div>
        <div className="card-body space-y-4">
          {passwordError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {passwordError}
            </div>
          )}
          <Input
            label="Current Password"
            type="password"
            placeholder="••••••••"
            value={passwords.currentPassword}
            onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
          />
          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            value={passwords.newPassword}
            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
          />
          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            value={passwords.confirmPassword}
            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
          />
          <div className="flex justify-end pt-2">
            <Button
              size="sm"
              disabled={loading.password}
              onClick={handleUpdatePassword}
            >
              {loading.password ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <Eye size={16} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700">Account Settings</h3>
        </div>
        <div className="card-body space-y-4">
          {/* 2FA */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-slate-700">Two-Factor Authentication</p>
              <p className="text-xs text-slate-500">
                {is2faEnabled ? 'Two-factor authentication is currently enabled.' : 'Add an extra layer of security to your account'}
              </p>
            </div>
            <Button
              variant={is2faEnabled ? 'secondary' : 'outline'}
              size="sm"
              disabled={loading.twoFA}
              onClick={handleToggle2FA}
            >
              {loading.twoFA ? 'Processing...' : is2faEnabled ? 'Enabled (Disable)' : 'Enable'}
            </Button>
          </div>

          {/* Session Management */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-slate-700">Session Management</p>
              <p className="text-xs text-slate-500">Manage active sessions across devices</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewSessions}
            >
              View Sessions
            </Button>
          </div>

          {/* Data Export */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-slate-700">Data Export</p>
              <p className="text-xs text-slate-500">Download your account data</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={loading.export}
              onClick={handleExportData}
            >
              {loading.export ? 'Preparing...' : 'Export'}
            </Button>
          </div>
        </div>
      </div>

      {/* Session Management Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Active Sessions</h3>
                <p className="text-xs text-slate-500">Manage devices currently logged into your account</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSessionModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              {loading.sessions ? (
                <div className="text-center py-8 text-sm text-slate-500 flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-navy-600 border-t-transparent rounded-full animate-spin" />
                  Loading active sessions...
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-center py-6 text-sm text-slate-500">No active sessions found.</p>
              ) : (
                sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex items-start justify-between gap-3"
                  >
                    <div className="flex gap-3">
                      <div className="p-2 rounded-lg bg-navy-50 text-navy-600 mt-0.5">
                        {sess.device.toLowerCase().includes('mobile') || sess.os.toLowerCase().includes('ios') ? (
                          <Smartphone size={18} />
                        ) : (
                          <Laptop size={18} />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-800">{sess.device}</p>
                          {sess.isCurrent && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                              Current Session
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {sess.browser} · {sess.os}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {sess.location} ({sess.ip})
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(sess.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!sess.isCurrent && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loading.revokeId === sess.id}
                        onClick={() => handleRevokeSession(sess.id)}
                      >
                        {loading.revokeId === sess.id ? 'Revoking...' : 'Revoke'}
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => setShowSessionModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
