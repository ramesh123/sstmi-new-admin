"use client";
import { useEffect, useState } from "react";

// Helper function to make authenticated API calls
const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    // This tells the browser to send your existing id_token cookie automatically
    credentials: 'include', 
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // If we get a 401, the cookie might have expired
    window.location.href = '/login'; // Or your hosted UI link
    throw new Error('Session expired. Redirecting to login...');
  }

  return response;
};

interface CognitoUser {
  Username: string;
  Email: string;
  Name: string;
  Enabled: boolean;
  UserStatus: string;
  UserCreateDate: string;
  Groups: string[];
}

interface CombinedUser {
  Email: string;
  Usernames: string[];
  HasGoogleSSO: boolean;
  HasDirectLogin: boolean;
  Enabled: boolean;
  Groups: string[];
  UserCreateDate: string;
  PrimaryUsername: string;
}

interface SortConfig {
  key: 'Email' | 'Groups' | 'UserCreateDate' | null;
  direction: 'asc' | 'desc';
}

const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        backgroundColor: type === 'success' ? '#10b981' : '#ef4444',
        color: 'white',
        fontWeight: '500',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 9999,
        animation: 'slideIn 0.3s ease-out',
        minWidth: '300px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{message}</span>
        <button
          onClick={onClose}
          style={{
            marginLeft: '1rem',
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0',
            lineHeight: '1'
          }}
        >
          ×
        </button>
      </div>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

