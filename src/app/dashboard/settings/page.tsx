import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { SettingsForm } from "./settings-form"
import { InviteMemberDialog } from "@/components/dashboard/invite-member-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, AlertCircle } from "lucide-react"

export default async function SettingsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id)
        .single()

    // Usa Admin Client para ler chaves (bypass RLS)
    const adminClient = createAdminClient()
    const { data: company, error: companyError } = await adminClient
        .from('companies')
        .select('api_key_openai, api_key_anthropic, api_key_google')
        .eq('id', profile?.company_id)
        .single()

    // Log para debug no servidor
    console.log("Settings Page Debug:", {
        profileCompanyId: profile?.company_id,
        companyFound: !!company,
        companyError: companyError?.message,
        hasOpenAIKey: !!company?.api_key_openai
    })

    function KeyStatus({ active, label }: { active: boolean, label: string }) {
        return (
            <div className={`flex items-center gap-2 text-sm ${active ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'}`}>
                {active ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{label}: {active ? 'Configurado' : 'Não configurado'}</span>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Configurações de IA</h2>

            {/* Resumo dos Status */}
            <div className="flex flex-wrap gap-4 p-4 bg-card border rounded-lg shadow-sm">
                <KeyStatus active={!!company?.api_key_openai} label="OpenAI (GPT-4o/o1)" />
                <KeyStatus active={!!company?.api_key_anthropic} label="Anthropic (Claude)" />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Provedores de IA (BYOK)</CardTitle>
                    <CardDescription>
                        Insira suas chaves para habilitar os modelos. Dados criptografados com AES-256.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SettingsForm />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Gestão da Equipe</CardTitle>
                    <CardDescription>
                        Convide membros para colaborar na sua empresa.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
                        <div>
                            <p className="font-medium">Membros Ativos</p>
                            <p className="text-sm text-muted-foreground">Gerencie o acesso à sua organização.</p>
                        </div>
                        <InviteMemberDialog />
                    </div>
                    {/* Lista de membros pode ser adicionada aqui futuramente */}
                </CardContent>
            </Card>
        </div>
    )
}