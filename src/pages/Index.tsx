import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import VKPlayer from '@/components/VKPlayer';
import { authApi, chatApi, videoApi, type User, type Message, type PollOption, type Video } from '@/lib/api';

const roleColors: Record<string, string> = {
  'user': 'text-gray-400',
  'junior-admin': 'text-cyan-400',
  'admin': 'text-yellow-400',
  'senior-admin': 'text-orange-400',
  'creator': 'text-red-500'
};

const roleNames: Record<string, string> = {
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
  
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [chatEnabled] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  
  const [pollActive, setPollActive] = useState(false);
  const [pollOptions, setPollOptions] = useState<PollOption[]>([]);
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

  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState('');
  
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadVideo();
    loadPoll();
    loadMessages();
    loadUsers();
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isLoggedIn) {
        loadMessages();
        loadUsers();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const loadVideo = async () => {
    try {
      const video = await videoApi.getCurrentVideo();
      setCurrentVideo(video);
    } catch (error) {
      console.error('Error loading video:', error);
    }
  };

  const loadPoll = async () => {
    try {
      const poll = await videoApi.getActivePoll();
      setPollActive(poll.active);
      if (poll.active && poll.options) {
        setPollOptions(poll.options);
      }
    } catch (error) {
      console.error('Error loading poll:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const msgs = await chatApi.getMessages(100);
      setMessages(msgs.map(m => ({ ...m, timestamp: m.timestamp })));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const usersList = await authApi.getUsersList();
      setUsers(usersList);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleAuth = async () => {
    if (!authUsername.trim() || !authPassword.trim()) {
      toast({ title: 'Заполните все поля', variant: 'destructive' });
      return;
    }

    try {
      let user: User;
      if (authMode === 'login') {
        user = await authApi.login(authUsername, authPassword);
        toast({ title: `Добро пожаловать, ${user.username}!` });
      } else {
        user = await authApi.register(authUsername, authPassword);
        toast({ title: 'Регистрация успешна!' });
      }
      
      setCurrentUser(user);
      setIsLoggedIn(true);
      setShowAuthDialog(false);
      setAuthUsername('');
      setAuthPassword('');
      
      await loadUsers();
      await loadMessages();
    } catch (error: any) {
      toast({ title: error.message, variant: 'destructive' });
    }
  };

  const sendMessage = async () => {
    if (!currentUser || !messageText.trim() || !chatEnabled) return;
    
    try {
      await chatApi.sendMessage(currentUser.id, messageText);
      setMessageText('');
      await loadMessages();
    } catch (error: any) {
      toast({ title: error.message, variant: 'destructive' });
    }
  };

  const deleteMessage = async (id: number) => {
    try {
      await chatApi.deleteMessage(id);
      await loadMessages();
      toast({ title: 'Сообщение удалено' });
    } catch (error: any) {
      toast({ title: error.message, variant: 'destructive' });
    }
  };

  const clearChat = async () => {
    try {
      await chatApi.clearChat();
      await loadMessages();
      toast({ title: 'Чат очищен' });
    } catch (error: any) {
      toast({ title: error.message, variant: 'destructive' });
    }
  };

  const toggleUserChatMute = async (userId: number) => {
    try {
      await authApi.toggleChatMute(userId);
      await loadUsers();
      const user = users.find(u => u.id === userId);
      toast({ title: `Чат ${user?.isChatMuted ? 'разблокирован' : 'заблокирован'} для ${user?.username}` });
    } catch (error: any) {
      toast({ title: error.message, variant: 'destructive' });
    }
  };

  const toggleUserBan = async (userId: number) => {
    try {
      await authApi.toggleBan(userId);
      await loadUsers();
      const user = users.find(u => u.id === userId);
      toast({ title: `${user?.username} ${user?.isBanned ? 'разбанен' : 'забанен'}` });
    } catch (error: any) {
      toast({ title: error.message, variant: 'destructive' });
    }
  };

  const vote = async (optionId: number) => {
    if (!isLoggedIn || !currentUser || hasVoted) return;
    
    try {
      await videoApi.vote(currentUser.id, optionId);
      setHasVoted(true);
      await loadPoll();
      toast({ title: 'Голос учтён!' });
    } catch (error: any) {
      toast({ title: error.message, variant: 'destructive' });
    }
  };

  const createPoll = async () => {
    const validVideos = newPollVideos.filter(v => v.title.trim() && v.url.trim());
    if (validVideos.length < 2) {
      toast({ title: 'Добавьте минимум 2 видео с ВК', variant: 'destructive' });
      return;
    }
    
    try {
      await videoApi.createPoll(validVideos.map(v => ({ title: v.title, vkUrl: v.url })));
      setHasVoted(false);
      setNewPollVideos([{ title: '', url: '' }, { title: '', url: '' }, { title: '', url: '' }]);
      setShowPollDialog(false);
      await loadPoll();
      toast({ title: 'Голосование создано!' });
    } catch (error: any) {
      toast({ title: error.message, variant: 'destructive' });
    }
  };

  const endPoll = async () => {
    try {
      await videoApi.endPoll();
      setPollActive(false);
      toast({ title: 'Голосование завершено' });
    } catch (error: any) {
      toast({ title: error.message, variant: 'destructive' });
    }
  };

  const changeVideo = async () => {
    if (!newVideoUrl.trim() || !newVideoTitle.trim()) {
      toast({ title: 'Заполните все поля', variant: 'destructive' });
      return;
    }
    
    try {
      const video = await videoApi.changeVideo(newVideoTitle, newVideoUrl, newVideoDesc);
      setCurrentVideo(video);
      setNewVideoUrl('');
      setNewVideoTitle('');
      setNewVideoDesc('');
      setShowVideoChangeDialog(false);
      toast({ title: 'Видео изменено!' });
    } catch (error: any) {
      toast({ title: error.message, variant: 'destructive' });
    }
  };

  const openRoleDialog = (userId: number, currentRole: string) => {
    setSelectedUserId(userId);
    setSelectedRole(currentRole);
    setShowRoleDialog(true);
  };

  const changeUserRole = async () => {
    if (!selectedUserId || !selectedRole) return;
    
    try {
      await authApi.changeRole(selectedUserId, selectedRole);
      await loadUsers();
      setShowRoleDialog(false);
      toast({ title: 'Роль изменена!' });
    } catch (error: any) {
      toast({ title: error.message, variant: 'destructive' });
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(userSearch.toLowerCase())
  );

  const totalVotes = pollOptions.reduce((sum, opt) => sum + opt.votes, 0);
  const canManageUsers = currentUser && ['creator', 'admin', 'senior-admin', 'junior-admin'].includes(currentUser.role);
  const canChangeVideo = currentUser && ['creator', 'senior-admin'].includes(currentUser.role);
  const canManagePolls = currentUser && ['creator', 'admin', 'senior-admin'].includes(currentUser.role);
  const canChangeRoles = currentUser && currentUser.role === 'creator';

  const onlineUsers = users.filter(u => u.isOnline);

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
              {currentVideo && <VKPlayer vkUrl={currentVideo.vkUrl} title={currentVideo.title} />}
              
              <div className="flex items-start justify-between gap-4 mt-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">{currentVideo?.title}</h3>
                  <p className="text-sm text-muted-foreground">{currentVideo?.description}</p>
                </div>
                
                {canChangeVideo && (
                  <Button 
                    onClick={() => setShowVideoChangeDialog(true)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Icon name="RefreshCw" size={16} />
                    Сменить
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
                              {user.isOnline && (
                                <Badge variant="outline" className="text-xs">
                                  <Icon name="Wifi" size={12} className="mr-1" />
                                  Online
                                </Badge>
                              )}
                            </div>
                            
                            {user.id !== currentUser?.id && (
                              <div className="space-y-2">
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
                                {canChangeRoles && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openRoleDialog(user.id, user.role)}
                                    className="w-full"
                                  >
                                    <Icon name="UserCog" size={14} className="mr-1" />
                                    Изменить роль
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </ScrollArea>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="chat" className="space-y-2">
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

      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменить роль пользователя</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите роль" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Пользователь</SelectItem>
                <SelectItem value="junior-admin">Младший админ</SelectItem>
                <SelectItem value="admin">Админ</SelectItem>
                <SelectItem value="senior-admin">Старший админ</SelectItem>
                <SelectItem value="creator">Создатель</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={changeUserRole} className="w-full">
              Изменить роль
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