const AddUserModal = ({ onClose, onAdd }: { onClose: () => void; onAdd: () => void }) => {
  const [formData, setFormData] = useState({
    email: '',
    tempPassword: '',
    group: 'VOLUNTEER',
    isPermanent: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.tempPassword.trim()) {
      newErrors.tempPassword = 'Password is required';
    } else if (formData.tempPassword.length < 8) {
      newErrors.tempPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.tempPassword)) {
      newErrors.tempPassword = 'Password must contain uppercase, lowercase, and number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await makeAuthenticatedRequest(
        "/admin/create-user",  // CloudFront path
        {
          method: "POST",
          body: JSON.stringify({
            email: formData.email,
            name: formData.email.split('@')[0],
            tempPassword: formData.tempPassword,
            group: formData.group,
            isPermanent: formData.isPermanent
          }),
        }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        onAdd();
        onClose();
      } else {
        setErrors({ submit: data.message || 'Failed to add user' });
      }
    } catch (error) {
      console.error('Error adding user:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to add user. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-800">Add New User</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter email address"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.tempPassword}
                  onChange={(e) => setFormData({ ...formData, tempPassword: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition pr-10 ${
                    errors.tempPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Min. 8 chars with upper, lower, number"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.tempPassword && <p className="text-red-500 text-xs mt-1">{errors.tempPassword}</p>}
              
              <div className="mt-3 flex items-center">
                <input
                  type="checkbox"
                  id="isPermanent"
                  checked={formData.isPermanent}
                  onChange={(e) => setFormData({ ...formData, isPermanent: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="isPermanent" className="ml-2 text-sm text-gray-700">
                  Set as permanent password (user won't be forced to change)
                </label>
              </div>
              
              {!formData.isPermanent && (
                <p className="text-xs text-gray-500 mt-1">User will be asked to change password on first login</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Group <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.group}
                onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              >
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="RECEPTIONIST_ADMIN">Receptionist Admin</option>
                <option value="VOLUNTEER">Volunteer</option>
                <option value="GUEST">Guest</option>
              </select>
            </div>

            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{errors.submit}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Creating User...
                </>
              ) : (
                'Create User'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ManageUsersPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<CognitoUser[]>([]);
  const [combinedUsers, setCombinedUsers] = useState<CombinedUser[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'Groups', direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  const getGroupPriority = (groups: string[]): number => {
    const roleGroup = groups.find(g => ['SUPER_ADMIN', 'RECEPTIONIST_ADMIN', 'VOLUNTEER', 'GUEST'].includes(g));
    switch(roleGroup) {
      case 'SUPER_ADMIN': return 1;
      case 'RECEPTIONIST_ADMIN': return 2;
      case 'VOLUNTEER': return 3;
      case 'GUEST': return 4;
      default: return 5;
    }
  };

  const combineUsers = (cognitoUsers: CognitoUser[]): CombinedUser[] => {
    const userMap = new Map<string, CombinedUser>();

    cognitoUsers.forEach(user => {
      const email = user.Email.toLowerCase();
      const isGoogleUser = user.Username.startsWith('google_');

      if (userMap.has(email)) {
        const existing = userMap.get(email)!;
        existing.Usernames.push(user.Username);
        if (isGoogleUser) {
          existing.HasGoogleSSO = true;
        } else {
          existing.HasDirectLogin = true;
          existing.PrimaryUsername = user.Username;
        }
        user.Groups.forEach(g => {
          if (!existing.Groups.includes(g) && !g.includes('Google')) {
            existing.Groups.push(g);
          }
        });
        if (new Date(user.UserCreateDate) < new Date(existing.UserCreateDate)) {
          existing.UserCreateDate = user.UserCreateDate;
        }
      } else {
        userMap.set(email, {
          Email: user.Email,
          Usernames: [user.Username],
          HasGoogleSSO: isGoogleUser,
          HasDirectLogin: !isGoogleUser,
          Enabled: user.Enabled,
          Groups: user.Groups.filter(g => !g.includes('Google')),
          UserCreateDate: user.UserCreateDate,
          PrimaryUsername: user.Username
        });
      }
    });

    return Array.from(userMap.values());
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  const sortData = (data: CombinedUser[]): CombinedUser[] => {
    return [...data].sort((a, b) => {
      if (sortConfig.key === 'Groups') {
        const aPriority = getGroupPriority(a.Groups);
        const bPriority = getGroupPriority(b.Groups);
        return sortConfig.direction === 'asc' ? aPriority - bPriority : bPriority - aPriority;
      }
      
      if (sortConfig.key === 'Email') {
        const comparison = a.Email.localeCompare(b.Email);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }
      
      if (sortConfig.key === 'UserCreateDate') {
        const aDate = new Date(a.UserCreateDate).getTime();
        const bDate = new Date(b.UserCreateDate).getTime();
        return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
      }
      
      return 0;
    });
  };

  const filterData = (data: CombinedUser[]): CombinedUser[] => {
    if (!searchTerm) return data;
    
    return data.filter(item =>
      item.Email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.Groups.some(g => g.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const handleSort = (key: 'Email' | 'Groups' | 'UserCreateDate'): void => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const filteredData = filterData(combinedUsers);
  const sortedData = sortData(filteredData);
  
  const activeUsers = sortedData.filter(u => u.Enabled);
  const inactiveUsers = sortedData.filter(u => !u.Enabled);

  const getSortIcon = (key: 'Email' | 'Groups' | 'UserCreateDate') => {
    if (sortConfig.key !== key) {
      return <span className="text-gray-400">⇅</span>;
    }
    return sortConfig.direction === 'asc' ? <span>↑</span> : <span>↓</span>;
  };

  const getUsersList = async () => {
    setIsLoading(true);
    try {
      const response = await makeAuthenticatedRequest(
        "/admin/list-users",  // Now goes through CloudFront
        { method: "GET" }
      );
      const data = await response.json();
      setUsers(data.users || []);
      setCombinedUsers(combineUsers(data.users || []));
    } catch (error) {
      console.error('Error loading users:', error);
      setToast({ 
        message: error instanceof Error ? error.message : "Failed to load users", 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGroupChange = async (user: CombinedUser, newGroup: string) => {
    setUpdatingUser(user.Email);
    try {
      const response = await makeAuthenticatedRequest(
        "/admin/update-user",  // CloudFront path
        {
          method: "POST",
          body: JSON.stringify({
            username: user.PrimaryUsername,
            name: user.Email.split('@')[0],
            email: user.Email,
            enabled: user.Enabled,
            groups: [newGroup]
          }),
        }
      );
      
      if (response.ok) {
        setToast({ message: 'Group updated successfully!', type: 'success' });
        await getUsersList();
      } else {
        const data = await response.json();
        setToast({ message: data.message || 'Failed to update group', type: 'error' });
      }
    } catch (error) {
      setToast({ 
        message: error instanceof Error ? error.message : "Failed to update group", 
        type: 'error' 
      });
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleToggleStatus = async (user: CombinedUser) => {
    try {
      const response = await makeAuthenticatedRequest(
        "/admin/toggle-user-status",  // CloudFront path
        {
          method: "POST",
          body: JSON.stringify({
            username: user.PrimaryUsername,
            enabled: !user.Enabled
          })
        }
      );
      
      if (response.ok) {
        setToast({ message: 'User status updated successfully!', type: 'success' });
        getUsersList();
      }
    } catch (error) {
      setToast({ 
        message: error instanceof Error ? error.message : "Failed to update user status", 
        type: 'error' 
      });
    }
  };

  const handleResetPassword = async (user: CombinedUser) => {
    if (!confirm(`Reset password for ${user.Email}? They will receive an email with instructions.`)) {
      return;
    }

    try {
      const response = await makeAuthenticatedRequest(
        "/admin/reset-password",  // CloudFront path
        {
          method: "POST",
          body: JSON.stringify({ username: user.PrimaryUsername })
        }
      );
      
      if (response.ok) {
        setToast({ message: 'Password reset email sent!', type: 'success' });
      }
    } catch (error) {
      setToast({ 
        message: error instanceof Error ? error.message : "Failed to reset password", 
        type: 'error' 
      });
    }
  };

  const handleAddSuccess = () => {
    setToast({ message: 'User created successfully!', type: 'success' });
    getUsersList();
  };

  const getDisplayGroup = (groups: string[]) => {
    const roleGroup = groups.find(g => ['SUPER_ADMIN', 'RECEPTIONIST_ADMIN', 'VOLUNTEER', 'GUEST'].includes(g));
    return roleGroup || 'GUEST';
  };

  const getGroupBadgeColor = (group: string) => {
    switch(group) {
      case 'SUPER_ADMIN': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'RECEPTIONIST_ADMIN': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'VOLUNTEER': return 'bg-green-100 text-green-800 border-green-200';
      case 'GUEST': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  useEffect(() => {
    getUsersList();
  }, []);

  const UserRow = ({ user }: { user: CombinedUser }) => {
    const displayGroup = getDisplayGroup(user.Groups);
    const isUpdating = updatingUser === user.Email;
    
    return (
      <tr className="hover:bg-blue-50 transition">
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          {user.Email}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
          {user.HasGoogleSSO ? (
            <span className="inline-flex items-center text-green-600" title="Google SSO Enabled">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm">
          <select
            value={displayGroup}
            onChange={(e) => handleGroupChange(user, e.target.value)}
            disabled={isUpdating}
            className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer transition-colors focus:ring-2 focus:ring-blue-500 outline-none ${
              getGroupBadgeColor(displayGroup)
            } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
          >
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="RECEPTIONIST_ADMIN">Receptionist</option>
            <option value="VOLUNTEER">Volunteer</option>
            <option value="GUEST">Guest</option>
          </select>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
          {formatDate(user.UserCreateDate)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={user.Enabled}
              onChange={() => handleToggleStatus(user)}
              className="sr-only peer"
            />
            <div
              className={`w-11 h-6 rounded-full peer 
                peer-focus:ring-4 peer-focus:ring-blue-300 
                peer-checked:after:translate-x-full 
                after:content-[''] after:absolute after:top-0.5 after:left-0.5 
                after:bg-white after:border after:rounded-full 
                after:h-5 after:w-5 after:transition-all 
                ${user.Enabled ? 'bg-green-600' : 'bg-red-600'}`}
            />
          </label>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm">
          {user.HasDirectLogin && (
            <button
              onClick={() => handleResetPassword(user)}
              className="text-amber-600 hover:text-amber-800 font-medium transition"
            >
              Reset Password
            </button>
          )}
        </td>
      </tr>
    );
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {showAddUserModal && (
        <AddUserModal
          onClose={() => setShowAddUserModal(false)}
          onAdd={handleAddSuccess}
        />
      )}

      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Manage SSTMI POS Users</h2>
                </div>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-medium shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add New User
                </button>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearchTerm(e.target.value);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('Email')}
                        className="flex items-center gap-2 hover:text-blue-600 transition"
                      >
                        Email {getSortIcon('Email')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Google SSO
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('Groups')}
                        className="flex items-center gap-2 hover:text-blue-600 transition"
                      >
                        Group {getSortIcon('Groups')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('UserCreateDate')}
                        className="flex items-center gap-2 hover:text-blue-600 transition"
                      >
                        Created {getSortIcon('UserCreateDate')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : (
                    <>
                      {activeUsers.length > 0 ? (
                        activeUsers.map((user, index) => (
                          <UserRow key={`active-${user.Email}-${index}`} user={user} />
                        ))
                      ) : null}
                      
                      {inactiveUsers.length > 0 && activeUsers.length > 0 && (
                        <tr>
                          <td colSpan={6} className="bg-gray-50 px-6 py-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 border-t border-gray-300"></div>
                              <span className="text-sm font-medium text-gray-500">Inactive Users</span>
                              <div className="flex-1 border-t border-gray-300"></div>
                            </div>
                          </td>
                        </tr>
                      )}
                      
                      {inactiveUsers.map((user, index) => (
                        <UserRow key={`inactive-${user.Email}-${index}`} user={user} />
                      ))}
                      
                      {activeUsers.length === 0 && inactiveUsers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                            No users found or access denied - Requires SUPER_ADMIN rights
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Total: {sortedData.length} users ({activeUsers.length} active, {inactiveUsers.length} inactive)
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManageUsersPage;