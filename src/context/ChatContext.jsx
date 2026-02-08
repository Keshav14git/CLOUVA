import React, { createContext, useContext, useState, useEffect } from 'react';
import { ID } from 'appwrite';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const [chats, setChats] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(null);
    const [messages, setMessages] = useState([]); // Messages for the CURRENT chat
    const chatIdRef = React.useRef(currentChatId);

    useEffect(() => {
        chatIdRef.current = currentChatId;
    }, [currentChatId]);

    // Load chats from LocalStorage on mount
    useEffect(() => {
        const savedChats = localStorage.getItem('clouva_chats');
        if (savedChats) {
            const parsed = JSON.parse(savedChats);
            setChats(parsed);
            if (parsed.length > 0) {
                // Automatically load the most recent chat or create new?
                // Let's explicitly NOT load one until user selects or we start new
                // Actually, UX is better if we start fresh or last one.
                // For now, let's start fresh unless they pick one.
            }
        }
    }, []);

    // Save chats to LocalStorage whenever they change
    useEffect(() => {
        localStorage.setItem('clouva_chats', JSON.stringify(chats));
    }, [chats]);

    // Update specific chat in the list when active messages change
    useEffect(() => {
        if (!currentChatId) return;

        setChats(prevChats => prevChats.map(chat => {
            if (chat.id === currentChatId) {
                // Update snippet from last message
                const lastMsg = messages[messages.length - 1];
                // Update Title if it's "New Conversation" and we have a user message
                let newTitle = chat.title;
                if (chat.title === 'New Conversation' && messages.length > 0) {
                    const firstUserMsg = messages.find(m => m.role === 'user');
                    if (firstUserMsg) {
                        newTitle = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '');
                    }
                }

                return {
                    ...chat,
                    messages: messages,
                    updatedAt: new Date().toISOString(),
                    title: newTitle
                };
            }
            return chat;
        }));
    }, [messages, currentChatId]);

    const createNewChat = () => {
        const newId = ID.unique();
        const newChat = {
            id: newId,
            title: 'New Conversation',
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        setChats(prev => [newChat, ...prev]);
        setCurrentChatId(newId);
        setMessages([]);
    };

    const loadChat = (chatId) => {
        const chat = chats.find(c => c.id === chatId);
        if (chat) {
            setCurrentChatId(chatId);
            setMessages(chat.messages || []);
        }
    };

    const deleteChat = (chatId) => {
        setChats(prev => prev.filter(c => c.id !== chatId));
        if (currentChatId === chatId) {
            setCurrentChatId(null);
            setMessages([]);
        }
    };

    const addMessage = (message) => {
        // If no chat is active, create one first
        if (!chatIdRef.current) {
            const newId = ID.unique();
            const newChat = {
                id: newId,
                title: message.role === 'user' ? message.content.slice(0, 30) + '...' : 'New Conversation',
                messages: [message],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            setChats(prev => [newChat, ...prev]);
            setCurrentChatId(newId);
            setMessages([message]);
        } else {
            setMessages(prev => [...prev, message]);
        }
    };

    return (
        <ChatContext.Provider value={{
            chats,
            currentChatId,
            messages,
            createNewChat,
            loadChat,
            deleteChat,
            addMessage,
            setMessages // Exposed for typing updates
        }}>
            {children}
        </ChatContext.Provider>
    );
};
