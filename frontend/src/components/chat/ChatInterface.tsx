import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn, API_URL } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: "Hello! I'm your ResearchPilot AI assistant. I can help you analyze papers, answer research questions, generate summaries, and find connections across your imported documents. What would you like to explore today?",
    timestamp: new Date(),
  },
];

interface ChatInterfaceProps {
  workspaceId?: string;
}

const ChatInterface = ({ workspaceId: propWorkspaceId }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>(propWorkspaceId || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch workspaces if no ID provided
  useEffect(() => {
    if (!propWorkspaceId) {
      fetchWorkspaces();
    } else {
      setSelectedWorkspaceId(propWorkspaceId);
    }
  }, [propWorkspaceId]);

  const fetchWorkspaces = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${API_URL}/workspaces/`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data);
        if (data.length > 0) setSelectedWorkspaceId(data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch workspaces", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!selectedWorkspaceId) {
      alert("Please select a workspace first.");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(`${API_URL}/rag/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          workspace_id: selectedWorkspaceId,
          question: userMessage.content
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        const detail = errData?.detail || `Server error (${response.status})`;
        throw new Error(detail);
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer + (data.sources?.length ? "\n\n**Sources:**\n" + data.sources.map((s: string) => "- " + s).join("\n") : ""),
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, aiMessage]);

    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] glass-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center glow-primary">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Research Assistant</h2>
            <p className="text-xs text-muted-foreground">Powered by AI • Context-aware</p>
          </div>
        </div>

        {/* Workspace Selector for Global Chat */}
        {!propWorkspaceId && workspaces.length > 0 && (
          <select
            value={selectedWorkspaceId}
            onChange={(e) => setSelectedWorkspaceId(e.target.value)}
            className="bg-secondary/50 border-none rounded-md text-sm p-2"
          >
            {workspaces.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        )}

        <div className="flex items-center gap-2 text-xs text-primary">
          <Sparkles className="h-4 w-4 ai-pulse" />
          <span>Active</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-4 animate-fade-in",
              message.role === 'user' && "flex-row-reverse"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                message.role === 'assistant'
                  ? "bg-gradient-primary glow-primary"
                  : "bg-secondary"
              )}
            >
              {message.role === 'assistant' ? (
                <Bot className="h-4 w-4 text-primary-foreground" />
              ) : (
                <User className="h-4 w-4 text-foreground" />
              )}
            </div>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3",
                message.role === 'assistant'
                  ? "bg-secondary/50 text-foreground"
                  : "bg-primary text-primary-foreground"
              )}
            >
              {message.role === 'assistant' ? (
                <div className="prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm">{message.content}</p>
              )}
              <span className="text-[10px] opacity-50 mt-2 block">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-4 animate-fade-in">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center glow-primary">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="bg-secondary/50 rounded-2xl px-4 py-3">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border/50 bg-card/50">
        <div className="flex items-end gap-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your research papers..."
            className="min-h-[48px] max-h-[200px] resize-none bg-secondary/50 border-border/50 focus:border-primary"
            rows={1}
          />
          <Button
            variant="gradient"
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="h-12 w-12 flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

// Mock response generator (replace with actual AI integration)
function generateMockResponse(query: string): string {
  const responses = [
    `Based on your query about "${query.slice(0, 30)}...", I've analyzed the relevant papers in your workspace.

**Key Findings:**
1. The research indicates significant developments in this area over the past decade
2. Multiple studies support the hypothesis with strong empirical evidence
3. There are notable gaps in the current literature regarding edge cases

**Recommendations:**
- Consider exploring papers by Smith et al. (2023) for additional context
- The methodology section of Paper #3 in your workspace may be particularly relevant

Would you like me to generate a detailed summary or explore any specific aspect further?`,

    `I found several interesting connections in your research collection related to "${query.slice(0, 30)}...":

**Cross-Paper Analysis:**
- Papers 1, 3, and 5 share similar methodological approaches
- There's a clear evolution of thought from the 2020 to 2024 publications
- Key disagreements exist between Author A and Author B on the core hypothesis

**Citation Network:**
The papers in your workspace form a cohesive citation network, with the foundational work being referenced across 80% of your collection.

Shall I create a literature review section or identify additional papers that could strengthen your research?`,
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

export default ChatInterface;
