'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, isTextUIPart } from 'ai';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Loader2, Send, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { useVenue } from '@/lib/venue-context';

function normalizeUiErrorMessage(error: Error): string {
    const raw = error.message || 'Terjadi kesalahan pada layanan AI.';

    try {
        const parsed = JSON.parse(raw) as {
            error?: { message?: string; code?: string; type?: string };
            message?: string;
            code?: string;
            type?: string;
        };
        const code = parsed.error?.code ?? parsed.code;
        const type = parsed.error?.type ?? parsed.type;

        if (code === 'insufficient_quota' || type === 'insufficient_quota') {
            return 'Kuota AI provider habis. Cek billing API key atau ganti provider AI.';
        }

        return parsed.error?.message ?? parsed.message ?? raw;
    } catch {
        if (raw.includes('insufficient_quota')) {
            return 'Kuota AI provider habis. Cek billing API key atau ganti provider AI.';
        }

        return raw;
    }
}

export function AIAssistant() {
    const { currentVenueId } = useVenue();
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const chatId = currentVenueId ? `ai-assistant-${currentVenueId}` : 'ai-assistant';

    const transport = useMemo(
        () =>
            new DefaultChatTransport({
                api: '/api/chat',
                body: {
                    venueId: currentVenueId,
                },
            }),
        [currentVenueId]
    );

    const { messages, sendMessage, status } = useChat({
        id: chatId,
        transport,
        onError: (error) => {
            toast.error(`AI Error: ${normalizeUiErrorMessage(error)}`);
        },
    });

    const isLoading = status === 'submitted' || status === 'streaming';
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const getMessageText = (message: (typeof messages)[number]) => {
        const text = message.parts
            .filter(isTextUIPart)
            .map((part) => part.text)
            .join('\n')
            .trim();

        return text;
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const message = inputValue.trim();
        if (!message) return;

        setInputValue('');

        try {
            await sendMessage({ text: message });
        } catch {
            // onError handles user-facing feedback
        }
    };

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    if (!currentVenueId) return null;

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 ${isOpen ? 'bg-red-500 rotate-90' : 'bg-black text-white border-2 border-white'
                    }`}
            >
                {isOpen ? (
                    <X size={24} className="text-white" />
                ) : (
                    <div className="relative">
                        <Sparkles size={24} className="animate-pulse" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                        </span>
                    </div>
                )}
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-[90vw] md:w-[400px] h-[500px] bg-white border-2 border-black rounded-xl shadow-neo flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-200">
                    <div className="bg-black text-white p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Bot size={20} />
                            <h3 className="font-bold uppercase tracking-wider text-sm">AI Operation Assistant</h3>
                        </div>
                        {isLoading && <Loader2 size={16} className="animate-spin" />}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
                        {messages.length === 0 && (
                            <div className="text-center text-gray-500 mt-10 text-sm">
                                <p>Hi! I can help you check availability or add bookings.</p>
                                <p className="mt-2 text-xs italic">Try &quot;Check availability for today&quot; or &quot;Book Court 1 at 10am&quot;</p>
                            </div>
                        )}

                        {messages.map((message) => {
                            const content = getMessageText(message);

                            return (
                                <div
                                    key={message.id}
                                    className={`flex w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'
                                        }`}
                                >
                                    <div
                                        className={`max-w-[80%] p-3 text-sm rounded-xl ${message.role === 'user'
                                            ? 'bg-black text-white rounded-br-none'
                                            : 'bg-white border text-black border-gray-200 shadow-sm rounded-bl-none prose prose-sm'
                                            }`}
                                    >
                                        {content || (message.role === 'assistant' ? 'Sedang memproses...' : '[Pesan kosong]')}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleFormSubmit} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                        <input
                            className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors text-sm"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type a command..."
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !inputValue.trim()}
                            className="bg-black text-white p-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
