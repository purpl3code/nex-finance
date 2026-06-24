import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, List, Wallet, CreditCard, Repeat, 
  TrendingUp, PieChart, Settings, 
  ChevronDown, X, Target, BarChart3, AlertTriangle
} from 'lucide-react';
import { SidebarHeader } from './SidebarHeader';
import { useUserProfile } from '../hooks/useUserProfile';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

type GroupState = Record<string, boolean>;

// Extracted SidebarItem
interface SidebarItemProps {
  item: { id: string; label: string; icon: any };
  activeTab: string;
  collapsed: boolean;
  onNavigate: (id: string) => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ item, activeTab, collapsed, onNavigate }) => {
  const isActive = activeTab === item.id;
  const Icon = item.icon;

  return (
    <button
      onClick={() => onNavigate(item.id)}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden
        ${isActive 
          ? 'sidebar-item-active text-[rgb(var(--c-primary-300))] border border-transparent' 
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-100 border border-transparent hover:border-white/8'}
        ${collapsed ? 'justify-center' : ''}
      `}
      title={collapsed ? item.label : undefined}
    >
      {/* Active left indicator bar */}
      {isActive && (
        <span className="sidebar-active-indicator" />
      )}
      
      {/* Icon */}
      <Icon 
        size={18} 
        className={`
          min-w-[18px] transition-all duration-200 relative z-10
          ${isActive 
            ? 'scale-110' 
            : 'text-slate-400 group-hover:text-slate-100 group-hover:scale-105'}
        `} 
      />
      
      {!collapsed && (
        <span className="text-sm font-medium whitespace-nowrap overflow-hidden animate-in fade-in duration-300 relative z-10">
          {item.label}
        </span>
      )}

      {/* Collapsed Tooltip */}
      {collapsed && (
        <div className="absolute left-full ml-3 px-3 py-2 glass-lg text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-all duration-200 translate-x-2 group-hover:translate-x-0 border border-white/10">
          {item.label}
        </div>
      )}
    </button>
  );
};


// Extracted SidebarGroup
interface SidebarGroupProps {
  group: { id: string; title: string; items: any[] };
  isOpen: boolean;
  collapsed: boolean;
  onToggle: (id: string) => void;
  activeTab: string;
  onNavigate: (id: string) => void;
}

const SidebarGroup: React.FC<SidebarGroupProps> = ({ group, isOpen, collapsed, onToggle, activeTab, onNavigate }) => {
  const hasItems = group.items.length > 0;

  if (!hasItems) return null;

  return (
    <div className="mb-1">
      {!collapsed && (
        <button 
          onClick={() => onToggle(group.id)}
          className="w-full flex items-center justify-between px-3 py-1.5 text-[9px] font-black text-slate-600 hover:text-slate-400 uppercase tracking-[0.15em] transition-colors"
        >
          <span>{group.title}</span>
          <ChevronDown size={11} className={`transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
        </button>
      )}
      
      {/* Separator for collapsed mode */}
      {collapsed && (
        <div className="h-px w-8 mx-auto bg-white/8 my-2" />
      )}

      <div className={`space-y-0.5 overflow-hidden transition-all duration-300 ${!collapsed && !isOpen ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
        {group.items.map((item: any) => (
          <SidebarItem 
            key={item.id} 
            item={item} 
            activeTab={activeTab} 
            collapsed={collapsed} 
            onNavigate={onNavigate} 
          />
        ))}
      </div>
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = React.memo(({ 
  activeTab, 
  setActiveTab, 
  isMobileOpen, 
  setIsMobileOpen 
}) => {
  // --- STATE ---
  const [collapsed, setCollapsed] = useState(false);
  const [groupStates, setGroupStates] = useState<GroupState>({
    principal: true,
    planejamento: true,
    sistema: true
  });

  const { profile } = useUserProfile();

  // --- PERSISTENCE ---
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('nex-finance-sidebar-collapsed');
    if (savedCollapsed) setCollapsed(JSON.parse(savedCollapsed));

    const savedGroups = localStorage.getItem('nex-finance-sidebar-groups');
    if (savedGroups) setGroupStates(JSON.parse(savedGroups));
  }, []);

  const toggleSidebar = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('nex-finance-sidebar-collapsed', JSON.stringify(newState));
  };

  const toggleGroup = (group: string) => {
    const newStates = { ...groupStates, [group]: !groupStates[group] };
    setGroupStates(newStates);
    localStorage.setItem('nex-finance-sidebar-groups', JSON.stringify(newStates));
  };

  const handleNavigation = (tabId: string) => {
    setActiveTab(tabId);
    if (window.innerWidth < 768) {
      setIsMobileOpen(false);
    }
  };

  // --- STRUCTURE ---
  const menuGroups = [
    {
      id: 'principal',
      title: 'Principal',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'reports',   label: 'Relatórios', icon: BarChart3 },
        { id: 'list',      label: 'Extrato',    icon: List },
        { id: 'accounts',  label: 'Contas',     icon: Wallet },
      ]
    },
    {
      id: 'planejamento',
      title: 'Planejamento',
      items: [
        { id: 'cards',     label: 'Cartões',     icon: CreditCard },
        { id: 'goals',     label: 'Metas',       icon: Target },
        { id: 'debts',     label: 'Dívidas',     icon: AlertTriangle },
        { id: 'recurring', label: 'Recorrências', icon: Repeat },
        { id: 'budgets',   label: 'Orçamentos',  icon: PieChart },
        { id: 'forecast',  label: 'Previsão',    icon: TrendingUp },
      ]
    },
    {
      id: 'sistema',
      title: 'Sistema',
      items: [
        { id: 'settings', label: 'Configurações', icon: Settings },
      ]
    }
  ];

  // --- RENDER ---

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={`
        flex flex-col glass-lg h-screen transition-all duration-300 border-r border-white/5
        ${collapsed ? 'w-[76px]' : 'w-[272px]'}
        fixed md:relative z-40
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* HEADER */}
        <SidebarHeader 
          collapsed={collapsed}
          onToggleCollapse={toggleSidebar}
          profile={profile}
          onProfileClick={() => handleNavigation('settings')}
        />
        
        {/* Mobile Close Button */}
        <button 
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg backdrop-blur-md transition-colors"
        >
          <X size={20} />
        </button>

        {/* NAV CONTENT */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1 scrollbar-hide">
          {menuGroups.map(group => (
            <div key={group.id}>
              <SidebarGroup 
                group={group} 
                isOpen={groupStates[group.id]}
                collapsed={collapsed}
                onToggle={toggleGroup}
                activeTab={activeTab}
                onNavigate={handleNavigation}
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-white/5 animate-in fade-in duration-500">
            <div className="flex items-center justify-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'rgb(var(--c-primary-500) / 0.7)' }} />
              <p className="text-[10px] text-slate-600 font-semibold tracking-wider">v1.0.0 · Nex Finance</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
});