import { NavLink, useNavigate } from "react-router-dom";
import {
  Gauge,
  Users,
  Car,
  ClipboardText,
  ChartBar,
  UserCircleCheck,
  SignOut,
  SteeringWheel,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { SYSTEM_NAME } from "@/lib/constants";

// Every protected page is listed here, each with its own Phosphor icon.
const LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: Gauge },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/vehicles", label: "Vehicles", icon: Car },
  { to: "/reservations", label: "Reservations", icon: ClipboardText },
  { to: "/reports", label: "Reports", icon: ChartBar },
];

// Admin-only link, appended to the nav when the current user is an admin.
const ADMIN_LINK = { to: "/users", label: "Users", icon: UserCircleCheck };

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = user?.Role === "admin" ? [...LINKS, ADMIN_LINK] : LINKS;

  async function handleLogout() {
    try {
      await logout();
      toast.success("Logged out");
      navigate("/login");
    } catch {
      toast.error("Could not log out");
    }
  }

  return (
    <header className="no-print sticky top-0 z-40 border-b bg-card shadow-accent">
      <div className="@container mx-auto max-w-7xl px-4">
        <div className="flex flex-col gap-2 py-2 @lg:flex-row @lg:items-center @lg:justify-between">
          <div className="flex items-center gap-2">
            <SteeringWheel size={24} weight="fill" className="text-primary" />
            <span className="font-bold tracking-tight">{SYSTEM_NAME}</span>
          </div>

          <nav className="flex items-center gap-1 overflow-x-auto">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted",
                      isActive && "bg-primary text-primary-foreground hover:bg-primary"
                    )
                  }
                >
                  <Icon size={18} />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground @lg:inline">
              {user?.UserName}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
            >
              <SignOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
