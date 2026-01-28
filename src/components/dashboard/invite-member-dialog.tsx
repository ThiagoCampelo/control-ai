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
import { inviteMember } from "@/app/dashboard/settings/actions"
import { UserPlus, Loader2, Send } from "lucide-react"

export function InviteMemberDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setMessage(null)

        const result = await inviteMember(formData)

        setLoading(false)
        if (result.error) {
            setMessage(`Erro: ${result.error}`)
        } else {
            setMessage("Convite enviado!")
            setTimeout(() => {
                setOpen(false)
                setMessage(null)
            }, 1500)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Convidar Novo Usuário
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Convidar Membro</DialogTitle>
                    <DialogDescription>
                        Envie um e-mail com link de convite para adicionar um novo membro à sua empresa.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                            E-mail
                        </Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="colaborador@empresa.com"
                            className="col-span-3"
                            required
                        />
                    </div>
                    {/* Role selection could go here, defaulting to User for MVP */}

                    {message && (
                        <div className={`text-sm p-2 rounded text-center ${message.includes('Erro') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {message}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Enviar Convite
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
