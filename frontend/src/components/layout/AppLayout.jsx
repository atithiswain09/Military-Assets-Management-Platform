import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { cn } from '../../utils/helpers';

const routeTitles = {
  '/dashboard': 'Dashboard',
  '/assets': 'Asset Management',
  '/purchases': 'Purchases',
  '/transfers': 'Transfers',
  '/assignments': 'Assignments',
  '/expenses': 'Expenditures',
  '/transactions': 'Audit Trail',
  '/users': 'Users & Roles',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/settings/profile': 'Profile',
};

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const pageTitle = routeTitles[location.pathname] || 'AssetFlow';

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content area */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64'
        )}
      >
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          pageTitle={pageTitle}
        />

        <main className="p-4 sm:p-6 max-w-[1600px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
