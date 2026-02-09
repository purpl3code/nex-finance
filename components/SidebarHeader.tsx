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
    <div className="flex flex-col border-b border-slate-800/60 bg-slate-900 shrink-0 transition-all duration-300">
      
      {/* SECTION 1: APP IDENTITY */}
      <div className={`flex items-center h-16 px-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Logo Icon */}
          <div className="h-8 w-8 min-w-[32px] bg-gradient-to-tr from-blue-600 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/10">
            <span className="font-bold text-white text-lg leading-none mt-0.5">N</span>
          </div>
          
          {/* App Name */}
          <div className={`transition-all duration-300 ${collapsed ? 'w-0 opacity-0 translate-x-[-10px]' : 'w-auto opacity-100 translate-x-0'}`}>
            <span className="font-bold text-lg text-slate-100 tracking-tight whitespace-nowrap">
              Nex Finance
            </span>
          </div>
        </div>

        {/* Collapse Button (Only visible when expanded for desktop, handled by sidebar container for mobile) */}
        <button 
          onClick={onToggleCollapse}
          className={`
            hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors
            ${collapsed ? 'absolute left-[72px] top-6 bg-slate-900 border border-slate-700 shadow-xl z-50 translate-x-2' : ''}
          `}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* SECTION 2: USER PROFILE */}
      <div className="px-3 pb-3 pt-1">
        <button
          onClick={onProfileClick}
          className={`
            w-full flex items-center gap-3 p-2 rounded-xl transition-all duration-200 group
            hover:bg-slate-800/80 hover:shadow-sm ring-1 ring-transparent hover:ring-slate-700/50
            ${collapsed ? 'justify-center' : ''}
          `}
          title="Configurações de Perfil"
        >
          <div className="relative">
            <Avatar 
              src={profile.avatarDataUrl} 
              name={profile.displayName} 
              size={collapsed ? "sm" : "md"} 
              className="ring-2 ring-slate-900 group-hover:ring-slate-700 transition-all"
            />
            <div className="absolute -bottom-0.5 -right-0.5 bg-slate-900 rounded-full p-0.5">
               <div className="bg-emerald-500 w-2 h-2 rounded-full border border-slate-900"></div>
            </div>
          </div>

          <div className={`flex flex-col items-start overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>
            <span className="text-sm font-semibold text-slate-200 truncate w-full text-left group-hover:text-blue-400 transition-colors">
              {profile.displayName}
            </span>
            <div className="flex items-center gap-1 text-xs text-slate-500 truncate w-full">
               <Settings size={10} />
               <span>Configurações</span>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
