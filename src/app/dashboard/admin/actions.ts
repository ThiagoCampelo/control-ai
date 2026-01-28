'use server'

import { createClient, createAdminClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Alterna o status ativo/inativo de uma empresa.
 * @param companyId - ID da empresa.
 * @param currentStatus - Status ATUAL da empresa (true = ativo).
 */
export async function toggleCompanyStatus(companyId: string, currentStatus: boolean) {
    const supabase = await createClient()

    // Inverte o status atual
    const newStatus = !currentStatus

    const { error } = await supabase
        .from('companies')
        .update({ is_active: newStatus })
        .eq('id', companyId)

    if (error) {
        console.error("Erro ao atualizar empresa:", error)
        return { error: "Falha ao atualizar status da empresa" }
    }

    revalidatePath('/dashboard/admin')
    return { success: true }
}

/**
 * Cria ou atualiza uma empresa.
 * @param formData - Dados do formulário.
 */
export async function upsertCompany(formData: FormData) {
    const supabase = await createClient()
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const plan_id = formData.get('plan_id') as string

    const data = { name, plan_id }

    let error
    if (id) {
        const { error: err } = await supabase.from('companies').update(data).eq('id', id)
        error = err
    } else {
        const { error: err } = await supabase.from('companies').insert([data])
        error = err
    }

    if (error) return { error: error.message }
    revalidatePath('/dashboard/admin')
    return { success: true }
}

/**
 * Alterna o status de bloqueio de um usuário.
 * @param userId - ID do usuário.
 * @param currentStatus - Status ATUAL (true = ativo).
 */
export async function toggleUserStatus(userId: string, currentStatus: boolean) {
    const supabase = await createClient()

    const newStatus = !currentStatus

    const { error } = await supabase
        .from('profiles')
        .update({ is_active: newStatus })
        .eq('id', userId)

    if (error) {
        console.error("Erro ao bloquear/desbloquear usuário:", error)
        return { error: "Erro ao atualizar status do usuário" }
    }

    revalidatePath('/dashboard/admin')
    return { success: true }
}

/**
 * Atualiza o cargo (role) de um usuário.
 */
export async function updateUserRole(userId: string, role: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/admin')
    return { success: true }
}

/**
 * Convida um novo usuário (cria pré-perfil).
 */
/**
 * Convida um novo usuário (via Supabase Auth Admin).
 */
export async function inviteUser(formData: FormData) {
    const supabase = await createClient()

    // 1. Obter info do admin que está convidando
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Não autorizado" }

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

    if (!adminProfile?.company_id) return { error: "Perfil incompleto" }

    const email = formData.get('email') as string
    const fullName = formData.get('fullName') as string
    const role = formData.get('role') as string

    // 2. Usar Admin Client para convidar de verdade
    // Isso cria o usuário em auth.users e dispara a trigger handle_new_user
    // A trigger vai ler o metadata (company_id, role) e criar o profile corretamente.
    const adminClient = await createAdminClient()

    const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
        data: {
            full_name: fullName,
            role: role,
            company_id: adminProfile.company_id
        }
    })

    if (error) {
        console.error("Erro ao convidar:", error)
        return { error: `Erro ao enviar convite: ${error.message}` }
    }

    revalidatePath('/dashboard/admin')
    return { success: true }
}

/**
 * Cria ou atualiza um Plano de Assinatura.
 */
export async function upsertPlan(formData: FormData) {
    const supabase = await createClient()

    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const price_id_stripe = formData.get('price_id_stripe') as string
    const price_id_annual = formData.get('price_id_annual') as string

    // Limits parsing
    const max_users = parseInt(formData.get('max_users') as string) || -1
    const max_tokens = parseInt(formData.get('max_tokens') as string) || -1
    const allowed_models = formData.getAll('allowed_models') as string[]

    const data = {
        name,
        price_id_stripe,
        price_id_annual,
        limits: {
            max_users,
            max_tokens,
            allowed_models
        }
    }

    let error
    if (id) {
        const { error: err } = await supabase.from('plans').update(data).eq('id', id)
        error = err
    } else {
        const { error: err } = await supabase.from('plans').insert([data])
        error = err
    }

    if (error) return { error: error.message }
    revalidatePath('/dashboard/admin')
    return { success: true }
}
