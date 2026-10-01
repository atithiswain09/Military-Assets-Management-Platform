import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Shield, Calendar } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { getInitials } from '../../utils/helpers';

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSave = () => {
    setToast('Profile updated successfully');
    setIsEditing(false);
    setTimeout(() => setToast(null), 3000);
  };

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {toast && <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg animate-slide-in text-sm font-medium">{toast}</div>}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Profile</h2>
          <p className="text-sm text-slate-500">Your personal and role information</p>
        </div>
        <Button
          variant={isEditing ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
        >
          {isEditing ? 'Save Changes' : 'Edit Profile'}
        </Button>
      </div>

      {/* Profile header card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-navy-700 text-white flex items-center justify-center text-2xl font-bold shrink-0">
            {getInitials(user.name)}
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-semibold text-slate-900">{user.name}</h3>
            <p className="text-sm text-slate-500">{user.rank}</p>
            <div className="flex items-center gap-4 mt-2 justify-center sm:justify-start">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-navy-700 bg-navy-50 px-2.5 py-1 rounded-full border border-navy-200">
                <Shield size={11} /> {user.role}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <MapPin size={11} /> {user.base}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile details */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-slate-700">Personal Information</h3>
        </div>
        <div className="card-body space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              icon={User}
              defaultValue={user.name}
              disabled={!isEditing}
            />
            <Input
              label="Email"
              icon={Mail}
              type="email"
              defaultValue={user.email}
              disabled={!isEditing}
            />
            <Input
              label="Phone"
              icon={Phone}
              defaultValue={user.phone}
              disabled={!isEditing}
            />
            <Input
              label="Base"
              icon={MapPin}
              defaultValue={user.base}
              disabled
            />
          </div>
        </div>
      </div>

      {/* Role Information */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-slate-700">Role & Access Information</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <Shield size={16} className="text-slate-400 mt-1" />
              <div>
                <p className="text-xs text-slate-500">Role</p>
                <p className="text-sm font-medium text-slate-800">{user.role}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={16} className="text-slate-400 mt-1" />
              <div>
                <p className="text-xs text-slate-500">Assigned Base</p>
                <p className="text-sm font-medium text-slate-800">{user.base}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar size={16} className="text-slate-400 mt-1" />
              <div>
                <p className="text-xs text-slate-500">User ID</p>
                <p className="text-sm font-medium text-slate-800 font-mono">{user.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
