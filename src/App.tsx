import React, { useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { ChatArea } from './components/chat/ChatArea';
import { useChatStore } from './store/chatStore';

const App: React.FC = () => {
  const { conversations, createConversation, init, isInitialized } = useChatStore();

  // Load from DB first
  useEffect(() => {
    init();
  }, [init]);

  // Auto-create a conversation if empty after init
  useEffect(() => {
    if (isInitialized && conversations.length === 0) {
      createConversation();
    }
  }, [isInitialized, conversations.length, createConversation]);

  return (
    <div className="flex h-screen w-full font-sans text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-950 overflow-hidden">
      <Sidebar />
      <ChatArea />
    </div>
  );
}

export default App;
