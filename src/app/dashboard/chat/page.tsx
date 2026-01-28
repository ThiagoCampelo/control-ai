'use client';

import { useState, useEffect, FormEvent, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Send, Bot, User, AlertCircle, Plus, MessageSquare, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SUPPORTED_MODELS } from '@/utils/models';

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

// Retirado dqui: Modelo de metadados agora vem de @/utils/models


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
    const [isDemoUser, setIsDemoUser] = useState(false);
    const [tempApiKey, setTempApiKey] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
        loadSessions();
        loadAgents();
        loadAllowedModels();
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            const { createClient } = await import('@/utils/supabase/client');
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email === 'demo@control.ai') {
                setIsDemoUser(true);
            }
        } catch (err) {
            console.error(err);
        }
    }

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

    // Declaração da função deve estar dentro do componente
    const generateContextualTitle = async (sessionId: string, messages: Message[], modelName: string) => {
        try {
            const res = await fetch(`/api/chats/${sessionId}/title`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages, model: modelName }),
            });
            if (res.ok) {
                const data = await res.json();
                setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: data.title } : s));
            }
        } catch (err) {
            console.error('Error auto-generating title:', err);
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
        // Define message outside to be accessible in finally
        const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '',
        };

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
                    tempApiKey: isDemoUser ? tempApiKey : undefined,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Erro na requisição');
            }

            // Gera título contextual IMEDIATAMENTE (não espera o assistente terminar)
            // Isso faz com que a interface mude enquanto o usuário lê a resposta.
            if (sessionId && [...messages, userMessage].length === 1) {
                generateContextualTitle(sessionId, [userMessage], finalModel);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let assistantContent = '';

            assistantMessageId = assistantMessage.id;

            setMessages(prev => [...prev, assistantMessage]);

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    assistantContent += chunk;
                    assistantMessage.content = assistantContent; // Update local obj

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

    const sessionTitle = sessions.find(s => s.id === currentSessionId)?.title || 'Nova Conversa';

    return (
        <div className="flex h-[calc(100dvh-130px)] md:h-[calc(100vh-140px)] gap-4 overflow-hidden">
            {/* Sidebar (History) - Hidden on mobile, visible on desktop */}
            <div className="hidden md:flex w-64 flex-col bg-card rounded-xl border shrink-0 overflow-hidden shadow-sm">
                <div className="p-3 border-b bg-muted/30 space-y-3">
                    <Button onClick={handleNewChat} className="w-full shadow-sm" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Conversa
                    </Button>

                    {/* Volatile Key Input for Demo Users */}
                    {isDemoUser && (
                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                <AlertCircle className="w-3 h-3" />
                                <span className="text-[10px] font-bold uppercase tracking-wide">Modo Demo</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-tight">
                                O ambiente demo não possui créditos de IA. Insira sua chave pessoal (não será salva).
                            </p>
                            <Input
                                value={tempApiKey}
                                onChange={(e) => setTempApiKey(e.target.value)}
                                placeholder="sk-..."
                                className="h-7 text-xs bg-background/50 border-amber-500/20 focus-visible:ring-amber-500/50"
                                type="password"
                            />
                        </div>
                    )}
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
                {/* Header Modernizado */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b bg-background/80 backdrop-blur-md gap-4 sm:gap-0 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 shadow-sm">
                            <Bot className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold leading-tight flex items-center gap-2">
                                {sessionTitle}
                            </h2>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Encrypted End-to-End</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
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
                            <SelectTrigger className="h-9 min-w-[140px] bg-muted/30 border-muted-foreground/10 focus:ring-1 focus:ring-primary/20 text-xs font-medium">
                                <Bot className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Agente" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Conversa Livre</SelectItem>
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
                            <SelectTrigger className="h-9 min-w-[140px] bg-muted/30 border-muted-foreground/10 focus:ring-1 focus:ring-primary/20 text-xs font-medium">
                                <SelectValue placeholder="Modelo" />
                            </SelectTrigger>
                            <SelectContent>
                                {SUPPORTED_MODELS
                                    .filter((m) => allowedModels.includes(m.id) || allowedModels.length === 0)
                                    .map((m) => (
                                        <SelectItem key={m.id} value={m.id}>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-xs">{m.label}</span>
                                                {m.badge && (
                                                    <Badge variant={m.badgeVariant} className="text-[8px] uppercase px-1 py-0 h-4">
                                                        {m.badge}
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
