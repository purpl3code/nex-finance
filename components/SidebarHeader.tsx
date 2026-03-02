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
    <div className="flex flex-col border-b border-white/5 bg-transparent shrink-0 transition-all duration-300">
      
      {/* SECTION 1: APP IDENTITY */}
      <div className={`flex items-center h-20 px-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Logo Icon */}
          <div className="h-10 w-10 min-w-[40px] bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="font-bold text-white text-xl leading-none mt-0.5">N</span>
          </div>
          
          {/* App Name */}
          <div className={`transition-all duration-300 ${collapsed ? 'w-0 opacity-0 translate-x-[-10px]' : 'w-auto opacity-100 translate-x-0'}`}>
            <span className="font-bold text-lg text-white tracking-tight whitespace-nowrap">
              Nex Finance
            </span>
          </div>
        </div>

        {/* Collapse Button (Only visible when expanded for desktop, handled by sidebar container for mobile) */}
        <button 
          onClick={onToggleCollapse}
          className={`
            hidden md:flex p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors
            ${collapsed ? 'absolute left-[72px] top-6 glass-lg border border-white/10 shadow-xl z-50 translate-x-4' : ''}
          `}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* SECTION 2: USER PROFILE */}
      <div className="px-3 pb-4 pt-1">
        <button
          onClick={onProfileClick}
          className={`
            w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 group
            hover:bg-white/5 hover:shadow-sm ring-1 ring-transparent hover:ring-white/10
            ${collapsed ? 'justify-center' : ''}
          `}
          title="Configurações de Perfil"
        >
          <div className="relative">
            <Avatar 
              src={profile.avatarDataUrl} 
              name={profile.displayName} 
              size={collapsed ? "sm" : "md"} 
              className="ring-2 ring-white/10 group-hover:ring-white/20 transition-all"
            />
            <div className="absolute -bottom-0.5 -right-0.5 bg-slate-900 rounded-full p-0.5">
               <div className="bg-emerald-500 w-2.5 h-2.5 rounded-full border-2 border-slate-900 shadow-sm shadow-emerald-500/50"></div>
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
      </div>
    </div>
  );
};

