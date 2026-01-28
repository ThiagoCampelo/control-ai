import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function RestrictedAccess() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full" />
                <div className="relative bg-orange-500/10 p-6 rounded-2xl border border-orange-500/20">
                    <ShieldAlert className="w-16 h-16 text-orange-500" />
                </div>
            </div>

            <h2 className="text-3xl font-bold tracking-tight mb-4">Acesso Restrito</h2>

            <p className="text-muted-foreground max-w-md mx-auto mb-8 text-lg leading-relaxed">
                O ambiente de demonstração não permite alterações nas configurações da empresa ou do plano.
                Crie sua própria conta para ter acesso total a todas as funcionalidades.
            </p>

            <div className="flex gap-4">
                <Button asChild size="lg" className="px-8">
                    <Link href="/dashboard">Voltar ao Dashboard</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="px-8">
                    <Link href="https://control-ai.vercel.app/signup">Criar Conta Grátis</Link>
                </Button>
            </div>
        </div>
    )
}
