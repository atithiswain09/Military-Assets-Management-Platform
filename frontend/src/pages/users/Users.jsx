import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Shield, User, Loader2 } from 'lucide-react';
import Table from '../../components/common/Table';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import Input, { Select } from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { fetchUsers } from '../../services/api';
import { userApi } from '../../api/userApi';
import { ROLES, BASES } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatters';
import { searchFilter } from '../../utils/helpers';
import { useAuth } from '../../hooks/useAuth';

const Users = () => {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [formError, setFormError] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'password123',
    employeeId: '',
    role: 'LOGISTICS_OFFICER',
    baseId: '',
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = searchFilter(
    roleFilter ? users.filter((u) => u.role === roleFilter) : users,
    search,
    ['name', 'email', 'role', 'base', 'employeeId']
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      // Find role_id from existing user samples or lookup
      const existingUserWithRole = users.find(u => u.role === formData.role || u.roleId);
      const roleId = existingUserWithRole?.roleId || users[0]?.roleId;

      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        employee_id: formData.employeeId || `EMP-${Date.now().toString().slice(-4)}`,
        role_id: roleId,
        base_id: formData.baseId || null,
        status: 'ACTIVE',
      };

      const res = await userApi.createUser(payload);
      if (res?.success) {
        setShowForm(false);
        setToast('User created successfully!');
        loadUsers();
        setTimeout(() => setToast(null), 3000);
      } else {
        setFormError(res?.message || 'Failed to create user');
      }
    } catch (err) {
      setFormError(err.message || 'Error creating user');
    } finally {
      setFormLoading(false);
    }
  };

  const roleColorMap = {
    Admin: 'bg-violet-50 text-violet-700 border-violet-200',
    'Base Commander': 'bg-blue-50 text-blue-700 border-blue-200',
    'Logistics Officer': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const columns = [
    { key: 'id', label: 'User ID', minWidth: '90px', render: (val) => <span className="font-mono text-xs text-navy-700 font-medium">{val}</span> },
    { key: 'name', label: 'Name', minWidth: '180px', render: (val, row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center text-xs font-semibold shrink-0">
          {val.split(' ').map((n) => n[0]).join('').substring(0, 2)}
        </div>
        <div>
          <p className="font-medium text-slate-900 text-sm">{val}</p>
          <p className="text-xs text-slate-500">{row.email}</p>
        </div>
      </div>
    )},
    { key: 'role', label: 'Role', minWidth: '140px', render: (val) => (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleColorMap[val] || ''}`}>
        <Shield size={10} className="mr-1" />{val}
      </span>
    )},
    { key: 'base', label: 'Assigned Base', minWidth: '130px' },
    { key: 'status', label: 'Status', minWidth: '90px', render: (val) => <StatusBadge status={val} /> },
    { key: 'lastLogin', label: 'Last Login', minWidth: '150px', render: (val) => <span className="text-xs text-slate-600">{formatDateTime(val)}</span> },
    { key: 'actions', label: '', sortable: false, minWidth: '50px', render: (_, row) => (
      hasPermission('users', 'edit') ? (
        <button onClick={(e) => { e.stopPropagation(); setSelectedUser(row); setShowForm(true); }} className="p-1.5 rounded-md text-slate-400 hover:text-navy-600 hover:bg-navy-50 transition-colors">
          <Edit size={15} />
        </button>
      ) : null
    )},
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {toast && <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg animate-slide-in text-sm font-medium">{toast}</div>}

      {/* Role summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Object.values(ROLES).map((role) => {
          const count = users.filter((u) => u.role === role).length;
          return (
            <div key={role} className="card p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setRoleFilter(roleFilter === role ? '' : role)}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  role === 'Admin' ? 'bg-violet-50' : role === 'Base Commander' ? 'bg-blue-50' : 'bg-emerald-50'
                }`}>
                  <Shield size={18} className={role === 'Admin' ? 'text-violet-600' : role === 'Base Commander' ? 'text-blue-600' : 'text-emerald-600'} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{role}</p>
                  <p className="text-xl font-bold text-slate-900">{count}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Users & Roles</h2>
          <p className="text-sm text-slate-500">{filteredUsers.length} users{roleFilter && ` · Filtered: ${roleFilter}`}</p>
        </div>
        {hasPermission('users', 'create') && (
          <Button icon={Plus} onClick={() => { setSelectedUser(null); setShowForm(true); }}>Add User</Button>
        )}
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:bg-white transition-all" />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <Table columns={columns} data={filteredUsers} />
      </div>

      {/* User Form Modal */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setSelectedUser(null); }} title={selectedUser ? 'Edit User' : 'Add New User'} size="md" footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => { setShowForm(false); setSelectedUser(null); }}>Cancel</Button>
          <Button loading={formLoading} onClick={handleSubmit}>{selectedUser ? 'Update User' : 'Create User'}</Button>
        </div>
      }>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            required
            placeholder="e.g., Col. Marcus Webb"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            required
            placeholder="email@assetflow.mil"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            required
            placeholder="password123"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <Input
            label="Employee ID"
            placeholder="e.g., EMP-009"
            value={formData.employeeId}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
          />
          <Select
            label="Role"
            required
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          >
            <option value="ADMIN">Admin</option>
            <option value="BASE_COMMANDER">Base Commander</option>
            <option value="LOGISTICS_OFFICER">Logistics Officer</option>
          </Select>
          <Select
            label="Assigned Base"
            value={formData.baseId}
            onChange={(e) => setFormData({ ...formData, baseId: e.target.value })}
          >
            <option value="">Select base (Optional for Admin)</option>
            {BASES.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
          {formError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {formError}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default Users;
