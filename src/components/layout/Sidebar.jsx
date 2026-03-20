import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  PieChart,
  RefreshCw,
  Search,
  DollarSign,
  Building,
  Filter,
  Briefcase,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/contractors', icon: Building, label: 'Contractors' },
  { to: '/jobs', icon: Briefcase, label: 'Jobs' },
  { to: '/referral-sources', icon: Users, label: 'Referral Sources' },
  { to: '/payments', icon: CreditCard, label: 'Payments' },
  { to: '/company-splits', icon: PieChart, label: 'Company Splits' },
];

export default function Sidebar({
  pendingCommissions = [],
  onSync,
  syncing,
  contractors = [],
  contractorFilter,
  onContractorFilterChange,
}) {
  return (
    <aside className="w-64 bg-[#1e1e2d] min-h-screen flex flex-col text-gray-300">
      {/* Logo */}
      <div className="p-4 flex items-center gap-2">
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-semibold text-lg">Commission Tracker</span>
      </div>

      {/* Contractor Filter */}
      {contractors.length > 0 && (
        <div className="px-3 mb-2">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 mb-2">
            <Filter className="w-3 h-3 inline mr-1" />
            Contractor
          </div>
          <select
            value={contractorFilter}
            onChange={(e) => onContractorFilterChange(e.target.value)}
            className="w-full bg-[#2d2d3a] border-none rounded-lg py-2 px-3 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Contractors</option>
            {contractors.filter(c => c.Active !== false).map((c) => (
              <option key={c.id} value={c.Name}>{c.Name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Main Nav */}
      <nav className="mt-2 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
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
          </NavLink>
        ))}
      </nav>

      {/* Pending Commissions */}
      <div className="mt-6 px-3">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 mb-2">
          Pending Commissions
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
                to="/payments"
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
