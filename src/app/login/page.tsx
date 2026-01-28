"use client"

import { Suspense, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useActionState } from "react"
import Link from "next/link"
import { Login } from "../auth/actions"
// import { useFormState } from "react-dom" - Removed
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

function LoginForm() {
    const [state, formAction, isPending] = useActionState(Login, null)
    const searchParams = useSearchParams()
    const isDemo = searchParams.get('demo') === 'true'

    // Auto-fill refs for immediate visual update
    const emailRef = useRef<HTMLInputElement>(null)
    const passwordRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isDemo && emailRef.current && passwordRef.current) {
            emailRef.current.value = "demo@control.ai"
            passwordRef.current.value = "password123"
        }
    }, [isDemo])

    return (
        <form action={formAction} className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="nome@empresa.com"
                    required
                    ref={emailRef}
                    defaultValue={isDemo ? "demo@control.ai" : ""}
                />
            </div>
            <div className="grid gap-2">
                <div className="flex items-center">
                    <Label htmlFor="password">Senha</Label>
                </div>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    ref={passwordRef}
                    defaultValue={isDemo ? "password123" : ""}
                />
            </div>
            {state?.error && (
                <p className="text-sm text-red-500 text-center">{state.error}</p>
            )}
            <Button type="submit" className="w-full">
                {isDemo ? "Acessar Demo" : "Entrar"}
            </Button>
        </form>
    )

}

/**
 * Página de Login.
 * Permite que usuários acessem a plataforma via email e senha.
 */
export default function LoginPage() {
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
                    <CardTitle className="text-2xl">Bem-vindo</CardTitle>
                    <CardDescription>
                        Entre na plataforma de IA segura da sua empresa.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div>Carregando...</div>}>
                        <LoginForm />
                    </Suspense>
                    <div className="mt-4 text-center text-sm">
                        Não tem uma conta?{" "}
                        <Link href="/register" className="underline">
                            Cadastre sua empresa
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}