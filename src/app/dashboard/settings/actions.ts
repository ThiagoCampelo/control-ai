'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { encrypt } from '@/lib/crypto'

export type SettingsState = {
    error?: string
    success?: string
}

export async function updateSettings(prevState: any, formData: FormData): Promise<SettingsState> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autorizado' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role === 'employee') {
        return { error: 'Permissão negada. Apenas admins podem alterar configurações.' }
    }

    const updates: Record<string, string> = {}

    // Helper para processar as chaves
    const processKey = (formKey: string, dbColumn: string, prefix: string) => {
        const rawKey = formData.get(formKey) as string
        if (!rawKey || !rawKey.trim()) return; // Campo vazio, ignora

        const trimmedKey = rawKey.trim()

        if (!trimmedKey.startsWith(prefix)) {
            throw new Error(`A chave para ${formKey === 'apiKeyOpenAI' ? 'OpenAI' : 'Anthropic'} deve começar com '${prefix}'.`)
        }

        updates[dbColumn] = encrypt(trimmedKey)
    }

    // Verificamos se houve pedido de exclusão
    const action = formData.get('action') as string;

    if (action === 'delete_openai') {
        updates['api_key_openai'] = null as any; // Supabase update handles null correctly
    } else if (action === 'delete_anthropic') {
        updates['api_key_anthropic'] = null as any;
    } else {
        // Fluxo padrão de salvar/atualizar
        try {
            processKey('apiKeyOpenAI', 'api_key_openai', 'sk-')
            processKey('apiKeyAnthropic', 'api_key_anthropic', 'sk-ant-')
        } catch (err: any) {
            return { error: err.message }
        }
    }

    if (Object.keys(updates).length > 0) {
        try {
            const adminClient = await createAdminClient()

            // Usamos upsert para garantir que a empresa seja criada caso não tenha sido
            const { data: resultData, error } = await adminClient
                .from('companies')
                .update(updates)
                .eq('id', profile.company_id)
                .select()
                .single()

            if (error) throw error
            console.log("Update result:", JSON.stringify(resultData, null, 2))

        } catch (err: any) {
            console.error(err)
            return { error: `Erro de banco de dados: ${err.message || JSON.stringify(err)}` }
        }
    }

    revalidatePath('/', 'layout')
    revalidatePath('/dashboard/settings')
    return { success: 'Configurações atualizadas com sucesso!' }
}

import { sendInviteEmail } from "@/lib/email"

export async function inviteMember(formData: FormData) {
    const supabase = await createClient()

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Não autorizado" }

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, role, companies(name)')
        .eq('id', user.id)
        .single()

    if (!profile?.company_id) return { error: "Empresa não encontrada" }

    // Só admins podem convidar
    if (profile.role !== 'company_admin' && profile.role !== 'master_admin' && profile.role !== 'tenant_admin') {
        return { error: "Apenas administradores podem convidar membros." }
    }

    // 2. Parse Data
    const email = formData.get('email') as string
    const role = formData.get('role') as string || 'user'

    if (!email) return { error: "E-mail obrigatório" }

    const companyName = (profile.companies as any)?.name || "Sua Empresa"
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/register?invite=${profile.company_id}`

    try {
        await sendInviteEmail(email, companyName, inviteLink)
    } catch (err) {
        console.error("Erro Brevo:", err)
        return { error: "Erro ao enviar e-mail de convite." }
    }

    revalidatePath('/dashboard/settings')
    return { success: true }
}