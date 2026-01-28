import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { SettingsForm } from "./settings-form"
import { RestrictedAccess } from "@/components/dashboard/restricted-access"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, AlertCircle } from "lucide-react"

interface ProfileWithCompany {
    company_id: string;
    role: string;
    companies: {
        plans: {
            name: string;
        } | null;
    } | null;
}

function KeyStatus({ active, label }: { active: boolean, label: string }) {
    return (
        <div className={`flex items-center gap-2 text-sm ${active ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'}`}>
            {active ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{label}: {active ? 'Configurado' : 'Não configurado'}</span>
        </div>
    )
}

export default async function SettingsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profileRaw } = await supabase
        .from('profiles')
        .select('company_id, role, companies(plans(name))')
        .eq('id', user?.id)
        .single()

    const profile = profileRaw as unknown as ProfileWithCompany;
    const planName = profile?.companies?.plans?.name;

    // Bloqueia acesso se for Demo User OU se a empresa estiver no Demo Plan
    if (profile?.role === 'demo_user' || planName === 'Demo Plan') {
        return <RestrictedAccess />
    }

    // Usa Admin Client para ler chaves (bypass RLS)
    const adminClient = await createAdminClient()
    const { data: company } = await adminClient
        .from('companies')
        .select('api_key_openai, api_key_anthropic, api_key_google, api_key_deepseek')
        .eq('id', profile?.company_id)
        .single()

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Configurações de IA</h2>

            {/* Resumo dos Status */}
            <div className="flex flex-wrap gap-4 p-4 bg-card border rounded-lg shadow-sm">
                <KeyStatus active={!!company?.api_key_openai} label="OpenAI (GPT-4o)" />
                <KeyStatus active={!!company?.api_key_anthropic} label="Anthropic (Claude)" />
                <KeyStatus active={!!company?.api_key_deepseek} label="DeepSeek (V3)" />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Provedores de IA (BYOK)</CardTitle>
                    <CardDescription>
                        Insira suas chaves para habilitar os modelos. Dados criptografados com AES-256.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SettingsForm
                        hasOpenAI={!!company?.api_key_openai}
                        hasAnthropic={!!company?.api_key_anthropic}
                        hasDeepSeek={!!company?.api_key_deepseek}
                    />
                </CardContent>
            </Card>
        </div>
    )
}