import { Calendar, Inbox, Scissors, Users, X } from 'lucide-react';
import type { AdminView, Barber } from '../types/barbershop';
import { Avatar } from './Avatar';

interface SidebarProps {
  activeView: AdminView;
  onSelectView: (view: AdminView) => void;
  pendingCount: number;
  todayConfirmedCount: number;
  activeBarber: Barber;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: Array<{
  id: AdminView;
  label: string;
  icon: typeof Inbox;
}> = [
  { id: 'requests', label: 'Solicitudes', icon: Inbox },
  { id: 'schedule', label: 'Agenda del día', icon: Calendar },
  { id: 'clients', label: 'Clientes e historial', icon: Users },
  { id: 'services', label: 'Servicios', icon: Scissors },
];

export function Sidebar({
  activeView,
  onSelectView,
  pendingCount,
  todayConfirmedCount,
  activeBarber,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const handleNavClick = (view: AdminView) => {
    onSelectView(view);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex h-full flex-col bg-white border-r border-zinc-200">
      <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-200">
        <span className="font-display text-base font-bold tracking-tight text-zinc-950 whitespace-nowrap shrink-0">
          Oficio Barbería
        </span>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Cerrar navegación"
          className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav aria-label="Navegación principal" className="flex-1 px-3 py-5 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          const counter =
            item.id === 'requests'
              ? pendingCount
              : item.id === 'schedule'
                ? todayConfirmedCount
                : null;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 ${
                isActive
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80'
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-zinc-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </span>

              {counter !== null && counter > 0 && (
                <span
                  className={`font-mono text-xs tabular-nums shrink-0 ${
                    isActive
                      ? 'text-zinc-300'
                      : item.id === 'requests'
                        ? 'text-amber-700 font-semibold'
                        : 'text-zinc-500'
                  }`}
                >
                  {counter}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-zinc-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar name={activeBarber.name} src={activeBarber.avatarUrl} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900 truncate">
              {activeBarber.name}
            </p>
            <p className="text-xs text-zinc-500 truncate">{activeBarber.role}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside className="hidden lg:block lg:w-64 lg:shrink-0">{navContent}</aside>

      {/* Mobile slide-over sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-zinc-950/35 transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-50 w-72 max-w-[85vw] h-full shadow-xl">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
