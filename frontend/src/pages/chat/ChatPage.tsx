import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Phone, Video, Info, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { apiGetMessages, apiSendMessage, apiGetConversations, apiMarkAsRead, API_ORIGIN, getToken } from '../../lib/api';

interface MessageData {
  _id: string;
  sender: { _id: string; name: string; avatarUrl?: string };
  receiver: { _id: string; name: string; avatarUrl?: string };
  content: string;
  createdAt: string;
  read: boolean;
}

interface Conversation {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: string;
  lastMessage: {
    _id: string;
    sender: string;
    receiver: string;
    content: string;
    createdAt: string;
  };
}

export const ChatPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (!currentUser) return;
    const socket = io(API_ORIGIN);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('chat:register', { userId: currentUser.id });
    });

    socket.on('chat:receive', (msg: MessageData) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('chat:sent', (msg: MessageData) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => { socket.disconnect(); };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    apiGetConversations()
      .then((res) => setConversations(res.data))
      .catch(() => {});
  }, [currentUser, messages]);

  useEffect(() => {
    if (!currentUser || !userId) { setLoading(false); return; }
    setLoading(true);
    setMessages([]);
    apiGetMessages(userId)
      .then((res) => { setMessages(res.data); setLoading(false); })
      .catch(() => { setLoading(false); });
    apiMarkAsRead(userId).catch(() => {});
  }, [currentUser, userId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !userId) return;
    const content = newMessage.trim();
    setNewMessage('');

    try {
      const res = await apiSendMessage(userId, content);
      const msg = res.data;
      socketRef.current?.emit('chat:send', { receiverId: userId, message: msg });
    } catch {
      toast.error('Failed to send message');
    }
  };

  const chatPartner = userId
    ? conversations.find((c) => c._id === userId)
    : null;

  if (!currentUser) return null;

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white border border-gray-200 rounded-lg overflow-hidden animate-fade-in">
      <div className="hidden md:block w-1/3 lg:w-1/4 border-r border-gray-200 overflow-y-auto">
        <div className="py-4">
          <h2 className="px-4 text-lg font-semibold text-gray-800 mb-4">Messages</h2>
          <div className="space-y-1">
            {conversations.length > 0 ? (
              conversations.map((conv) => {
                const isActive = userId === conv._id;
                return (
                  <div
                    key={conv._id}
                    className={`px-4 py-3 flex cursor-pointer transition-colors ${
                      isActive ? 'bg-primary-50 border-l-4 border-primary-600' : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                    onClick={() => navigate(`/chat/${conv._id}`)}
                  >
                    <Avatar
                      src={conv.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.name)}&background=random`}
                      alt={conv.name}
                      size="md"
                      className="mr-3 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{conv.name}</h3>
                        {conv.lastMessage && (
                          <span className="text-xs text-gray-500">{new Date(conv.lastMessage.createdAt).toLocaleDateString()}</span>
                        )}
                      </div>
                      {conv.lastMessage && (
                        <p className="text-xs text-gray-600 truncate mt-1">
                          {conv.lastMessage.sender === currentUser.id ? 'You: ' : ''}{conv.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center"><p className="text-sm text-gray-500">No conversations yet</p></div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {chatPartner || (userId && conversations.length === 0) ? (
          <>
            <div className="border-b border-gray-200 p-4 flex justify-between items-center">
              <div className="flex items-center">
                <Avatar
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(chatPartner?.name || 'User')}&background=random`}
                  alt={chatPartner?.name || 'User'}
                  size="md"
                  className="mr-3"
                />
                <div>
                  <h2 className="text-lg font-medium text-gray-900">{chatPartner?.name || 'User'}</h2>
                  <p className="text-sm text-gray-500">{chatPartner?.role || ''}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" className="rounded-full p-2"><Phone size={18} /></Button>
                <Button variant="ghost" size="sm" className="rounded-full p-2"><Video size={18} /></Button>
                <Button variant="ghost" size="sm" className="rounded-full p-2"><Info size={18} /></Button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {loading ? (
                <p className="text-center text-gray-500 py-10">Loading messages...</p>
              ) : messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isCurrentUser = msg.sender._id === currentUser.id;
                    return (
                      <div key={msg._id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
                        {!isCurrentUser && (
                          <Avatar
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender.name)}&background=random`}
                            alt={msg.sender.name}
                            size="sm"
                            className="mr-2 self-end"
                          />
                        )}
                        <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-xs sm:max-w-md px-4 py-2 rounded-lg ${isCurrentUser ? 'bg-primary-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                            <p className="text-sm">{msg.content}</p>
                          </div>
                          <span className="text-xs text-gray-500 mt-1">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="bg-gray-100 p-4 rounded-full mb-4"><MessageCircle size={32} className="text-gray-400" /></div>
                  <h3 className="text-lg font-medium text-gray-700">No messages yet</h3>
                  <p className="text-gray-500 mt-1">Send a message to start the conversation</p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Input type="text" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} fullWidth className="flex-1" />
                <Button type="submit" size="sm" disabled={!newMessage.trim()} className="rounded-full p-2 w-10 h-10 flex items-center justify-center">
                  <Send size={18} />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="bg-gray-100 p-6 rounded-full mb-4"><MessageCircle size={48} className="text-gray-400" /></div>
            <h2 className="text-xl font-medium text-gray-700">Select a conversation</h2>
            <p className="text-gray-500 mt-2 text-center">Choose a contact from the list to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};
