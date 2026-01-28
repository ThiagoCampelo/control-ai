'use client'

import { useActionState } from 'react'
import { updateSettings } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

import { SettingsState } from './actions'

const initialState: SettingsState = {
    error: '',
    success: ''
}

export function SettingsForm({ hasOpenAI, hasAnthropic, hasDeepSeek }: { hasOpenAI: boolean, hasAnthropic: boolean, hasDeepSeek: boolean }) {
    const [state, formAction, isPending] = useActionState(updateSettings, initialState)

    return (
        <form action={formAction} className="space-y-6">
            {state?.error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                    {state.error}
                </div>
            )}

            {state?.success && (
                <div className="p-3 text-sm text-green-500 bg-green-50 border border-green-200 rounded-md">
                    {state.success}
                </div>
            )}

            {/* OpenAI */}
            <div className="space-y-2">
                <Label htmlFor="apiKeyOpenAI">OpenAI API Key {hasOpenAI && <span className="text-xs text-muted-foreground ml-2">(Configurado)</span>}</Label>
                <div className="flex gap-2">
                    <Input
                        id="apiKeyOpenAI"
                        name="apiKeyOpenAI"
                        type="password"
                        placeholder={hasOpenAI ? "••••••••••••••••••••••••••••••" : "sk-..."}
                        className="font-mono flex-1"
                    />
                    <Button type="submit" name="action" value="delete_openai" variant="destructive" size="sm" title="Apagar Chave">
                        Apagar
                    </Button>
                </div>
            </div>

            {/* Anthropic */}
            <div className="space-y-2">
                <Label htmlFor="apiKeyAnthropic">Anthropic (Claude) API Key {hasAnthropic && <span className="text-xs text-muted-foreground ml-2">(Configurado)</span>}</Label>
                <div className="flex gap-2">
                    <Input
                        id="apiKeyAnthropic"
                        name="apiKeyAnthropic"
                        type="password"
                        placeholder={hasAnthropic ? "••••••••••••••••••••••••••••••" : "sk-ant-..."}
                        className="font-mono flex-1"
                    />
                    <Button type="submit" name="action" value="delete_anthropic" variant="destructive" size="sm" title="Apagar Chave">
                        Apagar
                    </Button>
                </div>
            </div>

            {/* DeepSeek */}
            <div className="space-y-2">
                <Label htmlFor="apiKeyDeepSeek">DeepSeek API Key {hasDeepSeek && <span className="text-xs text-muted-foreground ml-2">(Configurado)</span>}</Label>
                <div className="flex gap-2">
                    <Input
                        id="apiKeyDeepSeek"
                        name="apiKeyDeepSeek"
                        type="password"
                        placeholder={hasDeepSeek ? "••••••••••••••••••••••••••••••" : "sk-..."}
                        className="font-mono flex-1"
                    />
                    <Button type="submit" name="action" value="delete_deepseek" variant="destructive" size="sm" title="Apagar Chave">
                        Apagar
                    </Button>
                </div>
            </div>

            <Button type="submit" name="action" value="save" disabled={isPending}>
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isPending ? 'Salvando...' : 'Salvar Chaves'}
            </Button>
        </form>
    )
}
