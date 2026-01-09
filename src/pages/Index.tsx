import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'user' | 'junior-admin' | 'admin' | 'senior-admin' | 'creator';

interface Message {
  id: number;
  username: string;
  role: UserRole;
  text: string;
  timestamp: Date;
}

interface VideoOption {
  id: number;
  title: string;
  votes: number;
}

const roleColors: Record<UserRole, string> = {
  'user': 'text-gray-400',
  'junior-admin': 'text-cyan-400',
  'admin': 'text-yellow-400',
  'senior-admin': 'text-orange-400',
  'creator': 'text-red-500'
};

const roleNames: Record<UserRole, string> = {
  'user': 'Пользователь',
  'junior-admin': 'Младший админ',
  'admin': 'Админ',
  'senior-admin': 'Старший админ',
  'creator': 'Создатель'
};

export default function Index() {
  const [currentUser] = useState<{ username: string; role: UserRole }>({
    username: 'Создатель',
    role: 'creator'
  });
  
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, username: 'Юзер1', role: 'user', text: 'Привет всем!', timestamp: new Date() },
    { id: 2, username: 'Модератор', role: 'junior-admin', text: 'Добро пожаловать!', timestamp: new Date() },
  ]);
  
  const [messageText, setMessageText] = useState('');
  const [chatEnabled, setChatEnabled] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [pollOpen, setPollOpen] = useState(false);
  const [pollOptions, setPollOptions] = useState<VideoOption[]>([
    { id: 1, title: 'Видео 1 - Эпичный момент', votes: 5 },
    { id: 2, title: 'Видео 2 - Лучшие приколы', votes: 3 },
    { id: 3, title: 'Видео 3 - Топ клипы', votes: 7 },
  ]);
  const [newPollVideos, setNewPollVideos] = useState(['', '', '']);
  const [hasVoted, setHasVoted] = useState(false);
  
  const { toast } = useToast();

  const sendMessage = () => {
    if (!messageText.trim() || !chatEnabled) return;
    
    const newMessage: Message = {
      id: Date.now(),
      username: currentUser.username,
      role: currentUser.role,
      text: messageText,
      timestamp: new Date()
    };
    
    setMessages([...messages, newMessage]);
    setMessageText('');
  };

  const deleteMessage = (id: number) => {
    setMessages(messages.filter(msg => msg.id !== id));
    toast({ title: 'Сообщение удалено' });
  };

  const clearChat = () => {
    setMessages([]);
    toast({ title: 'Чат очищен' });
  };

  const toggleChat = () => {
    setChatEnabled(!chatEnabled);
    toast({ title: chatEnabled ? 'Чат отключён' : 'Чат включён' });
  };

  const vote = (optionId: number) => {
    if (hasVoted) return;
    
    setPollOptions(pollOptions.map(opt => 
      opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
    ));
    setHasVoted(true);
    toast({ title: 'Голос учтён!' });
  };

  const createPoll = () => {
    const validVideos = newPollVideos.filter(v => v.trim());
    if (validVideos.length < 2) {
      toast({ title: 'Добавьте минимум 2 видео', variant: 'destructive' });
      return;
    }
    
    setPollOptions(validVideos.map((title, i) => ({
      id: i + 1,
      title,
      votes: 0
    })));
    setHasVoted(false);
    setNewPollVideos(['', '', '']);
    setPollOpen(false);
    toast({ title: 'Голосование создано!' });
  };

  const totalVotes = pollOptions.reduce((sum, opt) => sum + opt.votes, 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-4xl font-bold gradient-text">VELSGOT</h1>
          
          {currentUser.role === 'creator' && (
            <Button 
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              variant="outline"
              className="gap-2"
            >
              <Icon name="Settings" size={20} />
              Админ панель
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-effect p-6">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                <div className="text-center space-y-2">
                  <Icon name="Play" size={64} className="mx-auto text-primary" />
                  <p className="text-muted-foreground">Видео плеер (ВК Видео)</p>
                </div>
              </div>
            </Card>

            <Card className="glass-effect p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Icon name="BarChart3" size={24} className="text-primary" />
                Голосование за следующее видео
              </h2>
              
              {totalVotes > 0 && (
                <p className="text-sm text-muted-foreground mb-4">
                  Проголосовало: {totalVotes} {totalVotes === 1 ? 'человек' : 'человек'}
                </p>
              )}
              
              <div className="space-y-3">
                {pollOptions.map(option => {
                  const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                  
                  return (
                    <button
                      key={option.id}
                      onClick={() => vote(option.id)}
                      disabled={hasVoted}
                      className="w-full text-left p-4 rounded-lg glass-effect hover:bg-primary/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{option.title}</span>
                        <span className="text-sm text-muted-foreground">{percentage}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-primary h-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {currentUser.role === 'creator' && (
                <Dialog open={pollOpen} onOpenChange={setPollOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full mt-4" variant="outline">
                      <Icon name="Vote" size={20} className="mr-2" />
                      Создать голосование
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Новое голосование</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      {newPollVideos.map((video, i) => (
                        <Input
                          key={i}
                          placeholder={`Название видео ${i + 1}`}
                          value={video}
                          onChange={(e) => {
                            const updated = [...newPollVideos];
                            updated[i] = e.target.value;
                            setNewPollVideos(updated);
                          }}
                        />
                      ))}
                      <Button onClick={createPoll} className="w-full">
                        Создать голосование
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="glass-effect p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Icon name="MessageSquare" size={20} />
                  Чат
                </h3>
                <Badge variant={chatEnabled ? 'default' : 'destructive'}>
                  {chatEnabled ? 'Включён' : 'Отключён'}
                </Badge>
              </div>

              <ScrollArea className="h-[400px] mb-4 pr-4">
                <div className="space-y-3">
                  {messages.map(msg => (
                    <div 
                      key={msg.id} 
                      className="p-3 rounded-lg glass-effect hover:bg-primary/5 transition-colors group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <span className={`font-medium ${roleColors[msg.role]}`}>
                            {msg.username}
                          </span>
                          <p className="text-sm mt-1">{msg.text}</p>
                        </div>
                        {currentUser.role === 'creator' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteMessage(msg.id)}
                          >
                            <Icon name="Trash2" size={16} />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder={chatEnabled ? 'Введите сообщение...' : 'Чат отключён'}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={!chatEnabled}
                  />
                  <Button onClick={sendMessage} disabled={!chatEnabled}>
                    <Icon name="Send" size={20} />
                  </Button>
                </div>
              </div>
            </Card>

            {currentUser.role === 'creator' && showAdminPanel && (
              <Card className="glass-effect p-4 animate-in slide-in-from-bottom-4">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Icon name="Shield" size={20} className="text-primary" />
                  Панель управления
                </h3>
                <div className="space-y-2">
                  <Button 
                    onClick={toggleChat} 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Icon name={chatEnabled ? 'MessageSquareOff' : 'MessageSquare'} size={18} className="mr-2" />
                    {chatEnabled ? 'Отключить чат' : 'Включить чат'}
                  </Button>
                  <Button 
                    onClick={clearChat} 
                    variant="outline" 
                    className="w-full justify-start text-destructive hover:text-destructive"
                  >
                    <Icon name="Trash" size={18} className="mr-2" />
                    Очистить чат
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
