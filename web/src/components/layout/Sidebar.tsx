import React from 'react';
import { useMockData } from '@/store/MockDataContext';
import { Users, Search, Home, User as UserIcon, Medal, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export function Sidebar({ currentPath, onNavigate, onLogout }: SidebarProps) {
  const { currentUser, loading } = useMockData();

  const navItems = [
    { name: 'Дашборд', path: 'dashboard', icon: Home, visibleFor: 'all' },
    { name: 'Поиск Экспертов', path: 'search', icon: Search, visibleFor: 'all' },
    { name: 'Мой профиль', path: 'profile', icon: UserIcon, visibleFor: 'all' },
    { name: 'Лидерборд', path: 'leaderboard', icon: Medal, visibleFor: 'all' },
  ];

  return (
    <div className="w-64 border-r border-border bg-surface flex flex-col h-screen">
      <div className="p-6">
        <h1 className="text-[18px] font-[800] tracking-[2px] uppercase text-accent flex items-center gap-2">
          <Users className="w-5 h-5" /> Naumen
        </h1>
        <p className="text-xs text-text-muted mt-1 tracking-wider uppercase font-semibold">EXPERTISE</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              currentPath === item.path
                ? "bg-surface-light text-accent"
                : "text-text-muted hover:bg-surface-light hover:text-text"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.name}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <img
            src={currentUser?.avatar}
            alt={currentUser?.name}
            className="w-10 h-10 rounded-full border border-border bg-surface"
          />
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-text truncate">{currentUser?.name}</p>
            <p className="text-xs text-text-muted truncate">{currentUser?.title || 'Профиль в процессе заполнения'}</p>
          </div>
        </div>

        <Button variant="outline" className="mt-4 w-full" onClick={onLogout} disabled={loading}>
          <LogOut className="w-4 h-4 mr-2" /> ВЫЙТИ
        </Button>
      </div>
    </div>
  );
}
