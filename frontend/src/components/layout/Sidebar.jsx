import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ArrowLeftRight,
  UserCheck,
  Receipt,
  FileText,
  Users,
  BarChart3,
  Settings,
  Shield,
  LogOut,
  X,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { NAV_ITEMS } from '../../utils/constants';
import { cn } from '../../utils/helpers';

const iconMap = {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ArrowLeftRight,
  UserCheck,
  Receipt,
  FileText,
  Users,
  BarChart3,
  Settings,
};

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const { user, logout, canAccessModule } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNavItems = NAV_ITEMS.filter((item) => canAccessModule(item.key));

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-slate-900 text-white flex flex-col transition-all duration-300 ease-in-out',
          'lg:z-30',
          isCollapsed ? 'lg:w-[72px]' : 'lg:w-64',
          isOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center border-b border-slate-700/50 shrink-0',
          isCollapsed ? 'justify-center px-3 py-5' : 'justify-between px-5 py-5'
        )}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-navy-600 rounded-lg flex items-center justify-center shrink-0">
              <Shield size={20} className="text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-base font-bold tracking-tight">AssetFlow</h1>
                <p className="text-2xs text-slate-400 uppercase tracking-widest">Military Assets</p>
              </div>
            )}
          </div>

          {/* Mobile close */}
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = iconMap[item.icon];
            return (
              <NavLink
                key={item.key}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'sidebar-link',
                    isActive ? 'sidebar-link-active' : 'sidebar-link-inactive',
                    isCollapsed && 'justify-center px-2'
                  )
                }
                title={isCollapsed ? item.label : undefined}
              >
                {Icon && <Icon size={18} className="shrink-0" />}
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User section */}
        <div className={cn(
          'border-t border-slate-700/50 shrink-0',
          isCollapsed ? 'p-3' : 'p-4'
        )}>
          {!isCollapsed && (
            <div className="mb-3 px-1">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-2 w-full text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors',
              isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2'
            )}
            title={isCollapsed ? 'Sign Out' : undefined}
          >
            <LogOut size={16} />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center py-3 border-t border-slate-700/50 text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft size={16} className={cn('transition-transform', isCollapsed && 'rotate-180')} />
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
