import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar } from './ui/Avatar';
import { UserProfile } from '../services/userProfileService';

interface SidebarHeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  profile: UserProfile;
  onProfileClick: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  collapsed,
  onToggleCollapse,
  profile,
  onProfileClick
}) => {
  return (
    <div className="flex flex-col border-b border-white/5 bg-transparent shrink-0 transition-all duration-300 relative">
      
      {/* Collapse Button (Floating when collapsed) */}
      {collapsed && (
        <button 
          onClick={onToggleCollapse}
          className="hidden md:flex absolute left-[68px] top-1/2 -translate-y-1/2 glass-lg border border-white/12 shadow-xl z-50 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-all duration-200 hover:scale-110"
          title="Expandir menu"
        >
          <ChevronRight size={14} />
        </button>
      )}

      {/* Brand + Profile row */}
      <div className="px-3 py-3.5 flex items-center justify-between gap-2">

        {/* Profile button */}
        <button
          onClick={onProfileClick}
          className={`
            flex items-center gap-3 p-2 rounded-xl transition-all duration-200 group min-w-0
            hover:bg-white/6 hover:shadow-sm ring-1 ring-transparent hover:ring-white/8
            ${collapsed ? 'justify-center w-full' : 'flex-1'}
          `}
          title={collapsed ? profile.displayName : 'Configurações de Perfil'}
        >
          {/* Avatar with online indicator */}
          <div className="relative shrink-0">
            <Avatar 
              src={profile.avatarDataUrl} 
              name={profile.displayName} 
              size={collapsed ? 'sm' : 'md'} 
              className="ring-2 ring-white/10 group-hover:ring-[rgb(var(--c-primary-500)/0.4)] transition-all duration-200"
            />
            <div className="absolute -bottom-0.5 -right-0.5 bg-[rgb(var(--c-bg-900))] rounded-full p-[2px]">
              <div className="bg-emerald-500 w-2 h-2 rounded-full shadow-sm shadow-emerald-500/60" />
            </div>
          </div>

          {/* Name + subtitle */}
          <div className={`flex flex-col items-start overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>
            <span className="text-sm font-semibold text-slate-200 truncate w-full text-left group-hover:text-white transition-colors leading-tight">
              {profile.displayName}
            </span>
            <span className="text-[10px] text-slate-500 group-hover:text-[rgb(var(--c-primary-400))] transition-colors font-medium tracking-wide">
              Configurações
            </span>
          </div>
        </button>

        {/* Collapse button (inline when expanded) */}
        {!collapsed && (
          <button 
            onClick={onToggleCollapse}
            className="hidden md:flex p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/8 transition-all duration-200 shrink-0 hover:scale-105"
            title="Recolher menu"
          >
            <ChevronLeft size={15} />
          </button>
        )}
      </div>

    </div>
  );
};
