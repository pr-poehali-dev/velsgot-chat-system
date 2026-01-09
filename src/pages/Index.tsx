import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

type UserRole = 'user' | 'junior-admin' | 'admin' | 'senior-admin' | 'creator';

interface User {
  id: number;
  username: string;
  password: string;
  role: UserRole;
  isBanned: boolean;
  isChatMuted: boolean;
}

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
  vkUrl: string;
  votes: number;
}

interface Video {
  id: string;
  title: string;
  vkUrl: string;
  description: string;
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  
  const [users, setUsers] = useState<User[]>([
    { id: 1, username: 'Создатель', password: 'admin123', role: 'creator', isBanned: false, isChatMuted: false },
    { id: 2, username: 'СтаршийАдмин', password: 'admin', role: 'senior-admin', isBanned: false, isChatMuted: false },
    { id: 3, username: 'Админ', password: 'mod', role: 'admin', isBanned: false, isChatMuted: false },
    { id: 4, username: 'Юзер1', password: '123', role: 'user', isBanned: false, isChatMuted: false },
  ]);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, username: 'Юзер1', role: 'user', text: 'Привет всем!', timestamp: new Date() },
    { id: 2, username: 'Админ', role: 'admin', text: 'Добро пожаловать на VELSGOT!', timestamp: new Date() },
  ]);
  
  const [messageText, setMessageText] = useState('');
  const [chatEnabled, setChatEnabled] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  const [currentVideo, setCurrentVideo] = useState<Video>({
    id: '1',
    title: 'Эпичное видео #1',
    vkUrl: 'https://vk.com/video-12345_67890',
    description: 'Смотрите самые захватывающие моменты! Невероятные трюки и эмоции.'
  });
  
  const [pollActive, setPollActive] = useState(true);
  const [pollOptions, setPollOptions] = useState<VideoOption[]>([
    { id: 1, title: 'Топ приколы недели', vkUrl: 'https://vk.com/video-11111_11111', votes: 5 },
    { id: 2, title: 'Лучшие моменты стримов', vkUrl: 'https://vk.com/video-22222_22222', votes: 3 },
    { id: 3, title: 'Эпичные клипы', vkUrl: 'https://vk.com/video-33333_33333', votes: 7 },
  ]);
  const [hasVoted, setHasVoted] = useState(false);
  
  const [userSearch, setUserSearch] = useState('');
  const [showVideoChangeDialog, setShowVideoChangeDialog] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoDesc, setNewVideoDesc] = useState('');
  
  const [showPollDialog, setShowPollDialog] = useState(false);
  const [newPollVideos, setNewPollVideos] = useState([
    { title: '', url: '' },
    { title: '', url: '' },
    { title: '', url: '' }
  ]);
  
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (currentUser && !onlineUsers.find(u => u.id === currentUser.id)) {
      setOnlineUsers([...onlineUsers, currentUser]);
    }
  }, [currentUser]);

  const handleAuth = () => {
    if (!authUsername.trim() || !authPassword.trim()) {
      toast({ title: 'Заполните все поля', variant: 'destructive' });
      return;
    }

    if (authMode === 'login') {
      const user = users.find(u => u.username === authUsername && u.password === authPassword);
      if (user) {
        if (user.isBanned) {
          toast({ title: 'Вы забанены', variant: 'destructive' });
          return;
        }
        setCurrentUser(user);
        setIsLoggedIn(true);
        setShowAuthDialog(false);
        toast({ title: `Добро пожаловать, ${user.username}!` });
      } else {
        toast({ title: 'Неверный логин или пароль', variant: 'destructive' });
      }
    } else {
      if (users.find(u => u.username === authUsername)) {
        toast({ title: 'Пользователь уже существует', variant: 'destructive' });
        return;
      }
      const newUser: User = {
        id: Date.now(),
        username: authUsername,
        password: authPassword,
        role: 'user',
        isBanned: false,
        isChatMuted: false
      };
      setUsers([...users, newUser]);
      setCurrentUser(newUser);
      setIsLoggedIn(true);
      setShowAuthDialog(false);
      toast({ title: 'Регистрация успешна!' });
    }
    
    setAuthUsername('');
    setAuthPassword('');
  };

  const sendMessage = () => {
    if (!currentUser || !messageText.trim() || !chatEnabled) return;
    
    if (currentUser.isChatMuted) {
      toast({ title: 'Вам заблокирован чат', variant: 'destructive' });
      return;
    }
    
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

  const toggleUserChatMute = (userId: number) => {
    setUsers(users.map(u => u.id === userId ? { ...u, isChatMuted: !u.isChatMuted } : u));
    const user = users.find(u => u.id === userId);
    toast({ title: `Чат ${user?.isChatMuted ? 'разблокирован' : 'заблокирован'} для ${user?.username}` });
  };

  const toggleUserBan = (userId: number) => {
    setUsers(users.map(u => u.id === userId ? { ...u, isBanned: !u.isBanned } : u));
    const user = users.find(u => u.id === userId);
    if (!user?.isBanned) {
      setOnlineUsers(onlineUsers.filter(u => u.id !== userId));
    }
    toast({ title: `${user?.username} ${user?.isBanned ? 'разбанен' : 'забанен'}` });
  };

  const vote = (optionId: number) => {
    if (!isLoggedIn || hasVoted) return;
    
    setPollOptions(pollOptions.map(opt => 
      opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
    ));
    setHasVoted(true);
    toast({ title: 'Голос учтён!' });
  };

  const createPoll = () => {
    const validVideos = newPollVideos.filter(v => v.title.trim() && v.url.trim());
    if (validVideos.length < 2) {
      toast({ title: 'Добавьте минимум 2 видео с ВК', variant: 'destructive' });
      return;
    }
    
    setPollOptions(validVideos.map((video, i) => ({
      id: i + 1,
      title: video.title,
      vkUrl: video.url,
      votes: 0
    })));
    setHasVoted(false);
    setPollActive(true);
    setNewPollVideos([{ title: '', url: '' }, { title: '', url: '' }, { title: '', url: '' }]);
    setShowPollDialog(false);
    toast({ title: 'Голосование создано!' });
  };

  const endPoll = () => {
    setPollActive(false);
    toast({ title: 'Голосование завершено' });
  };

  const changeVideo = () => {
    if (!newVideoUrl.trim() || !newVideoTitle.trim()) {
      toast({ title: 'Заполните все поля', variant: 'destructive' });
      return;
    }
    
    setCurrentVideo({
      id: Date.now().toString(),
      title: newVideoTitle,
      vkUrl: newVideoUrl,
      description: newVideoDesc
    });
    
    setNewVideoUrl('');
    setNewVideoTitle('');
    setNewVideoDesc('');
    setShowVideoChangeDialog(false);
    toast({ title: 'Видео изменено!' });
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(userSearch.toLowerCase())
  );

  const totalVotes = pollOptions.reduce((sum, opt) => sum + opt.votes, 0);
  const canManageUsers = currentUser && ['creator', 'admin', 'senior-admin', 'junior-admin'].includes(currentUser.role);
  const canChangeVideo = currentUser && ['creator', 'senior-admin'].includes(currentUser.role);
  const canManagePolls = currentUser && ['creator', 'admin', 'senior-admin'].includes(currentUser.role);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-4xl font-bold animated-gradient">VELSGOT</h1>
          
          <div className="flex items-center gap-3">
            {!isLoggedIn ? (
              <Button onClick={() => { setShowAuthDialog(true); setAuthMode('login'); }}>
                <Icon name="LogIn" size={20} className="mr-2" />
                Войти
              </Button>
            ) : (
              <>
                <Badge variant="outline" className="text-sm">
                  <span className={roleColors[currentUser?.role || 'user']}>
                    {currentUser?.username}
                  </span>
                </Badge>
                {canManageUsers && (
                  <Button 
                    onClick={() => setShowAdminPanel(!showAdminPanel)}
                    variant="outline"
                    className="gap-2"
                  >
                    <Icon name="Shield" size={20} />
                    Админ панель
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-effect p-6">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                <div className="text-center space-y-2">
                  <Icon name="Play" size={64} className="mx-auto text-primary" />
                  <p className="text-muted-foreground">Видео плеер ВК</p>
                  <p className="text-xs text-muted-foreground">{currentVideo.vkUrl}</p>
                </div>
              </div>
              
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">{currentVideo.title}</h3>
                  <p className="text-sm text-muted-foreground">{currentVideo.description}</p>
                </div>
                
                {canChangeVideo && (
                  <Button 
                    onClick={() => setShowVideoChangeDialog(true)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Icon name="RefreshCw" size={16} />
                    Сменить видео
                  </Button>
                )}
              </div>
            </Card>

            {pollActive && (
              <Card className="glass-effect p-6 animate-fade-in">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Icon name="BarChart3" size={24} className="text-primary" />
                  Голосование за следующее видео
                </h2>
                
                {totalVotes > 0 && (
                  <p className="text-sm text-muted-foreground mb-4">
                    Проголосовало: {totalVotes}
                  </p>
                )}
                
                <div className="space-y-3">
                  {pollOptions.map(option => {
                    const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                    
                    return (
                      <button
                        key={option.id}
                        onClick={() => vote(option.id)}
                        disabled={!isLoggedIn || hasVoted}
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
              </Card>
            )}
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

              <ScrollArea className="h-[400px] mb-4 pr-4" ref={chatScrollRef}>
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
                        {currentUser?.role === 'creator' && (
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
                    placeholder={
                      !isLoggedIn ? 'Войдите для отправки' : 
                      !chatEnabled ? 'Чат отключён' : 
                      'Введите сообщение...'
                    }
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={!isLoggedIn || !chatEnabled}
                  />
                  <Button onClick={sendMessage} disabled={!isLoggedIn || !chatEnabled}>
                    <Icon name="Send" size={20} />
                  </Button>
                </div>
              </div>
            </Card>

            {canManageUsers && showAdminPanel && (
              <Card className="glass-effect p-4 animate-fade-in">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Icon name="Shield" size={20} className="text-primary" />
                  Админ панель
                </h3>
                
                <Tabs defaultValue="users" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="users">Пользователи</TabsTrigger>
                    <TabsTrigger value="chat">Чат</TabsTrigger>
                    {canManagePolls && <TabsTrigger value="poll">Голосование</TabsTrigger>}
                  </TabsList>
                  
                  <TabsContent value="users" className="space-y-3">
                    <Input
                      placeholder="Поиск по нику..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="mb-2"
                    />
                    
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground mb-2">
                        Онлайн: {onlineUsers.length}
                      </p>
                      <ScrollArea className="h-[300px]">
                        {filteredUsers.map(user => (
                          <div key={user.id} className="p-3 rounded-lg glass-effect mb-2">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <span className={`font-medium ${roleColors[user.role]}`}>
                                  {user.username}
                                </span>
                                <p className="text-xs text-muted-foreground">{roleNames[user.role]}</p>
                              </div>
                              {onlineUsers.find(u => u.id === user.id) && (
                                <Badge variant="outline" className="text-xs">
                                  <Icon name="Wifi" size={12} className="mr-1" />
                                  Online
                                </Badge>
                              )}
                            </div>
                            
                            {user.id !== currentUser?.id && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toggleUserChatMute(user.id)}
                                  className="flex-1"
                                >
                                  <Icon name={user.isChatMuted ? 'MessageSquare' : 'MessageSquareOff'} size={14} className="mr-1" />
                                  {user.isChatMuted ? 'Разблокировать' : 'Заблокировать'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant={user.isBanned ? 'default' : 'destructive'}
                                  onClick={() => toggleUserBan(user.id)}
                                  className="flex-1"
                                >
                                  <Icon name="Ban" size={14} className="mr-1" />
                                  {user.isBanned ? 'Разбанить' : 'Забанить'}
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </ScrollArea>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="chat" className="space-y-2">
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
                  </TabsContent>
                  
                  {canManagePolls && (
                    <TabsContent value="poll" className="space-y-2">
                      <Button 
                        onClick={() => setShowPollDialog(true)}
                        variant="outline" 
                        className="w-full justify-start"
                      >
                        <Icon name="PlusCircle" size={18} className="mr-2" />
                        Создать голосование
                      </Button>
                      {pollActive && (
                        <Button 
                          onClick={endPoll}
                          variant="outline" 
                          className="w-full justify-start text-destructive hover:text-destructive"
                        >
                          <Icon name="XCircle" size={18} className="mr-2" />
                          Завершить голосование
                        </Button>
                      )}
                    </TabsContent>
                  )}
                </Tabs>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{authMode === 'login' ? 'Вход' : 'Регистрация'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Никнейм</Label>
              <Input
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                placeholder="Введите никнейм"
              />
            </div>
            <div>
              <Label>Пароль</Label>
              <Input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Введите пароль"
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
              />
            </div>
            <Button onClick={handleAuth} className="w-full">
              {authMode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="w-full"
            >
              {authMode === 'login' ? 'Нет аккаунта? Регистрация' : 'Есть аккаунт? Войти'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showVideoChangeDialog} onOpenChange={setShowVideoChangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сменить видео</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Ссылка на ВК Видео</Label>
              <Input
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                placeholder="https://vk.com/video-12345_67890"
              />
            </div>
            <div>
              <Label>Название</Label>
              <Input
                value={newVideoTitle}
                onChange={(e) => setNewVideoTitle(e.target.value)}
                placeholder="Название видео"
              />
            </div>
            <div>
              <Label>Описание</Label>
              <Input
                value={newVideoDesc}
                onChange={(e) => setNewVideoDesc(e.target.value)}
                placeholder="Краткое описание"
              />
            </div>
            <Button onClick={changeVideo} className="w-full">
              Сменить видео
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPollDialog} onOpenChange={setShowPollDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать голосование</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {newPollVideos.map((video, i) => (
              <div key={i} className="space-y-2 p-3 glass-effect rounded-lg">
                <Label>Видео {i + 1}</Label>
                <Input
                  placeholder="Название"
                  value={video.title}
                  onChange={(e) => {
                    const updated = [...newPollVideos];
                    updated[i].title = e.target.value;
                    setNewPollVideos(updated);
                  }}
                />
                <Input
                  placeholder="Ссылка ВК"
                  value={video.url}
                  onChange={(e) => {
                    const updated = [...newPollVideos];
                    updated[i].url = e.target.value;
                    setNewPollVideos(updated);
                  }}
                />
              </div>
            ))}
            <Button onClick={createPoll} className="w-full">
              Создать голосование
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
