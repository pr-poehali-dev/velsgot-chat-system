const API = {
  auth: 'https://functions.poehali.dev/abcdc272-210b-473e-9826-e78671a3a091',
  chat: 'https://functions.poehali.dev/eff72d5d-56b0-4f47-9e0d-c1a29788a119',
  video: 'https://functions.poehali.dev/89d63f8e-3099-4b2a-b9c3-8a1bd8f002dc'
};

export interface User {
  id: number;
  username: string;
  role: 'user' | 'junior-admin' | 'admin' | 'senior-admin' | 'creator';
  isBanned: boolean;
  isChatMuted: boolean;
  isOnline?: boolean;
}

export interface Message {
  id: number;
  username: string;
  role: string;
  text: string;
  timestamp: string;
}

export interface Video {
  id: number;
  title: string;
  vkUrl: string;
  description: string;
}

export interface PollOption {
  id: number;
  title: string;
  vkUrl: string;
  votes: number;
}

export interface Poll {
  active: boolean;
  pollId?: number;
  options?: PollOption[];
}

export const authApi = {
  async register(username: string, password: string): Promise<User> {
    const response = await fetch(API.auth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', username, password })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  async login(username: string, password: string): Promise<User> {
    const response = await fetch(API.auth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', username, password })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  async getUsersList(): Promise<User[]> {
    const response = await fetch(`${API.auth}?action=list`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  async toggleChatMute(userId: number): Promise<{ isChatMuted: boolean }> {
    const response = await fetch(API.auth, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_chat_mute', userId })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  async toggleBan(userId: number): Promise<{ isBanned: boolean }> {
    const response = await fetch(API.auth, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_ban', userId })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  async changeRole(userId: number, role: string): Promise<{ role: string }> {
    const response = await fetch(API.auth, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'change_role', userId, role })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  async setOffline(userId: number): Promise<void> {
    await fetch(API.auth, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_offline', userId })
    });
  }
};

export const chatApi = {
  async getMessages(limit: number = 100): Promise<Message[]> {
    const response = await fetch(`${API.chat}?limit=${limit}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  async sendMessage(userId: number, text: string): Promise<Message> {
    const response = await fetch(API.chat, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, text })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  async deleteMessage(id: number): Promise<void> {
    await fetch(`${API.chat}?id=${id}`, {
      method: 'DELETE'
    });
  },

  async clearChat(): Promise<void> {
    await fetch(`${API.chat}?action=clear`, {
      method: 'DELETE'
    });
  }
};

export const videoApi = {
  async getCurrentVideo(): Promise<Video> {
    const response = await fetch(`${API.video}?action=current_video`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  async changeVideo(title: string, vkUrl: string, description: string): Promise<Video> {
    const response = await fetch(API.video, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'change_video', title, vkUrl, description })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  async getActivePoll(): Promise<Poll> {
    const response = await fetch(`${API.video}?action=active_poll`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  async createPoll(options: { title: string; vkUrl: string }[]): Promise<void> {
    const response = await fetch(API.video, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_poll', options })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
  },

  async vote(userId: number, optionId: number): Promise<void> {
    const response = await fetch(API.video, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'vote', userId, optionId })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
  },

  async endPoll(): Promise<void> {
    await fetch(API.video, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'end_poll' })
    });
  }
};
