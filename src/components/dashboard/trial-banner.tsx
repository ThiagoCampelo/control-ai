"use client"

import { differenceInDays, parseISO } from "date-fns"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Clock } from "lucide-react"

interface TrialBannerProps {
    trialEndsAt: string | null
    hasActivePlan?: boolean
}

export function TrialBanner({ trialEndsAt, hasActivePlan = false }: TrialBannerProps) {
    if (!trialEndsAt || hasActivePlan) return null

    const end = parseISO(trialEndsAt)
    const now = new Date()
    const diff = differenceInDays(end, now)
    const daysLeft = diff > 0 ? diff : 0

    // Se o trial acabou (0 ou negativo)
    const isExpired = daysLeft <= 0

    return (
        <div className="mx-4 mb-4 mt-6 rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
                <Clock className={`h-4 w-4 ${isExpired ? "text-destructive" : "text-primary"}`} />
                <span className={`text-sm font-semibold ${isExpired ? "text-destructive" : "text-foreground"}`}>
                    {isExpired ? "Período Gratuito Expirou" : `Teste Grátis: ${daysLeft} dias`}
                </span>
            </div>

            {!isExpired && (
                <Progress value={((14 - daysLeft) / 14) * 100} className="h-2 mb-3" />
            )}

            <div className="text-xs text-muted-foreground mb-3 leading-relaxed">
                {isExpired
                    ? "Seu acesso foi limitado. Assine agora para continuar usando a IA."
                    : "Aproveite todos os recursos Premium sem limites."}
            </div>

            <Link href="/dashboard/subscription">
                <Button size="sm" variant={isExpired ? "destructive" : "default"} className="w-full text-xs h-8">
                    {isExpired ? "Assinar Agora" : "Ver Planos"}
                </Button>
            </Link>
        </div>
    )
}
