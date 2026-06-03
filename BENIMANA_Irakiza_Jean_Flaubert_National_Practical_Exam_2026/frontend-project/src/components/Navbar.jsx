// Top navigation bar shown on every logged-in page (links, user name, logout, mobile menu).
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { List, X, SignOut, Package, Warehouse as WarehouseIcon, ArrowsLeftRight, ChartBar, SquaresFour, Cube } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { ROUTES, SYSTEM_NAME } from '@/lib/constants';
import { getUserLabel } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const LINKS = [
  { to: ROUTES.dashboard, label: 'Dashboard', icon: SquaresFour },
  { to: ROUTES.products, label: 'Products', icon: Package },
  { to: ROUTES.warehouses, label: 'Warehouses', icon: WarehouseIcon },
  { to: ROUTES.transactions, label: 'Transactions', icon: ArrowsLeftRight },
  { to: ROUTES.reports, label: 'Reports', icon: ChartBar },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await logout();
    toast('You have been logged out');
    navigate(ROUTES.landing);
  }

  const linkClass = ({ isActive }) =>
    cn(
      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]'
        : 'text-[var(--color-text)] hover:bg-[var(--color-bg)]'
    );

  return (
    <header className="no-print sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)] shadow-accent">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 font-semibold text-[var(--color-accent)]">
          <Cube size={22} weight="fill" />
          <span>{SYSTEM_NAME}</span>
        </div>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--color-text)]">{getUserLabel(user)}</span>
            {user?.isAdmin && <Badge>Admin</Badge>}
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <SignOut size={16} />
            Logout
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X size={24} /> : <List size={24} />}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div className="border-t border-[var(--color-border)] px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={linkClass} onClick={() => setOpen(false)}>
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[var(--color-border)] pt-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">{getUserLabel(user)}</span>
              {user?.isAdmin && <Badge>Admin</Badge>}
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <SignOut size={16} />
              Logout
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
