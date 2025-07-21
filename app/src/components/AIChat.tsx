import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Bot, User, Camera, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  systemSummary?: {
    cpu_usage: number;
    memory_usage: number;
    uptime: string;
    battery_percent?: number;
  };
}

interface AIChatProps {
  deviceEndpoint: string;
}

export function AIChat({ deviceEndpoint }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Hello! I'm RhishDesk AI, your intelligent system administrator. I have real-time access to your ${deviceEndpoint} system data and can help you monitor, troubleshoot, and manage your device. What would you like to know?`,
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [includeScreenshot, setIncludeScreenshot] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`https://myspace.rhishav.com/${deviceEndpoint}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: input,
          include_screenshot: includeScreenshot
        })
      });

      if (!response.ok) throw new Error('Failed to get AI response');

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.ai_response,
        isUser: false,
        timestamp: new Date(),
        systemSummary: data.system_summary
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIncludeScreenshot(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="flex flex-col h-[500px] metric-card">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg gradient-primary">
            <MessageSquare className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">RhishDesk AI</h3>
            <p className="text-xs text-muted-foreground">System Assistant</p>
          </div>
        </div>
        <Badge variant="outline" className="status-online text-xs">
          <Bot className="h-3 w-3 mr-1" />
          Online
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${message.isUser ? 'order-2' : 'order-1'}`}>
              <div className={`flex items-start space-x-2 ${message.isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  message.isUser ? 'gradient-secondary' : 'gradient-primary'
                }`}>
                  {message.isUser ? <User className="h-3 w-3 text-white" /> : <Bot className="h-3 w-3 text-white" />}
                </div>
                <div className={`rounded-xl p-3 ${
                  message.isUser 
                    ? 'gradient-secondary text-white' 
                    : 'bg-muted text-foreground border border-border'
                }`}>
                  <p className="text-xs whitespace-pre-wrap">{message.content}</p>
                  {message.systemSummary && (
                    <div className="mt-2 p-2 bg-black/20 rounded-lg border border-white/10">
                      <p className="text-xs text-white/80 mb-1">System Summary</p>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div>CPU: {message.systemSummary.cpu_usage?.toFixed(1)}%</div>
                        <div>RAM: {message.systemSummary.memory_usage?.toFixed(1)}%</div>
                        <div className="col-span-2">Uptime: {message.systemSummary.uptime}</div>
                        {message.systemSummary.battery_percent && (
                          <div className="col-span-2">Battery: {message.systemSummary.battery_percent}%</div>
                        )}
                      </div>
                    </div>
                  )}
                  <p className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
                <Bot className="h-3 w-3 text-white" />
              </div>
              <div className="bg-muted rounded-xl p-3 border border-border">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-xs text-muted-foreground">AI thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-border">
        <div className="flex items-center space-x-2 mb-2">
          <Button
            variant={includeScreenshot ? "default" : "outline"}
            size="sm"
            onClick={() => setIncludeScreenshot(!includeScreenshot)}
            className={includeScreenshot ? 'gradient-warning text-xs' : 'text-xs'}
          >
            <Camera className="h-3 w-3 mr-1" />
            Screenshot
          </Button>
        </div>
        <div className="flex space-x-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your system..."
            className="min-h-[50px] resize-none text-xs"
            disabled={isLoading}
          />
          <Button 
            onClick={sendMessage} 
            disabled={!input.trim() || isLoading}
            className="gradient-primary"
            size="sm"
          >
            <Send className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}