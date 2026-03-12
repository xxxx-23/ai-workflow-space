import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useChatStream } from '../../hooks/useChatStream';
import { MarkdownBlock } from './MarkdownBlock';
import { useVirtualizer } from '@tanstack/react-virtual';

export const ChatArea: React.FC = () => {
  const { conversations, activeId } = useChatStore();
  const { sendMessage, stopGenerating, isGenerating } = useChatStream();
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeConv = conversations.find(c => c.id === activeId);
  const messages = activeConv?.messages || [];

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // 预估每条消息高度，提升滚动平滑度
    overscan: 5, // 上下多渲染 5 条，防止快速滚动白屏
  });

  // 流式输出时，或者有新消息时，自动滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      rowVirtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
    }
  }, [messages.length, messages[messages.length - 1]?.content, rowVirtualizer]);

  const handleSend = async () => {
    if (!input.trim() || !activeId || isGenerating) return;
    const text = input.trim();
    setInput('');
    await sendMessage(activeId, text);
  };

  if (!activeConv) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-950 text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-4">🤖</div>
          <p>Select a conversation or start a new one to begin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-950 relative h-full">
      {/* Header */}
      <header className="h-14 shrink-0 border-b border-gray-200 dark:border-gray-800 flex items-center px-6 justify-between">
        <h2 className="font-semibold text-gray-800 dark:text-gray-200">{activeConv.title}</h2>
      </header>

      {/* Message List - Virtual Scrolling 虚拟长列表优化 */}
      <div 
        ref={parentRef}
        className="flex-1 overflow-y-auto p-4 pb-32"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const msg = messages[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement} // 动态测量 Markdown 实际高度
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                  paddingBottom: '24px' // 替代原先的 space-y-6
                }}
              >
                <div
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}
                >
                  <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                    <div
                      className={`rounded-2xl p-4 w-full ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none shadow-sm'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                      ) : (
                        msg.content ? <MarkdownBlock content={msg.content} /> : <span className="animate-pulse text-gray-500">Thinking...</span>
                      )}
                    </div>
                    {/* 用户消息的快捷操作栏 */}
                    {msg.role === 'user' && (
                      <div className="flex gap-3 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-400 dark:text-gray-500 px-1">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(msg.content);
                            setCopiedId(msg.id);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
                        >
                          {copiedId === msg.id ? '已复制 ✓' : '📋 复制'}
                        </button>
                        <button 
                          onClick={() => setInput(msg.content)}
                          className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
                        >
                          ✎ 修改重发
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-950 dark:via-gray-950 pt-10">
        <div className="max-w-4xl mx-auto flex gap-2 relative shadow-lg rounded-xl">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your prompt here... (Press Enter to stream response)"
            className="flex-1 resize-none overflow-hidden rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-4 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            rows={1}
            style={{ minHeight: '60px', maxHeight: '200px' }}
          />
          {isGenerating ? (
             <button
              onClick={stopGenerating}
              className="absolute right-3 bottom-3 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="absolute right-3 bottom-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
