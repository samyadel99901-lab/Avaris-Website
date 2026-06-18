import { LayoutGrid, ListChecks, Clock, BarChart3, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/invoices', label: 'Invoices', icon: ListChecks },
  { to: '/history', label: 'History', icon: Clock },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-navy-800 border-r border-purple-accent/10 flex flex-col">
      <div className="p-5 border-b border-purple-accent/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-purple-accent to-purple-glow flex items-center justify-center text-white text-sm font-medium">
            A
          </div>
          <div>
            <p className="text-sm font-medium text-gray-100 leading-tight">Avaris</p>
            <p className="text-[10px] text-gray-500">Automation System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-purple-accent/15 border border-purple-accent/30 text-purple-300'
                  : 'text-gray-400 hover:bg-purple-accent/5 border border-transparent'
              }`
            }
          >
            <Icon size={14} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3">
        <div className="bg-purple-accent/5 border border-purple-accent/15 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-accent to-pink-500 flex items-center justify-center text-white text-xs font-medium">
              SA
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-200 truncate">Samy Adel</p>
              <p className="text-[10px] text-gray-500 truncate">samy@avaris.com</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}