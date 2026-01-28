'use client';

import { useState, useEffect, FormEvent, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Send, Bot, User, AlertCircle, Plus, MessageSquare, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

interface Agent {
    id: string;
    name: string;
    model: string;
    prompt_system: string;
}

interface ChatSession {
    id: string;
    title: string;
    model: string;
    agent_id?: string;
    updated_at: string;
}

const MODEL_DETAILS: Record<
    string,
    { label: string; badge?: string; badgeVariant?: "default" | "secondary" | "outline" | "destructive" }
> = {
    /** -------- OpenAI -------- */
    'openai:gpt-4o': {
        label: 'GPT-4o',
        badge: 'Flagship',
        badgeVariant: 'default',
    },
    'openai:gpt-4o-mini': {
        label: 'GPT-4o Mini',
        badge: 'Fast & Cheap',
        badgeVariant: 'outline',
    },
    'openai:gpt-4.1': {
        label: 'GPT-4.1',
        badge: 'Strong Reasoning',
        badgeVariant: 'secondary',
    },
    'openai:gpt-4.1-mini': {
        label: 'GPT-4.1 Mini',
        badge: 'Balanced',
        badgeVariant: 'outline',
    },

    /** -------- Anthropic -------- */
    'anthropic:opus': {
        label: 'Claude 3 Opus',
        badge: 'Top Quality',
        badgeVariant: 'default',
    },
    'anthropic:sonnet': {
        label: 'Claude 3.5 Sonnet',
        badge: 'Best Cost/Quality',
        badgeVariant: 'secondary',
    },
    'anthropic:haiku': {
        label: 'Claude 3.5 Haiku',
        badge: 'Ultra Fast',
        badgeVariant: 'outline',
    },
};


/**
 * Página Principal do Chat.
 * Gerencia sessões, seleção de modelos/agentes e o fluxo de mensagens.
 * Utiliza Streaming para respostas em tempo real.
 */
export default function ChatPage() {
    const [model, setModel] = useState('openai:gpt-4o');
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgentId, setSelectedAgentId] = useState<string | 'none'>('none');
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [allowedModels, setAllowedModels] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
        loadSessions();
        loadAgents();
        loadAllowedModels();
    }, []);

    // Efeito para evitar seleção vazia se o modelo atual não for permitido
    // Garante que o usuário sempre tenha um modelo válido selecionado.
    useEffect(() => {
        if (allowedModels.length > 0 && !allowedModels.includes(model)) {
            setModel(allowedModels[0]);
        }
    }, [allowedModels]);

    const loadAllowedModels = async () => {
        try {
            const res = await fetch('/api/models');
            if (res.ok) {
                const data = await res.json();
                setAllowedModels(data.allowedModels || []);
            }
        } catch (err) {
            console.error('Erro ao carregar modelos permitidos:', err);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadAgents = async () => {
        try {
            const res = await fetch('/api/agents');
            if (res.ok) {
                const data = await res.json();
                setAgents(data);

                // Seleção Automática de Agente
                // Melhora a UX pré-selecionando o primeiro agente disponível se o usuário ainda não escolheu um.
                if (data.length > 0 && selectedAgentId === 'none') {
                    setSelectedAgentId(data[0].id);
                    setModel(data[0].model);
                }
            }
        } catch (err) {
            console.error('Erro ao carregar agentes:', err);
        }
    };

    // Carrega o histórico de sessões do usuário
    const loadSessions = async () => {
        try {
            const res = await fetch('/api/chats');
            if (res.ok) {
                const data = await res.json();
                setSessions(data);
            }
        } catch (err) {
            console.error('Erro ao carregar sessões:', err);
        } finally {
            setLoadingSessions(false);
        }
    };

    /**
     * Reseta a view para iniciar um novo fluxo de conversa.
     * Limpa o histórico de mensagens e seleção atual.
     */
    const handleNewChat = () => {
        setCurrentSessionId(null);
        setMessages([]);
        setInput('');
        setIsLoading(false);
        setSelectedAgentId('none');
        setError(null);
        if (allowedModels.length > 0 && !allowedModels.includes(model)) {
            setModel(allowedModels[0]);
        }
    };

    const loadSession = async (sessionId: string) => {
        try {
            const res = await fetch(`/api/chats/${sessionId}`);
            if (res.ok) {
                const data = await res.json();
                setCurrentSessionId(sessionId);
                setModel(data.model);
                setSelectedAgentId(data.agent_id || 'none');
                setMessages(data.messages.map((m: any) => ({
                    id: m.id,
                    role: m.role,
                    content: m.content,
                })));
                setError(null);
            }
        } catch (err) {
            console.error('Erro ao carregar sessão:', err);
        }
    };

    const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const res = await fetch(`/api/chats/${sessionId}`, { method: 'DELETE' });
            if (res.ok) {
                setSessions(prev => prev.filter(s => s.id !== sessionId));
                if (currentSessionId === sessionId) {
                    setCurrentSessionId(null);
                    setMessages([]);
                    setSelectedAgentId('none');
                }
            }
        } catch (err) {
            console.error('Erro ao deletar sessão:', err);
        }
    };

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        let sessionId = currentSessionId;
        let finalModel = model;

        if (selectedAgentId !== 'none') {
            const agent = agents.find(a => a.id === selectedAgentId);
            if (agent) finalModel = agent.model;
        }

        if (!sessionId) {
            try {
                const res = await fetch('/api/chats', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: finalModel,
                        agentId: selectedAgentId === 'none' ? null : selectedAgentId
                    }),
                });

                if (res.ok) {
                    const session = await res.json();
                    sessionId = session.id;
                    setCurrentSessionId(session.id);
                    setSessions(prev => [session, ...prev]);
                }
            } catch (err) {
                setError('Erro ao criar sessão');
                return;
            }
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        let assistantMessageId: string | null = null;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                    model: finalModel,
                    sessionId,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Erro na requisição');
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let assistantContent = '';

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '',
            };
            assistantMessageId = assistantMessage.id;

            setMessages(prev => [...prev, assistantMessage]);

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    assistantContent += chunk;

                    setMessages(prev =>
                        prev.map(m =>
                            m.id === assistantMessage.id
                                ? { ...m, content: assistantContent }
                                : m
                        )
                    );
                }
            }
            loadSessions();
        } catch (err: any) {
            const errorMessage = err.message || 'Erro ao enviar mensagem';
            setError(errorMessage);

            if (assistantMessageId) {
                setMessages(prev => prev.map(m =>
                    m.id === assistantMessageId
                        ? { ...m, content: `🛑 **Erro:** ${errorMessage}` }
                        : m
                ));
            } else {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `🛑 **Erro:** ${errorMessage}`
                }]);
            }
        } finally {
            setIsLoading(false);
            if (sessionId) {
                loadSession(sessionId);
            }
        }
    };

    if (!mounted) {
        return (
            <div className="flex h-full items-center justify-center">
                <Bot className="w-12 h-12 opacity-20 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-140px)] gap-4 overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 flex flex-col bg-card rounded-xl border shrink-0 overflow-hidden shadow-sm">
                <div className="p-3 border-b bg-muted/30">
                    <Button onClick={handleNewChat} className="w-full shadow-sm" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Conversa
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {loadingSessions ? (
                        <div className="text-center py-4 text-xs text-muted-foreground italic">Carregando histórico...</div>
                    ) : (
                        sessions.map((session) => (
                            <div
                                key={session.id}
                                onClick={() => loadSession(session.id)}
                                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer group transition-all duration-200 ${currentSessionId === session.id
                                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                                    : 'hover:bg-muted text-muted-foreground hover:text-foreground border border-transparent'
                                    }`}
                            >
                                <MessageSquare className="w-4 h-4 shrink-0" />
                                <span className="flex-1 text-sm truncate font-medium">{session.title}</span>
                                <button
                                    onClick={(e) => deleteSession(session.id, e)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-card rounded-xl border shadow-sm overflow-hidden h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-muted/10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold leading-none">Chat Seguro</h2>
                            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-bold">Encrypted End-to-End</p>
                        </div>
                    </div>

                    <div className="flex items-center -space-x-px drop-shadow-sm">
                        <Select
                            value={selectedAgentId}
                            onValueChange={(val) => {
                                setSelectedAgentId(val);
                                if (val !== 'none') {
                                    const agent = agents.find(a => a.id === val);
                                    if (agent) setModel(agent.model);
                                }
                            }}
                            disabled={!!currentSessionId}
                        >
                            <SelectTrigger className="h-9 w-[180px] sm:w-[220px] rounded-r-none bg-background focus:ring-1 focus:ring-primary focus:z-10 border-r-0">
                                <Bot className="w-3.5 h-3.5 mr-2 text-primary" />
                                <SelectValue placeholder="Escolher Agente" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Conversa Livre (Sem Agente)</SelectItem>
                                {agents.map((agent) => (
                                    <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={model}
                            onValueChange={setModel}
                            disabled={selectedAgentId !== 'none' || !!currentSessionId}
                        >
                            <SelectTrigger className="h-9 w-[180px] sm:w-[220px] rounded-l-none bg-background focus:ring-1 focus:ring-primary focus:z-10 -ml-px">
                                <SelectValue placeholder="Modelo" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(MODEL_DETAILS)
                                    .filter(([id]) => allowedModels.includes(id) || allowedModels.length === 0)
                                    .map(([id, details]) => (
                                        <SelectItem key={id} value={id}>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm">{details.label}</span>
                                                {details.badge && (
                                                    <Badge variant={details.badgeVariant} className="text-[8px] uppercase px-1.5 py-0 font-black">
                                                        {details.badge}
                                                    </Badge>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Messages */}
                <div className={`flex-1 overflow-y-auto p-4 space-y-6 bg-muted/5 custom-scrollbar ${messages.length === 0 ? 'overflow-hidden' : ''}`}>
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 gap-4">
                            <Bot className="w-16 h-16 stroke-1" />
                            <div className="text-center space-y-1">
                                <p className="font-bold text-lg text-muted-foreground/60">Nova Conversa Segura</p>
                                <p className="text-xs">Mande um oi para começar seu fluxo agêntico.</p>
                            </div>
                        </div>
                    ) : (
                        messages.filter(m => m.content && m.content.trim() !== '').map((m, i) => {
                            const isError = m.content.startsWith('🛑');
                            return (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                                    <div className={`max-w-[80%] flex flex-col gap-2 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${m.role === 'user'
                                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                                            : isError
                                                ? 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-tl-none'
                                                : 'bg-card border border-border/50 rounded-tl-none prose prose-sm dark:prose-invert max-w-none'
                                            }`}>
                                            {m.role === 'user' ? (
                                                <div className="whitespace-pre-wrap">{m.content}</div>
                                            ) : (
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        code({ node, inline, className, children, ...props }: any) {
                                                            return !inline ? (
                                                                <div className="relative my-4 rounded-lg bg-muted p-4 font-mono text-xs overflow-x-auto border border-border/50">
                                                                    <code {...props} className={className}>
                                                                        {children}
                                                                    </code>
                                                                </div>
                                                            ) : (
                                                                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold" {...props}>
                                                                    {children}
                                                                </code>
                                                            )
                                                        }
                                                    }}
                                                >
                                                    {m.content}
                                                </ReactMarkdown>
                                            )}
                                        </div>
                                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-30">
                                            {m.role === 'user' ? 'Você' : 'Assistente ControlAI'}
                                        </span>
                                    </div>
                                </div>
                            )
                        })
                    )}
                    {isLoading && (
                        <div className="flex items-center gap-3 animate-pulse italic text-xs text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            Processando resposta...
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Status/Error */}
                {error && (
                    <div className="px-4 py-3 bg-destructive/10 text-destructive text-sm font-bold border-t border-destructive/20 flex items-center gap-2 animate-in slide-in-from-bottom-2">
                        <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                )}

                {/* Input Area */}
                <div className="p-4 border-t bg-background">
                    <form onSubmit={onSubmit} className="flex gap-2 relative">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Mande uma mensagem segura..."
                            className="pr-12 h-12 rounded-xl focus-visible:ring-primary border-muted-foreground/20 shadow-inner"
                            disabled={isLoading}
                        />
                        <Button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            size="icon"
                            className="absolute right-1 top-1 h-10 w-10 rounded-lg shadow-lg hover:scale-105 transition-transform"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                    <p className="text-[9px] text-center text-muted-foreground/50 mt-2 font-medium">
                        ControlAI v2.0 - Tecnologia de vanguarda protegida por criptografia AES-256
                    </p>
                </div>
            </div>
        </div>
    );
}
