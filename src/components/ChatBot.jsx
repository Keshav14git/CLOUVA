import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, FileText, Loader, Sparkles, Paperclip, Mic, Clock, Plus, Trash2, StopCircle, Menu, X, ArrowUp, Brain, Copy, Check, MessageSquarePlus, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { motion, AnimatePresence } from 'framer-motion';



const ChatBot = () => {
  const { user } = useAuth();
  const { messages, addMessage, createNewChat, chats, loadChat, deleteChat, currentChatId } = useChat();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [mode, setMode] = useState('chat'); // 'chat' or 'search'
  const [copiedId, setCopiedId] = useState(null);
  const [selectionMenu, setSelectionMenu] = useState(null); // { x, y, text }
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setSelectionMenu(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Only show if selection is within the viewport (basic check)
      if (rect.width > 0 && rect.height > 0) {
        setSelectionMenu({
          x: rect.left + rect.width / 2,
          y: rect.top - 45, // Position above content
          text: selection.toString().trim()
        });
      }
    };

    document.addEventListener('mouseup', handleSelectionChange);
    // Also clear on keydown to dismiss if typing
    document.addEventListener('keydown', () => setSelectionMenu(null));

    return () => {
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('keydown', () => setSelectionMenu(null));
    };
  }, []);

  const handleQuoteAsk = (e) => {
    e.stopPropagation();
    if (selectionMenu && selectionMenu.text) {
      setInput((prev) => `"${selectionMenu.text}" ${prev}`);
      setSelectionMenu(null);
      window.getSelection().removeAllRanges();
      inputRef.current?.focus();
    }
  };

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatMessage = (content) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    addMessage(userMessage);
    setInput('');
    setLoading(true);

    try {
      const { databases, DATABASE_ID, COLLECTION_FILES } = await import('../lib/appwrite');
      const { Query } = await import('appwrite');
      const { chatWithGroq } = await import('../lib/groq');
      const { generateEmbedding, cosineSimilarity } = await import('../lib/semantic');

      // 1. Get User Query Embedding
      const queryEmbedding = await generateEmbedding(userMessage.content);

      if (!queryEmbedding) {
        console.error('[Smart Search] Failed to generate query embedding. Fallback?');
        throw new Error('Could not understand the query context (Embedding Failed).');
      }

      // 2. Fetch Files (Limit 100 for client-side search)
      // We'll fetch documents. 
      let files = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_FILES,
        [Query.orderDesc('$createdAt'), Query.limit(100)]
      );

      // 3. Score Files (Hybrid: Vector + Keyword)
      console.log(`[Smart Search] Scoring ${files.documents.length} files...`);
      const searchTerms = userMessage.content.toLowerCase().split(/\s+/).filter(t => t.length > 2); // Simple tokens > 2 chars

      const scoredFiles = files.documents.map(file => {
        let score = 0;
        let vectorScore = 0;
        let keywordBoost = 0;

        // A. Vector Score
        if (file.embedding) {
          try {
            const fileVector = JSON.parse(file.embedding);
            vectorScore = cosineSimilarity(queryEmbedding, fileVector);
          } catch (e) {
            console.error(`[Smart Search] Error parsing embedding for "${file.name}":`, e);
          }
        }

        // B. Keyword Boost (The Fix for long files)
        if (file.extractedText) {
          const textLower = file.extractedText.toLowerCase();
          searchTerms.forEach(term => {
            if (textLower.includes(term)) {
              keywordBoost += 0.15; // meaningful boost per term
            }
          });
          // Cap boost so a single word doesn't fake a perfect match, but enough to pass threshold (0.15)
          keywordBoost = Math.min(keywordBoost, 0.45);
        }

        score = vectorScore + keywordBoost;
        // console.log(`[Smart Search] "${file.name}" | Vector: ${vectorScore.toFixed(3)} | Boost: ${keywordBoost.toFixed(3)} | Final: ${score.toFixed(3)}`);

        return { ...file, score, vectorScore, keywordBoost };
      });

      // 4. Sort and Pick Top Results (Top 5 for finder, Top 3 for context)
      scoredFiles.sort((a, b) => b.score - a.score);
      const topCount = mode === 'search' ? 5 : 3;
      const topFiles = scoredFiles.slice(0, topCount);

      console.log('[Smart Search] Top Results:', topFiles.map(f => `${f.name} (${f.score.toFixed(4)})`));

      // --- BRANCH: SEARCH MODE (FINDER) ---
      if (mode === 'search') {
        // Construct a direct answer list
        const relevantFiles = topFiles.filter(f => f.score > 0.15); // Threshold
        let responseContent = "";

        if (relevantFiles.length > 0) {
          responseContent = `I found **${relevantFiles.length}** relevant files for "${userMessage.content}":\n\n`;
          relevantFiles.forEach((file, idx) => {
            const relevance = (file.score * 100).toFixed(0);
            responseContent += `**${idx + 1}. ${file.name}** (${relevance}% match)\n`;
            // Add a tiny snippet if available
            if (file.extractedText) {
              const snippet = file.extractedText.slice(0, 150).replace(/\n/g, ' ') + '...';
              responseContent += `> *"${snippet}"*\n\n`;
            }
          });
        } else {
          responseContent = `I couldn't find any documents relevant to "${userMessage.content}". Try using different keywords.`;
        }

        // Return immediately, skipping Groq
        addMessage({
          role: 'assistant',
          content: responseContent,
          sources: relevantFiles.map(f => ({ name: f.name, page: 1, score: f.score })),
          isNew: true
        });
        setLoading(false);
        return;
      }

      // --- BRANCH: CHAT MODE (ANALYST) ---
      // Continue with Context + Groq Generation...
      let context = "";
      const sources = [];

      topFiles.forEach(file => {
        if (file.score > 0.15) { // Lowered threshold slightly
          const snippet = file.extractedText ? file.extractedText.substring(0, 8000) : "";
          context += `\n--- File: ${file.name} (Relevance: ${(file.score * 100).toFixed(1)}%) ---\n${snippet}\n`;
          sources.push({ name: file.name, page: 1, score: file.score });
        }
      });

      const systemPrompt = `You are CLOUVA, The Analyst.
      Your goal is to answer the user's question based ONLY on the provided context.
      
      Instructions:
      1. Synthesize the information from the context files.
      2. ALWAYS ANSWER IN ENGLISH. Do not use any other language.
      3. If the answer is in the context, provide a clear, natural language response.
      4. If the answer is NOT in the context, politely say you don't know based on the available files.
      5. Do not mention "File 1" or specific pages unless necessary for citation.
      6. Be helpful, professional, and concise.
      7. AT THE VERY END of your response, STRICTLY append a list of the exact filenames used, in this format: "SOURCES: [filename1, filename2]".
      8. If no files were used, output "SOURCES: []".`;

      const fullUserMessage = `Context:
      ${context || "No relevant files found."}
      
      User Question: ${userMessage.content}`;

      const rawText = await chatWithGroq(systemPrompt, fullUserMessage);

      // Parse Sources
      let text = rawText;
      let usedSources = [];
      const sourceMatch = rawText.match(/SOURCES: \[(.*?)\]/);

      if (sourceMatch) {
        const sourceString = sourceMatch[1];
        const filesUsed = sourceString.split(',').map(s => s.trim().replace(/['"]+/g, ''));

        // Filter the original sources array based on what the AI said it used
        usedSources = sources.filter(s => filesUsed.includes(s.name));

        // Remove the SOURCES line from the display text
        text = rawText.replace(/SOURCES: \[.*?\]/, '').trim();
      } else {
        // Fallback: if AI didn't follow format, assume no specific sources were critical or all provided context was used loosely.
        // For strictness, default to empty if not explicit.
        usedSources = [];
      }

      addMessage({
        role: 'assistant',
        content: text,
        sources: usedSources,
        isNew: true
      });

    } catch (error) {
      console.error('Chat error:', error);
      addMessage({ role: 'assistant', content: `Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    createNewChat();
    if (window.innerWidth < 768) setShowHistory(false);
  };

  return (
    <div className="flex h-full overflow-hidden relative bg-surface">

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHistory(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* History Sidebar */}
      <motion.div
        initial={false}
        animate={{
          width: showHistory ? 280 : 0,
          opacity: showHistory ? 1 : 0
        }}
        className={`fixed md:relative inset-y-0 left-0 bg-white border-r border-border z-40 flex flex-col overflow-hidden transition-all duration-300 shadow-xl md:shadow-none ${!showHistory && 'pointer-events-none'}`}
      >
        <div className="p-4 flex items-center justify-between border-b border-border/50">
          <h3 className="font-semibold text-zinc-900 pl-2">History</h3>
          <button onClick={() => setShowHistory(false)} className="md:hidden p-2 text-zinc-500 hover:text-black">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 p-3 bg-black text-white rounded-lg hover:bg-zinc-800 transition-all shadow-sm justify-center font-medium"
          >
            <Plus size={18} />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          {chats.map(chat => (
            <div
              key={chat.id}
              onClick={() => { loadChat(chat.id); if (window.innerWidth < 768) setShowHistory(false); }}
              className={`p-3 rounded-md cursor-pointer flex justify-between items-center group transition-colors ${currentChatId === chat.id ? 'bg-zinc-100 text-black font-medium' : 'text-zinc-600 hover:bg-zinc-50 hover:text-black'}`}
            >
              <p className="truncate text-sm flex-1">{chat.title}</p>
              <button
                onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 p-1 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </motion.div>


      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative w-full h-full bg-white md:bg-surface">

        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 md:px-8 bg-white border-b border-border z-10 sticky top-0 shadow-sm md:shadow-none">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-md hover:bg-zinc-100 transition-colors ${showHistory ? 'text-black' : 'text-zinc-500'}`}
            >
              <Menu size={20} />
            </button>
            <span className="text-zinc-900 font-semibold text-sm flex items-center gap-2">
              {currentChatId ? chats.find(c => c.id === currentChatId)?.title : 'Assistant'}
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-bold border border-primary/20">BETA</span>
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 md:px-0 py-6 scroll-smooth">
          <div className="max-w-6xl mx-auto w-full space-y-6 pb-32 px-6 md:px-8">
            {(messages.length === 0) ? (
              <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6 px-4">
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center">
                  <img src="/c2.png" className="w-8 h-8 object-contain" alt="Clouva" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-900">How can I help you today?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl">
                  {["Summarize this document", "Create a quiz", "Explain key concepts"].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(suggestion)}
                      className="p-4 text-left bg-white border border-border rounded-xl hover:border-zinc-300 hover:shadow-sm transition-all group"
                    >
                      <p className="text-zinc-600 text-sm group-hover:text-black font-medium">{suggestion}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 group ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm ${msg.role === 'assistant'
                    ? 'bg-white border border-border'
                    : 'bg-black'
                    }`}>
                    {msg.role === 'assistant' ? <img src="/c2.png" className="w-5 h-5 object-contain" alt="AI" /> : <User size={16} className="text-white" />}
                  </div>

                  <div className={`flex flex-col gap-1 max-w-[85%] lg:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`py-3 px-5 rounded-2xl text-sm leading-relaxed shadow-sm overflow-hidden ${msg.role === 'assistant'
                      ? 'bg-white border border-border text-zinc-800'
                      : 'bg-black text-white'
                      }`}>
                      <div className="whitespace-pre-wrap break-words">
                        {formatMessage(msg.content)}
                      </div>
                    </div>

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {msg.sources.map((source, i) => (
                          <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-border rounded-md text-xs text-zinc-500 hover:text-primary hover:border-primary/30 transition-colors cursor-pointer shadow-sm">
                            <FileText size={12} />
                            <span>{source.name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Copy Button */}
                    <div className={`mt-1 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                      <button
                        onClick={() => copyToClipboard(msg.content, index)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-md transition-colors flex items-center gap-1.5"
                        title="Copy to clipboard"
                      >
                        {copiedId === index ? (
                          <>
                            <Check size={14} className="text-emerald-500" />
                            <span className="text-xs text-emerald-500 font-medium">Copied</span>
                          </>
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
            {loading && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center flex-shrink-0">
                  <img src="/c2.png" className="w-5 h-5 object-contain animate-pulse" alt="Thinking..." />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/80 to-transparent md:from-surface md:via-surface/80">
          <div className="max-w-6xl mx-auto w-full">
            <form onSubmit={handleSend} className="relative bg-white rounded-full border border-border shadow-lg hover:shadow-xl transition-shadow focus-within:ring-2 focus-within:ring-primary/20">
              <div className="flex items-center px-2 py-2 pl-4">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={mode === 'search' ? "Search for files..." : "Message Clouva..."}
                  className="flex-1 bg-transparent border-none focus:ring-0 focus:border-none focus:outline-none focus-visible:ring-0 focus-visible:border-none focus-visible:outline-none !outline-none !border-none !ring-0 !shadow-none text-zinc-900 placeholder-zinc-400 caret-primary text-sm font-medium py-3"
                  disabled={loading}
                />
                {/* Mode Toggle */}
                <div className="flex items-center gap-1 mr-2 bg-primary p-1 rounded-full">
                  <button
                    type="button"
                    onClick={() => setMode('chat')}
                    className={`p-1.5 rounded-full transition-all ${mode === 'chat' ? 'bg-white shadow-sm text-primary' : 'text-white/60 hover:text-white'}`}
                    title="Analyst Mode"
                  >
                    <Bot size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('search')}
                    className={`p-1.5 rounded-full transition-all ${mode === 'search' ? 'bg-white shadow-sm text-primary' : 'text-white/60 hover:text-white'}`}
                    title="Finder Mode"
                  >
                    <Search size={16} />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className={`p-2.5 rounded-full transition-all duration-200 ${input.trim() ? 'bg-primary text-white hover:bg-rose-700' : 'bg-zinc-100 text-zinc-300'}`}
                >
                  <ArrowUp size={18} strokeWidth={input.trim() ? 2.5 : 2} />
                </button>
              </div>
            </form>
            <p className="text-center text-[10px] text-zinc-400 mt-3 font-medium">
              Clouva can make mistakes. Verify important info.
            </p>
          </div>
        </div>

      </div>

      {/* Selection Popup - Quote & Ask */}
      <AnimatePresence>
        {selectionMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="fixed z-50 transform -translate-x-1/2"
            style={{ left: selectionMenu.x, top: selectionMenu.y }}
          >
            <button
              onClick={handleQuoteAsk}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 text-white rounded-full shadow-xl hover:bg-black transition-colors text-xs font-bold"
            >
              <MessageSquarePlus size={14} className="text-primary" />
              Ask Clouva
            </button>
            {/* Arrow */}
            <div className="absolute left-1/2 bottom-[-4px] -translate-x-1/2 w-2 h-2 bg-zinc-900 rotate-45"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
};

export default ChatBot;
