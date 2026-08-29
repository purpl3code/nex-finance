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
    <div className="flex flex-col border-b border-white/6 bg-transparent shrink-0 transition-all duration-300 relative">
      
      {/* Floating collapse button when collapsed */}
      {collapsed && (
        <button 
          onClick={onToggleCollapse}
          className="hidden md:flex absolute left-[68px] top-1/2 -translate-y-1/2 glass-lg border border-white/15 shadow-xl z-50 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200 hover:scale-110 active:scale-95"
          title="Expandir menu"
        >
          <ChevronRight size={14} />
        </button>
      )}

      {/* Profile button */}
      <div className="px-3 py-3">
        <button
          onClick={onProfileClick}
          className={`
            flex items-center gap-3 w-full p-2.5 rounded-2xl transition-all duration-200 group
            hover:bg-white/[0.06] active:bg-white/[0.04] ring-1 ring-transparent hover:ring-white/10
            ${collapsed ? 'justify-center p-2' : ''}
          `}
          title={collapsed ? profile.displayName : 'Configurações de Perfil'}
        >
          {/* Avatar with online indicator */}
          <div className="relative shrink-0">
            <Avatar 
              src={profile.avatarDataUrl} 
              name={profile.displayName} 
              size="sm"
              className="ring-2 ring-white/15 group-hover:ring-[rgb(var(--c-primary-500)/0.5)] transition-all duration-200 shadow-md"
            />
            <div className="absolute -bottom-0.5 -right-0.5 bg-[rgb(var(--c-bg-950))] rounded-full p-[2px]">
              <div className="bg-emerald-400 w-2 h-2 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </div>
          </div>

          {/* Name + subtitle */}
          <div className={`flex flex-col items-start overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>
            <span className="text-xs font-bold text-slate-100 truncate w-full text-left group-hover:text-white transition-colors leading-tight">
              {profile.displayName || 'Minha Conta'}
            </span>
            <span className="text-[10px] text-slate-400 group-hover:text-[rgb(var(--c-primary-300))] transition-colors font-medium tracking-wide">
              Preferências & Perfil
            </span>
          </div>

          {/* Collapse button when expanded */}
          {!collapsed && (
            <button 
              onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
              className="hidden md:flex p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/8 transition-all duration-200 shrink-0 ml-auto active:scale-95"
              title="Recolher menu"
            >
              <ChevronLeft size={14} />
            </button>
          )}
        </button>
      </div>
    </div>
  );
};
