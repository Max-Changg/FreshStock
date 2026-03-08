import { NavLink } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { DateSimulator } from '@/features/inventory/components/DateSimulator';

const NAV_LINKS = [
  { to: '/', label: 'Inventory' },
  { to: '/insights', label: 'Insights' },
  { to: '/suppliers', label: 'Suppliers' },
  { to: '/planning', label: 'Planning' },
];

export function NavBar() {
  return (
    <nav className="h-14 bg-white border-b border-forest/10 shadow-sm flex items-center px-6 fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-6">
        <div className="flex items-center gap-2 shrink-0">
          <Leaf className="h-5 w-5 text-forest" aria-hidden />
          <span className="text-lg font-semibold text-forest tracking-tight">FreshStock</span>
        </div>

        <div className="flex items-center gap-1">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                [
                  'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-forest text-cream'
                    : 'text-forest/60 hover:text-forest hover:bg-forest/10',
                ].join(' ')
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        <div className="ml-auto">
          <DateSimulator />
        </div>
      </div>
    </nav>
  );
}
