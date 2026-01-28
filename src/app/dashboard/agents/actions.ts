'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { checkModelAccess } from "@/utils/limits"

export async function upsertAgent(formData: FormData) {
    const supabase = await createClient()

    // 1. Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Não autorizado" }

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.company_id) return { error: "Empresa não encontrada" }

    // Check permission (Admins only)
    if (profile.role !== 'tenant_admin' && profile.role !== 'master_admin') {
        return { error: "Apenas administradores podem gerenciar agentes." }
    }

    // 2. Parse Data
    const id = formData.get('id') as string | null
    const name = formData.get('name') as string
    const prompt_system = formData.get('prompt_system') as string
    const model = formData.get('model') as string

    if (!name || !prompt_system || !model) {
        return { error: "Todos os campos são obrigatórios." }
    }

    // 3. Verify Model Access (Skip for Master Admin)
    if (profile.role !== 'master_admin') {
        const accessCheck = await checkModelAccess(profile.company_id, model)
        if (!accessCheck.allowed) {
            return { error: accessCheck.error }
        }
    }

    // 4. Insert/Update
    const payload = {
        company_id: profile.company_id,
        name,
        prompt_system,
        model
    }

    let error;

    if (id) {
        const { error: updateError } = await supabase
            .from('ai_agents')
            .update(payload)
            .eq('id', id)
            .eq('company_id', profile.company_id) // Extra safety
        error = updateError
    } else {
        const { error: insertError } = await supabase
            .from('ai_agents')
            .insert(payload)
        error = insertError
    }

    if (error) return { error: error.message }

    revalidatePath('/dashboard/agents')
    return { success: true }
}

export async function deleteAgent(agentId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Não autorizado" }

    const { error } = await supabase
        .from('ai_agents')
        .delete()
        .eq('id', agentId)

    // RLS will handle the "own company" check, but explicit check is better? 
    // RLS is enough as defined in previous specific RLS policy.

    if (error) return { error: error.message }

    revalidatePath('/dashboard/agents')
    return { success: true }
}
