import { create } from "zustand";

interface ChatState {
  selectedChannelId: string | null;
  setSelectedChannelId: (id: string | null) => void;
  profileToView: string | null;
  setProfileToView: (id: string | null) => void;
  isEditingProfile: boolean;
  setIsEditingProfile: (isEditing: boolean) => void;
  
  // Topics state
  activeTopicId: string | null;
  setActiveTopicId: (id: string | null) => void;
  topics: any[];
  setTopics: (topics: any[]) => void;
  addTopic: (topic: any) => void;
  updateTopic: (topic: any) => void;
  removeTopic: (topicId: string) => void;
  
  // Глобальное состояние сообщений
  messages: any[];
  hasMore: boolean;
  nextCursor: string | null;
  setMessages: (messages: any[]) => void;
  addMessage: (message: any) => void;
  addMessages: (messages: any[], prepend?: boolean) => void;
  updateMessage: (message: any) => void;
  deleteMessage: (messageId: string) => void;
  setHasMore: (hasMore: boolean) => void;
  setNextCursor: (cursor: string | null) => void;
  updateMessageStatus: (messageId: string, status: string) => void;

  // Состояние присутствия пользователей
  userStatuses: Record<string, "ONLINE" | "OFFLINE">;
  setUserStatus: (userId: string, status: "ONLINE" | "OFFLINE") => void;
  // Темы чатов
  chatThemes: Record<string, string>; // channelId -> themeName
  setChatTheme: (channelId: string, theme: string) => void;
  // Состояние сессии
  currentStoreUserId: string | null;
  setCurrentStoreUserId: (id: string | null) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  selectedChannelId: null,
  setSelectedChannelId: (id) => set({ 
    selectedChannelId: id, 
    messages: [], 
    hasMore: true,
    nextCursor: null,
    activeTopicId: null, // Reset topic when changing channel
    topics: [] // Reset topics when changing channel
  }),
  profileToView: null,
  setProfileToView: (id) => set({ profileToView: id }),
  isEditingProfile: false,
  setIsEditingProfile: (isEditing) => set({ isEditingProfile: isEditing }),

  activeTopicId: null,
  setActiveTopicId: (id) => set({ activeTopicId: id, messages: [] }),
  topics: [],
  setTopics: (topics) => set({ topics }),
  addTopic: (topic) => set((state) => ({ topics: [...state.topics, topic] })),
  updateTopic: (topic) => set((state) => ({
    topics: state.topics.map(t => t.id === topic.id ? topic : t)
  })),
  removeTopic: (topicId) => set((state) => ({
    topics: state.topics.filter(t => t.id !== topicId)
  })),

  currentStoreUserId: null,
  setCurrentStoreUserId: (id) => {
    const current = get().currentStoreUserId;
    if (current && current !== id) {
      console.log("[STORE_RESET] User ID mismatch, clearing store", { old: current, new: id });
      get().reset();
    }
    set({ currentStoreUserId: id });
  },

  messages: [],
  hasMore: true,
  nextCursor: null,
  setMessages: (messages) => set({ messages }),
  setHasMore: (hasMore) => set({ hasMore }),
  setNextCursor: (nextCursor) => set({ nextCursor }),
  addMessages: (newMessages, prepend = false) => set((state) => {
    const existingIds = new Set(state.messages.map(m => m.id));
    const filteredNew = newMessages.filter(m => !existingIds.has(m.id));
    
    return {
      messages: prepend 
        ? [...filteredNew, ...state.messages] 
        : [...state.messages, ...filteredNew]
    };
  }),
  addMessage: (message) => set((state) => {
    // Проверяем, нет ли уже такого сообщения (по ID)
    if (state.messages.some(m => m.id === message.id)) return state;

    // Если это настоящее сообщение, проверяем, нет ли оптимистичного аналога
    // Аналог ищем по тексту и автору, если сообщение пришло в течение последних 5 секунд
    if (!message.isOptimistic) {
      const optimisticIndex = state.messages.findIndex(m => 
        m.isOptimistic && 
        m.text === message.text && 
        m.userId === message.userId
      );

      if (optimisticIndex !== -1) {
        // Заменяем оптимистичное сообщение настоящим
        const newMessages = [...state.messages];
        newMessages[optimisticIndex] = message;
        return { messages: newMessages };
      }
    }

    return { messages: [...state.messages, message] };
  }),

  updateMessage: (message) => set((state) => ({
    messages: state.messages.map(m => m.id === message.id ? message : m)
  })),

  deleteMessage: (messageId) => set((state) => ({
    messages: state.messages.filter(m => m.id !== messageId)
  })),

  updateMessageStatus: (messageId, status) => set((state) => ({
    messages: state.messages.map(m => m.id === messageId ? { ...m, status } : m)
  })),

  userStatuses: {},
  setUserStatus: (userId, status) => set((state) => ({
    userStatuses: { ...state.userStatuses, [userId]: status }
  })),

  chatThemes: {},
  setChatTheme: (channelId, theme) => set((state) => ({
    chatThemes: { ...state.chatThemes, [channelId]: theme }
  })),
  
  reset: () => set({
    selectedChannelId: null,
    messages: [],
    hasMore: true,
    nextCursor: null,
    activeTopicId: null,
    topics: [],
    userStatuses: {},
    chatThemes: {},
    currentStoreUserId: null
  })
}));
