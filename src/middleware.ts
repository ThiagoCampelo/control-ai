import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    // [Log] Início do processamento da requisição pelo Middleware
    // Útil para rastrear qual rota está sendo acessada.
    console.log(`[Middleware] Processando requisição para: ${request.nextUrl.pathname}`)

    let supabaseResponse = NextResponse.next({
        request,
    })

    // Inicialização do cliente Supabase para o servidor (Server-Side)
    // Gerencia automaticamente os cookies de sessão para garantir persistência.
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Verificação de segurança: Recupera o usuário a partir do token de sessão.
    // Isso garante que tokens falsos ou expirados não passem despercebidos.
    const { data: { user }, error } = await supabase.auth.getUser()

    // [Log] Detalhes da autenticação (apenas para debug, não expõe dados sensíveis)
    console.log(`[Middleware] Status do Usuário:`, {
        autenticado: !!user,
        userId: user?.id,
        erro: error?.message,
        rota: request.nextUrl.pathname
    })

    // 1. Redirecionamento da Landing Page
    // NOTA: Desabilitado intencionalmente para permitir que usuários logados
    // acessem a página inicial se desejarem. O botão "Entrar" os levará ao Dashboard.
    // if (user && request.nextUrl.pathname === '/') {
    //    console.log("[Middleware] Redirecionando Usuário Logado para /dashboard")
    //    return NextResponse.redirect(new URL('/dashboard', request.url))
    // }

    // 2. Proteção de Rotas Privadas (/dashboard)
    // Se o usuário não estiver autenticado e tentar acessar qualquer rota iniciada por /dashboard,
    // ele será imediatamente redirecionado para a tela de login.
    if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
        console.log("[Middleware] Acesso Negado. Redirecionando para /login")
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
