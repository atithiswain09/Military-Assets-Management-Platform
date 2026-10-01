import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
  LineChart, Line,
} from 'recharts';

const COLORS = ['#1e3a5f', '#2563eb', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#64748b'];

const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-slate-200 text-sm">
      <p className="font-medium text-slate-700 mb-1">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-slate-600">
          <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
          {entry.name}: {formatter ? formatter(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
};

// Bar chart component
export const AssetBarChart = ({ data, title, dataKey = 'assets', nameKey = 'name', formatter }) => (
  <div className="card p-5">
    <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey={nameKey} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip formatter={formatter} />} />
        <Bar dataKey={dataKey} fill="#273c6b" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

// Pie / Donut chart
export const AssetPieChart = ({ data, title }) => (
  <div className="card p-5">
    <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {data.map((entry, idx) => (
            <Cell key={idx} fill={entry.color || COLORS[idx % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-slate-200 text-sm">
                <p className="font-medium text-slate-700">{payload[0].name}: {payload[0].value}</p>
              </div>
            );
          }}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: '11px', color: '#64748b' }}
        />
      </PieChart>
    </ResponsiveContainer>
  </div>
);

// Area chart
export const TrendAreaChart = ({ data, title, dataKey = 'amount', nameKey = 'month', formatter, color = '#273c6b' }) => (
  <div className="card p-5">
    <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
        <defs>
          <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.15} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey={nameKey} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip formatter={formatter} />} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#gradient-${dataKey})`} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

// Multi-line chart
export const MovementLineChart = ({ data = [], title }) => (
  <div className="card p-5">
    <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data || []} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend verticalAlign="top" align="right" iconType="line" iconSize={12} wrapperStyle={{ fontSize: '11px' }} />
        <Line type="monotone" dataKey="transfers" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="assignments" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default AssetBarChart;
