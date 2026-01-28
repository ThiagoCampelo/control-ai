import { createClient } from "@/utils/supabase/server"

interface AccessCheckResult {
    allowed: boolean
    error?: string
}

/**
 * Verifica se a empresa atingiu o limite de usuários do seu plano atual.
 * 
 * @param companyId - ID (UUID) da empresa a ser verificada.
 * @returns Objeto contendo o status de permissão e mensagem de erro opcional.
 */
export async function checkUserLimit(companyId: string): Promise<AccessCheckResult> {
    const supabase = await createClient()

    // 1. Busca Detalhes do Plano da Empresa com Tipagem Segura
    const { data: company, error: companyError } = await supabase
        .from('companies')
        .select(`
            id,
            plan:plans (
                name,
                limits
            )
        `)
        .eq('id', companyId)
        .single()

    if (companyError || !company || !company.plan) {
        console.error("Erro ao buscar plano:", companyError)
        return { allowed: false, error: "Erro crítico ao verificar plano da empresa. Contate o suporte." }
    }

    // 2. Extração e Tratamento dos Limites
    // O Supabase pode retornar relacionamentos como array
    const planData = Array.isArray(company.plan) ? company.plan[0] : company.plan

    // @ts-ignore
    const limits = planData?.limits as { max_users?: number }
    const maxUsers = limits?.max_users ?? 5

    // Se for -1, significa usuários ilimitados
    if (maxUsers === -1) return { allowed: true }

    // 3. Contagem de Usuários Atuais (Head request para performance)
    const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)

    if (countError) {
        console.error("Erro ao contar usuários:", countError)
        return { allowed: false, error: "Erro ao validar quantidade de usuários." }
    }

    // 4. Validação Final
    const currentUsers = count || 0
    if (currentUsers >= maxUsers) {
        return {
            allowed: false,
            error: `Limite de usuários atingido (${currentUsers}/${maxUsers}). Faça upgrade do plano para adicionar mais membros.`
        }
    }

    return { allowed: true }
}

/**
 * Verifica se a empresa tem permissão para utilizar um modelo de IA específico.
 * 
 * @param companyId - ID da empresa.
 * @param model - Identificador do modelo (ex: 'gpt-4', 'claude-3-5-sonnet').
 * @returns Objeto com isAllowed true/false e mensagem de erro.
 */
export async function checkModelAccess(companyId: string, model: string): Promise<AccessCheckResult> {
    const supabase = await createClient()

    const { data: company, error } = await supabase
        .from('companies')
        .select(`
            plan:plans (
                limits
            )
        `)
        .eq('id', companyId)
        .single()

    if (error || !company || !company.plan) {
        return { allowed: false, error: "Plano não encontrado ou empresa inválida." }
    }

    const planData = Array.isArray(company.plan) ? company.plan[0] : company.plan
    // @ts-ignore
    const limits = planData?.limits as { allowed_models?: string[] }
    const allowedModels = limits?.allowed_models || []

    // Verifica se o modelo está na lista de permitidos
    if (!allowedModels.includes(model)) {
        return {
            allowed: false,
            error: `Seu plano atual não permite o uso do modelo "${model}". Atualize seu plano para ter acesso a modelos avançados.`
        }
    }

    return { allowed: true }
}

/**
 * Retorna a lista de modelos permitidos para a empresa.
 * 
 * @param companyId - ID (UUID) da empresa.
 * @returns Lista de strings com os IDs dos modelos permitidos.
 */
export async function getAllowedModels(companyId: string): Promise<string[]> {
    const supabase = await createClient()

    const { data: company, error } = await supabase
        .from('companies')
        .select(`
            plan:plans (
                limits
            )
        `)
        .eq('id', companyId)
        .single()

    if (error || !company || !company.plan) {
        console.error("Erro ao buscar plano para modelos permitidos:", error)
        return []
    }

    const planData = Array.isArray(company.plan) ? company.plan[0] : company.plan
    // @ts-ignore
    const limits = planData?.limits as { allowed_models?: string[] }

    return limits?.allowed_models || []
}
