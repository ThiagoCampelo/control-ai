'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Loader2, Pencil } from "lucide-react"
import { upsertAgent } from "@/app/dashboard/agents/actions"
import { SUPPORTED_MODELS, getModelDetails } from "@/utils/models"

interface AgentProps {
    id: string
    name: string
    prompt_system: string
    model: string
}

interface AgentDialogProps {
    /** Agente existente para edição (opcional). Se omitido, modo criação. */
    agent?: AgentProps
    /** Lista de modelos permitidos pelo plano da empresa. */
    allowedModels: string[]
}

// MODELS_METADATA agora vem de @/utils/models

/**
 * Modal para criação e edição de Agentes de IA.
 * Gerencia o formulário e submissão via Server Action.
 */
export function AgentDialog({ agent, allowedModels }: AgentDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setMessage(null)

        if (agent?.id) {
            formData.append('id', agent.id)
        }

        const result = await upsertAgent(formData)

        setLoading(false)
        if (result.error) {
            setMessage(`Erro: ${result.error}`)
        } else {
            setMessage("Sucesso!")
            setTimeout(() => setOpen(false), 1000)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {agent ? (
                    <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                ) : (
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Novo Agente
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{agent ? 'Editar Agente' : 'Criar Novo Agente'}</DialogTitle>
                    <DialogDescription>
                        Defina a personalidade e o conhecimento base deste agente IA.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nome</Label>
                        <Input id="name" name="name" defaultValue={agent?.name} placeholder="Ex: Suporte Nível 1" className="col-span-3" required />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="model" className="text-right">Modelo</Label>
                        <Select name="model" defaultValue={agent?.model || allowedModels[0]}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                {allowedModels.map(m => {
                                    const details = getModelDetails(m);
                                    return (
                                        <SelectItem key={m} value={m}>
                                            <div className="flex items-center justify-between gap-2 w-full min-w-[180px]">
                                                <span>{details?.label || m}</span>
                                                {details?.badge && (
                                                    <Badge variant={details.badgeVariant} className="text-[10px] uppercase px-1.5 py-0">
                                                        {details.badge}
                                                    </Badge>
                                                )}
                                            </div>
                                        </SelectItem>
                                    )
                                })}
                                {SUPPORTED_MODELS.filter(m => !allowedModels.includes(m.id)).map(m => (
                                    <SelectItem key={m.id} value={m.id} disabled>
                                        <div className="flex items-center justify-between gap-2 w-full min-w-[180px] opacity-50">
                                            <span>{m.label}</span>
                                            <Badge variant="outline" className="text-[10px] uppercase">Bloqueado</Badge>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="prompt" className="text-right mt-2">Prompt de Sistema</Label>
                        <Textarea
                            id="prompt"
                            name="prompt_system"
                            defaultValue={agent?.prompt_system}
                            placeholder="Ex: Você é um assistente útil e sempre termina frases com 'tenha um bom dia'."
                            className="col-span-3 h-32"
                            required
                        />
                    </div>

                    {message && (
                        <div className={`text-sm p-2 rounded ${message.includes('Erro') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {message}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {agent ? 'Salvar Alterações' : 'Criar Agente'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
