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
import { Checkbox } from "@/components/ui/checkbox"
import { PlusCircle, Pencil, Loader2 } from "lucide-react"
import { upsertPlan } from "@/app/dashboard/admin/actions"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SUPPORTED_MODELS } from "@/utils/models"

interface PlanDialogProps {
    plan?: {
        id: string
        name: string
        price_id_stripe: string
        price_id_annual: string
        limits: {
            max_users: number
            max_tokens: number
            allowed_models: string[]
        }
    }
}

// AVAILABLE_MODELS agora vem de @/utils/models (SUPPORTED_MODELS)

export function PlanDialog({ plan }: PlanDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [selectedModels, setSelectedModels] = useState<string[]>(plan?.limits?.allowed_models || [])

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setMessage(null)

        if (plan?.id) {
            formData.append('id', plan.id)
        }

        // Adicionar modelos selecionados manualmente pois checkbox não vai no formData direto via shadcn
        selectedModels.forEach(model => formData.append('allowed_models', model))

        const result = await upsertPlan(formData)

        setLoading(false)
        if (result.error) {
            setMessage(`Erro: ${result.error}`)
        } else {
            setMessage("Sucesso!")
            setTimeout(() => setOpen(false), 1000)
        }
    }

    const toggleModel = (modelId: string) => {
        setSelectedModels(prev =>
            prev.includes(modelId)
                ? prev.filter(id => id !== modelId)
                : [...prev, modelId]
        )
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {plan ? (
                    <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                ) : (
                    <Button variant="outline" size="sm">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Novo Plano
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{plan ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
                    <DialogDescription>
                        Configure os limites e modelos.
                        <strong> Nota:</strong> Os preços (cobrança) devem ser configurados no Stripe. Copie os IDs abaixo.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-6 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="plan_name" className="text-right">Nome</Label>
                        <Input id="plan_name" name="name" defaultValue={plan?.name} className="col-span-3" required />
                    </div>

                    <div className="space-y-4 rounded-md border p-3 bg-muted/20">
                        <h4 className="text-sm font-medium border-b pb-2 mb-2">Integração Stripe (Cobrança)</h4>
                        <p className="text-[10px] text-muted-foreground mb-3">
                            Crie os produtos no painel do Stripe e cole os IDs de preço (ex: price_123...) aqui.
                        </p>
                        <div className="grid grid-cols-4 items-center gap-4 mb-2">
                            <Label htmlFor="price_monthly" className="text-right text-xs">Mensal ID</Label>
                            <Input id="price_monthly" name="price_id_stripe" defaultValue={plan?.price_id_stripe} placeholder="price_..." className="col-span-3 h-8 font-mono text-xs" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price_annual" className="text-right text-xs">Anual ID</Label>
                            <Input id="price_annual" name="price_id_annual" defaultValue={plan?.price_id_annual} placeholder="price_..." className="col-span-3 h-8 font-mono text-xs" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="max_users" className="text-xs">Máx. Usuários (-1 = ilimitado)</Label>
                            <Input id="max_users" name="max_users" type="number" defaultValue={plan?.limits?.max_users} className="h-8" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="max_tokens" className="text-xs">Máx. Tokens (-1 = ilimitado)</Label>
                            <Input id="max_tokens" name="max_tokens" type="number" defaultValue={plan?.limits?.max_tokens} className="h-8" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Modelos Permitidos</Label>
                        <ScrollArea className="h-[150px] border rounded-md p-2">
                            <div className="grid grid-cols-1 gap-2">
                                {SUPPORTED_MODELS.map((model) => (
                                    <div key={model.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`model-${model.id}`}
                                            checked={selectedModels.includes(model.id)}
                                            onCheckedChange={() => toggleModel(model.id)}
                                        />
                                        <label
                                            htmlFor={`model-${model.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            {model.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {message && (
                        <div className={`text-sm p-2 rounded ${message.includes('Erro') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {message}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {plan ? 'Salvar Alterações' : 'Criar Plano'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
