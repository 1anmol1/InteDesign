import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPaperPlane, FaRobot, FaUser } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../constants';

const ChatInterface = () => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! I am InteDesign AI. How can I assist you with your architectural vision today?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/api/chat`, { prompt: input });
            const aiMessage = { role: 'assistant', content: response.data.text };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please check if the server is running and the API key is configured.' }]);
        } finally {
            setLoading(false);
        }
    };

    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-10 right-10 z-50 flex flex-col items-end gap-4">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className="w-96 h-[500px] flex flex-col bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl overflow-hidden text-white font-sans"
                    >
                        <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FaRobot className="text-cyan-400 text-xl" />
                                <h2 className="text-lg font-semibold tracking-wide">InteDesign Assistant</h2>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition-colors">
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                            {messages.map((msg, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`p-2 rounded-full ${msg.role === 'user' ? 'bg-purple-500/20' : 'bg-cyan-500/20'}`}>
                                        {msg.role === 'user' ? <FaUser className="text-sm" /> : <FaRobot className="text-sm" />}
                                    </div>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-purple-600/30 rounded-tr-none text-purple-100'
                                        : 'bg-white/10 rounded-tl-none text-gray-200'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}
                            {loading && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 p-4">
                                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-100" />
                                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-200" />
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 bg-white/5 border-t border-white/10 flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about architecture..."
                                className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400/50 transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="p-2 bg-cyan-600/80 hover:bg-cyan-500 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FaPaperPlane className="text-white text-sm" />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg hover:shadow-cyan-500/50 transition-shadow"
            >
                {isOpen ? (
                    <span className="text-2xl font-bold">✕</span>
                ) : (
                    <FaRobot className="text-2xl text-white" />
                )}
            </motion.button>
        </div>
    );
};

export default ChatInterface;
