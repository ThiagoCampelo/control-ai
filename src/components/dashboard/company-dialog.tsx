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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { PlusCircle, Pencil, Loader2 } from "lucide-react"
import { upsertCompany } from "@/app/dashboard/admin/actions"

interface CompanyDialogProps {
    company?: {
        id: string
        name: string
        plan_id: string
    }
    plans: { id: string, name: string }[]
}

export function CompanyDialog({ company, plans }: CompanyDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setMessage(null)

        if (company?.id) {
            formData.append('id', company.id)
        }

        const result = await upsertCompany(formData)

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
                {company ? (
                    <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                ) : (
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nova Empresa
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{company ? 'Editar Empresa' : 'Nova Empresa'}</DialogTitle>
                    <DialogDescription>
                        Gerencie as informações básicas e o plano da empresa.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nome</Label>
                        <Input id="name" name="name" defaultValue={company?.name} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="plan" className="text-right">Plano</Label>
                        <Select name="plan_id" defaultValue={company?.plan_id || plans[0]?.id}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecione o plano" />
                            </SelectTrigger>
                            <SelectContent>
                                {plans.map((plan) => (
                                    <SelectItem key={plan.id} value={plan.id}>
                                        {plan.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {message && (
                        <div className={`text-sm p-2 rounded ${message.includes('Erro') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {message}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {company ? 'Salvar Alterações' : 'Criar Empresa'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
