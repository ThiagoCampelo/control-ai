"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FeatureItem } from "@/components/feature-item";
import Link from "next/link";
import { createCheckoutSession } from "@/app/dashboard/subscription/actions";
import { Loader2 } from "lucide-react";

interface PricingSectionProps {
    mode: "landing" | "dashboard";
    companyId?: string;
    userEmail?: string;
    currentPlanId?: string;
}

export function PricingSection({ mode, companyId, userEmail, currentPlanId }: PricingSectionProps) {
    const [isAnnual, setIsAnnual] = useState(false);
    const [loading, setLoading] = useState<string | null>(null);

    const handleSubscribe = async (planType: "starter" | "enterprise") => {
        if (mode === "landing") {
            window.location.href = "/register";
            return;
        }

        if (!companyId) return;

        setLoading(planType);
        try {
            const url = await createCheckoutSession(planType, isAnnual ? "annual" : "monthly", companyId);
            if (url) window.location.href = url;
        } catch (error) {
            console.error("Erro ao criar sessão de checkout:", error);
            alert("Erro ao processar pagamento. Tente novamente.");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="space-y-12">
            <div className="flex items-center justify-center gap-4">
                <Label htmlFor="billing-mode" className={`cursor-pointer ${!isAnnual ? "text-foreground font-bold" : "text-muted-foreground"}`}>
                    Mensal
                </Label>
                <Switch
                    id="billing-mode"
                    checked={isAnnual}
                    onCheckedChange={setIsAnnual}
                />
                <Label htmlFor="billing-mode" className={`cursor-pointer ${isAnnual ? "text-foreground font-bold" : "text-muted-foreground"}`}>
                    Anual <span className="text-xs text-green-600 font-bold ml-1">(-20%)</span>
                </Label>
            </div>

            <div className="grid md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
                {/* PLANO STARTER */}
                <Card className={`flex flex-col hover:border-primary/50 transition-colors duration-300 ${currentPlanId === '11111111-1111-1111-1111-111111111111' ? 'border-primary ring-1 ring-primary' : ''}`}>
                    <CardHeader>
                        <CardTitle className="text-2xl">Starter</CardTitle>
                        <CardDescription>Para pequenas equipes e startups.</CardDescription>
                        <div className="mt-4">
                            <span className="text-4xl font-bold">R$ {isAnnual ? "44,90" : "45,90"}</span>
                            <span className="text-muted-foreground">/mês</span>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        <ul className="space-y-3 text-sm">
                            <FeatureItem active>Até 5 Colaboradores</FeatureItem>
                            <FeatureItem active>Integração OpenAI (Geração GPT-5)</FeatureItem>
                            <FeatureItem active>Histórico de 30 dias</FeatureItem>
                            <FeatureItem active>Suporte por Email</FeatureItem>
                            <FeatureItem>Múltiplos Modelos de IA</FeatureItem>
                            <FeatureItem>Auditoria Avançada</FeatureItem>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full"
                            variant={currentPlanId === '11111111-1111-1111-1111-111111111111' ? 'secondary' : 'outline'}
                            disabled={loading !== null || currentPlanId === '11111111-1111-1111-1111-111111111111'}
                            onClick={() => handleSubscribe("starter")}
                        >
                            {loading === "starter" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {currentPlanId === '11111111-1111-1111-1111-111111111111' ? 'Plano Atual' : 'Começar Agora'}
                        </Button>
                    </CardFooter>
                </Card>

                {/* PLANO ENTERPRISE */}
                <Card className={`flex flex-col border-primary shadow-lg relative overflow-hidden scale-105 md:scale-105 z-10 ${currentPlanId === '22222222-2222-2222-2222-222222222222' ? 'ring-2 ring-primary' : ''}`}>
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg font-bold">
                        MAIS POPULAR
                    </div>
                    <CardHeader>
                        <CardTitle className="text-2xl text-primary">Enterprise</CardTitle>
                        <CardDescription>Para empresas em escala.</CardDescription>
                        <div className="mt-4">
                            <span className="text-4xl font-bold">R$ {isAnnual ? "179,90" : "199,90"}</span>
                            <span className="text-muted-foreground">/mês</span>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        <ul className="space-y-3 text-sm">
                            <FeatureItem active>Colaboradores Ilimitados</FeatureItem>
                            <FeatureItem active>OpenAI GPT-5 + Claude 4.5 Series</FeatureItem>
                            <FeatureItem active>Histórico Ilimitado</FeatureItem>
                            <FeatureItem active>Suporte Prioritário 24/7</FeatureItem>
                            <FeatureItem active>Múltiplos Modelos de IA</FeatureItem>
                            <FeatureItem active>Auditoria e Logs (Compliance)</FeatureItem>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full"
                            size="lg"
                            disabled={loading !== null || currentPlanId === '22222222-2222-2222-2222-222222222222'}
                            onClick={() => handleSubscribe("enterprise")}
                        >
                            {loading === "enterprise" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {currentPlanId === '22222222-2222-2222-2222-222222222222' ? 'Plano Atual' : 'Assinar Enterprise'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
