"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Register } from "../auth/actions"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { Logo } from "@/components/logo"

/**
 * Página de Cadastro/Registro.
 * Cria uma nova empresa e o usuário administrador inicial.
 */
export default function RegisterPage() {
    const [state, action, isPending] = useActionState(Register, null)

    return (
        <div className="flex h-screen w-full items-center justify-center bg-background px-4">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-2">
                        <Logo />
                    </div>
                    <CardTitle className="text-2xl">Nova Empresa</CardTitle>
                    <CardDescription>
                        Crie um ambiente isolado para utilizar IA com segurança.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={action} className="grid gap-4">
                        {state?.error && (
                            <div className="text-red-500 text-sm font-medium">
                                {state.error}
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="companyName">Nome da Empresa</Label>
                            <Input
                                id="companyName"
                                name="companyName"
                                placeholder="Ex: Acme Corp"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="fullName">Seu Nome (Admin)</Label>
                            <Input
                                id="fullName"
                                name="fullName"
                                placeholder="Ex: João Silva"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Corporativo</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="admin@acme.com"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input id="password" name="password" type="password" required />
                            <p className="text-xs text-muted-foreground">
                                Mínimo de 8 caracteres, com maiúsculas, minúsculas, números e símbolos.
                            </p>
                        </div>

                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? "Criando..." : "Criar Workspace"}
                        </Button>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        Já tem uma conta?{" "}
                        <Link href="/login" className="underline">
                            Entrar
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}