import React from 'react';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
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
          className="hidden md:flex absolute left-[72px] top-6 glass-lg border border-white/10 shadow-xl z-50 translate-x-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Expandir menu"
        >
          <ChevronRight size={16} />
        </button>
      )}

      {/* SECTION 2: USER PROFILE */}
      <div className="px-3 py-4 flex items-center justify-between">
        <button
          onClick={onProfileClick}
          className={`
            flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 group
            hover:bg-white/5 hover:shadow-sm ring-1 ring-transparent hover:ring-white/10
            ${collapsed ? 'justify-center w-full' : 'flex-1 min-w-0'}
          `}
          title="Configurações de Perfil"
        >
          <div className="relative shrink-0">
            <Avatar 
              src={profile.avatarDataUrl} 
              name={profile.displayName} 
              size={collapsed ? "sm" : "md"} 
              className="ring-2 ring-white/10 group-hover:ring-white/20 transition-all"
            />
            <div className="absolute -bottom-0.5 -right-0.5 bg-white/10 rounded-full p-0.5">
               <div className="bg-emerald-500 w-2.5 h-2.5 rounded-full border-2 border-black shadow-sm shadow-emerald-500/50"></div>
            </div>
          </div>

          <div className={`flex flex-col items-start overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>
            <span className="text-sm font-semibold text-slate-200 truncate w-full text-left group-hover:text-white transition-colors">
              {profile.displayName}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate w-full group-hover:text-blue-400 transition-colors">
               <Settings size={12} />
               <span>Configurações</span>
            </div>
          </div>
        </button>

        {/* Collapse Button (Inline when expanded) */}
        {!collapsed && (
          <button 
            onClick={onToggleCollapse}
            className="hidden md:flex p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors shrink-0 ml-1"
            title="Recolher menu"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

