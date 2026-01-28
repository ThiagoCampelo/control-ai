"use server"
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendWelcomeEmail } from "@/lib/email";

/**
 * Realiza o login do usuário.
 * 
 * @param prevState - Estado anterior do form hook.
 * @param formData - Dados do formulário (email, password).
 * @returns Objeto com erro ou redireciona para o dashboard.
 */
export async function Login(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password
    })

    if (error) {
        return { error: "Credenciais inválidas" }
    }


    revalidatePath("/", "layout")
    redirect("/dashboard")
}

/**
 * Registra um novo usuário e cria a empresa associada.
 * 
 * @param prevState - Estado anterior do form hook.
 * @param formData - Dados do formulário (email, password, fullName, companyName).
 * @returns Objeto com erro ou redireciona para o dashboard.
 */
export async function Register(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const fullName = formData.get("fullName") as string
    const companyName = formData.get("companyName") as string

    if (!email || !password || !fullName || !companyName) {
        return { error: "Todos os campos são obrigatórios" }
    }

    // Validação de Senha Forte
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/
    if (!passwordRegex.test(password)) {
        return { error: "A senha deve conter pelo menos 8 caracteres, uma letra maiúscula, uma minúscula, um número e um caractere especial." }
    }

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                company_name: companyName
            }
        }
    })

    if (error) {
        return { error: error.message }
    }

    // Enviar e-mail de boas-vindas assíncrono (sem await para não bloquear)
    sendWelcomeEmail(email, fullName).catch(err => console.error("Erro ao enviar e-mail de boas-vindas:", err));

    revalidatePath("/", "layout")
    redirect("/dashboard")
}

/**
 * Realiza o logout do usuário.
 */
export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}