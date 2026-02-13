import DashboardLayout from '@/components/layout/DashboardLayout';
import ChatInterface from '@/components/chat/ChatInterface';

const Chat = () => {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
          AI Research Assistant
        </h1>
        <p className="text-muted-foreground">
          Chat with AI about your papers, get summaries, and discover insights
        </p>
      </div>
      <ChatInterface />
    </DashboardLayout>
  );
};

export default Chat;
