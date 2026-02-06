import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import { Button } from '@/components/ui/button';
import { ArrowRight, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center glow-primary">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-serif text-xl font-semibold">ResearchPilot</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/search">Search Papers</Link>
            </Button>
            <Button variant="gradient" asChild>
              <Link to="/dashboard">
                Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <Hero />
      <Features />

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Research?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Join researchers worldwide using AI to accelerate their academic work.
          </p>
          <Button variant="hero" asChild>
            <Link to="/dashboard">
              Start Researching Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Brain className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-serif text-lg font-semibold">ResearchPilot AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 ResearchPilot. Powered by Advanced AI Agents.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
