import { Link, useLocation } from 'react-router-dom';
import { Brain, Search, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';

const Header = () => {
    const location = useLocation();
    const path = location.pathname;

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    return (
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                        <Brain className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <span className="font-serif text-lg font-semibold">ResearchPilot</span>
                </Link>

                <nav className="hidden md:flex items-center gap-6 ml-6 flex-1">
                    <Link
                        to="/workspaces"
                        className={`text-sm font-medium transition-colors hover:text-primary ${path.includes('/workspaces') || path === '/' ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                        Workspaces
                    </Link>
                    <Link
                        to="/chat"
                        className={`text-sm font-medium transition-colors hover:text-primary ${path.includes('/chat') ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                        AI Chat
                    </Link>
                    <Link
                        to="/search"
                        className={`text-sm font-medium transition-colors hover:text-primary ${path.includes('/search') ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                        Search Papers
                    </Link>
                </nav>

                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            </div>
        </header>
    );
};

export default Header;
