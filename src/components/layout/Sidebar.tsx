import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Search, 
  FolderOpen, 
  MessageSquare, 
  Upload, 
  FileText,
  Sparkles,
  Settings,
  Menu,
  X,
  Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Search, label: 'Search Papers', path: '/search' },
  { icon: FolderOpen, label: 'Workspaces', path: '/workspaces' },
  { icon: MessageSquare, label: 'AI Chat', path: '/chat' },
  { icon: Sparkles, label: 'AI Tools', path: '/tools' },
  { icon: Upload, label: 'Upload PDF', path: '/upload' },
  { icon: FileText, label: 'Doc Space', path: '/documents' },
];

const Sidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
          collapsed ? "-translate-x-full lg:translate-x-0 lg:w-20" : "w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-primary glow-primary">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-serif text-lg font-semibold text-foreground">
                  ResearchPilot
                </span>
                <span className="text-xs text-muted-foreground">AI Agent</span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-thin">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "sidebar-nav-item",
                    isActive && "active",
                    collapsed && "justify-center px-3"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary")} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Settings */}
          <div className="px-3 py-4 border-t border-sidebar-border">
            <Link
              to="/settings"
              className={cn(
                "sidebar-nav-item",
                location.pathname === '/settings' && "active",
                collapsed && "justify-center px-3"
              )}
            >
              <Settings className="h-5 w-5" />
              {!collapsed && <span>Settings</span>}
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
