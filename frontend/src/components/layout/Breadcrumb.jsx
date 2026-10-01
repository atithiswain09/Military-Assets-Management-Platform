import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeLabels = {
  dashboard: 'Dashboard',
  assets: 'Assets',
  purchases: 'Purchases',
  transfers: 'Transfers',
  assignments: 'Assignments',
  expenses: 'Expenditures',
  transactions: 'Transactions',
  users: 'Users & Roles',
  reports: 'Reports',
  settings: 'Settings',
  profile: 'Profile',
  details: 'Details',
};

const Breadcrumb = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  if (pathSegments.length === 0) return null;

  const crumbs = pathSegments.map((segment, idx) => {
    const path = '/' + pathSegments.slice(0, idx + 1).join('/');
    const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = idx === pathSegments.length - 1;
    return { path, label, isLast };
  });

  return (
    <nav className="flex items-center gap-1 text-xs text-slate-500">
      <Link to="/dashboard" className="hover:text-slate-700 transition-colors">
        <Home size={12} />
      </Link>
      {crumbs.map((crumb) => (
        <React.Fragment key={crumb.path}>
          <ChevronRight size={12} className="text-slate-300" />
          {crumb.isLast ? (
            <span className="text-slate-700 font-medium">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="hover:text-slate-700 transition-colors">
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
