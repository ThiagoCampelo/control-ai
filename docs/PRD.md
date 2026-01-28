# Documento de Requisitos do Produto (PRD) – Versão Final
Nome do Projeto: ControlAI

## 1. Visão Geral (Overview)
O projeto consiste na construção de uma Plataforma de Inteligência Artificial Privada (SaaS Multi-tenant), denominada ControlAI, que será o MVP do curso “Do 0 ao App”.
A plataforma permitirá que empresas (tenants) cadastrem seus colaboradores e utilizem modelos de LLM (OpenAI, Claude, etc.) sob um contexto seguro, privado e auditável.

### Pilares do Produto
*   **Segurança Multi-tenant (RLS)**: Segregação total de dados entre empresas.
*   **Modelo de Assinatura BYOK**: A plataforma cobra pela infraestrutura e segurança; o cliente fornece sua própria chave de LLM.
*   **Gestão Completa**: Dashboards distintos para:
    *   Admin Master (Plataforma)
    *   Admin Tenant (Empresa)

## 2. Metas do Produto
*   Implementar multi-tenancy segura com RLS (Supabase).
*   Integrar Stripe para cobrança da assinatura SaaS.
*   Criar um Dashboard Master para gestão da plataforma.
*   Desenvolver Landing Page e Página de Pricing focadas em conversão.
*   Garantir criptografia de dados sensíveis.
*   Implementar e-mails transacionais automatizados.

## 3. Stack Tecnológica e Integrações (Referencial do Produto)
*   **Frontend**: React + Vite (Nota: Projeto iniciado com Next.js App Router conforme Seção 2 do desafio "Padrão de Stacks")
*   **Banco de Dados**: Supabase (PostgreSQL, Auth, RLS, Storage)
*   **Pagamentos**: Stripe
*   **E-mails**: Brevo
*   **IA/LLM**: OpenAI / Claude (BYOK)
*   **Hosting**: Netlify (Nota: Vercel é citado na Seção 2 "Infraestrutura", usaremos Vercel conforme padrão Next.js)
*   **UI**: shadcn/ui

## 4. Funcionalidades Essenciais
*   Landing Page e Pricing
*   Autenticação (Login/Cadastro de Empresas)
*   Dashboard do Colaborador
*   Chat com LLM (Protegido)
*   Admin Dashboard (Tenant)
*   Dashboard Master (Plataforma)
*   Gestão de Agentes IA
*   Controle de Uso e Limites
*   Sistema de Auditoria

## 5. Modelo de Dados
(Tabelas: planos, empresas, perfis, agentes_ia, conversas, uso_recursos, auditoria)
➡ Obrigatório implementar RLS em todas as tabelas com empresa_id.

## 6. Segurança e Compliance
*   Criptografia de chaves API
*   RLS sempre ativo
*   Auditoria completa
*   Rate Limiting
*   LGPD, PCI DSS (Stripe) e boas práticas de segurança

---

# 2. Padrão de Stacks e Requisitos Técnicos (Obrigatório)

## Frontend
*   Framework: React ou Next.js (App Router)
*   Linguagem: TypeScript
*   Estilização: Tailwind CSS
*   UI: shadcn/ui
*   Mobile: React Native + Expo

## Backend
*   Runtime: Node.js (LTS)
*   API: Next.js API Routes ou Edge Functions
*   BaaS: Supabase (PostgreSQL, Auth, Storage)
*   Edge Functions: Supabase Edge Functions (Deno)

## Infraestrutura (Obrigatória)
*   Versionamento: GitHub
*   Hospedagem Frontend: Vercel
*   CDN / Segurança: Cloudflare
*   Backend: Supabase Cloud

## 3. Uso do MCP e Publicação
*   O projeto deverá ser desenvolvido utilizando o MCP do Supabase.
*   A entrega deve contemplar:
    *   Frontend 100% funcional
    *   Backend 100% funcional
    *   Implementação completa no Supabase
    *   Projeto publicado e acessível (URL funcional)
