import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, List, Wallet, CreditCard, Repeat, 
  TrendingUp, PieChart, Settings, LineChart, 
  ChevronDown, X, Target
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
        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative
        ${isActive 
          ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}
        ${collapsed ? 'justify-center' : ''}
      `}
      title={collapsed ? item.label : undefined}
    >
      <Icon size={20} className={`min-w-[20px] ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-100'}`} />
      
      {!collapsed && (
        <span className="text-sm font-medium whitespace-nowrap overflow-hidden animate-in fade-in duration-300">
          {item.label}
        </span>
      )}

      {/* Collapsed Tooltip (Desktop only) */}
      {collapsed && (
        <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-slate-700 shadow-xl transition-opacity translate-x-1 group-hover:translate-x-0">
          {item.label}
          {/* Tiny arrow */}
          <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900 border-l border-b border-slate-700 rotate-45 transform"></div>
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
    <div className="mb-2">
      {!collapsed && (
        <button 
          onClick={() => onToggle(group.id)}
          className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold text-slate-500 hover:text-slate-300 uppercase tracking-wider transition-colors"
        >
          <span>{group.title}</span>
          <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
        </button>
      )}
      
      {/* Separator for collapsed mode to group visually */}
      {collapsed && (
        <div className="h-px w-8 mx-auto bg-slate-800/50 my-3" />
      )}

      <div className={`space-y-1 overflow-hidden transition-all duration-300 ${!collapsed && !isOpen ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
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
    patrimonio: true,
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
      title: 'PRINCIPAL',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'list', label: 'Extrato', icon: List },
        { id: 'accounts', label: 'Contas', icon: Wallet },
      ]
    },
    {
      id: 'planejamento',
      title: 'PLANEJAMENTO',
      items: [
        { id: 'cards', label: 'Cartões', icon: CreditCard },
        { id: 'goals', label: 'Metas', icon: Target },
        { id: 'recurring', label: 'Recorrências', icon: Repeat },
        { id: 'budgets', label: 'Orçamentos', icon: PieChart },
        { id: 'forecast', label: 'Previsão', icon: TrendingUp },
      ]
    },
    {
      id: 'patrimonio',
      title: 'PATRIMÔNIO',
      items: [
        { id: 'investments', label: 'Investimentos', icon: LineChart },
      ]
    },
    {
      id: 'sistema',
      title: 'SISTEMA',
      items: [
        { id: 'settings', label: 'Configurações', icon: Settings },
      ]
    }
  ];

  // --- RENDER ---

  const sidebarClasses = `
    flex flex-col bg-slate-900 border-r border-slate-800 h-screen transition-all duration-300
    ${collapsed ? 'w-[72px]' : 'w-[260px]'}
    fixed md:relative z-40
    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
  `;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={sidebarClasses}>
        
        {/* NEW HEADER (Replaces old header & profile section) */}
        <SidebarHeader 
          collapsed={collapsed}
          onToggleCollapse={toggleSidebar}
          profile={profile}
          onProfileClick={() => handleNavigation('settings')}
        />
        
        {/* Mobile Close Button (Absolute positioned to not mess with header layout) */}
        <button 
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden absolute top-4 right-4 p-1 text-slate-400 hover:text-white bg-slate-800/50 rounded-lg"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-2 scrollbar-hide">
          {menuGroups.map(group => (
            <SidebarGroup 
              key={group.id} 
              group={group} 
              isOpen={groupStates[group.id]}
              collapsed={collapsed}
              onToggle={toggleGroup}
              activeTab={activeTab}
              onNavigate={handleNavigation}
            />
          ))}
        </div>

        {/* Footer info only visible when expanded */}
        {!collapsed && (
          <div className="p-4 border-t border-slate-800/50 text-center animate-in fade-in duration-500">
             <p className="text-[10px] text-slate-600 font-medium">v1.0.0 • Offline Mode</p>
          </div>
        )}
      </aside>
    </>
  );
});