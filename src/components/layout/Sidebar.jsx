import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  PieChart,
  RefreshCw,
  Search,
  DollarSign,
  ExternalLink
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/referral-sources', icon: Users, label: 'Referral Sources' },
  { to: '/commission-rules', icon: FileText, label: 'Commission Rules' },
  { to: '/payments', icon: CreditCard, label: 'Payments' },
  { to: '/company-splits', icon: PieChart, label: 'Company Splits' },
];

export default function Sidebar({ pendingCommissions = [], onSync, syncing }) {
  return (
    <aside className="w-64 bg-[#1e1e2d] min-h-screen flex flex-col text-gray-300">
      {/* Logo */}
      <div className="p-4 flex items-center gap-2">
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-semibold text-lg">Commission Tracker</span>
      </div>

      {/* Main Nav */}
      <nav className="mt-2 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                isActive
                  ? 'bg-[#2d2d3a] text-white'
                  : 'text-gray-400 hover:bg-[#2d2d3a] hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
            {item.external && <ExternalLink className="w-3 h-3 ml-auto opacity-50" />}
          </NavLink>
        ))}
      </nav>

      {/* Pending Commissions */}
      <div className="mt-6 px-3">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 mb-2">
          Pending Commissions
        </div>
        <div className="px-3 mb-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-[#2d2d3a] border-none rounded-lg py-2 pl-9 pr-3 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="space-y-1 max-h-64 overflow-y-auto">
          {pendingCommissions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              No pending commissions
            </div>
          ) : (
            pendingCommissions.map((commission) => (
              <NavLink
                key={commission.id}
                to={`/commissions/${commission.id}`}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#2d2d3a] group"
              >
                <span className="text-sm text-gray-400 group-hover:text-white truncate">
                  {commission.jobName}
                </span>
                <span className="text-sm text-green-400 font-medium">
                  ${commission.amount?.toLocaleString()}
                </span>
              </NavLink>
            ))
          )}
        </div>
      </div>

      {/* Sync Button */}
      <div className="mt-auto p-3">
        <button
          onClick={onSync}
          disabled={syncing}
          className="flex items-center gap-2 w-full px-3 py-2.5 text-gray-400 hover:text-white hover:bg-[#2d2d3a] rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Syncing...' : 'Sync Jobs'}</span>
        </button>
      </div>
    </aside>
  );
}
