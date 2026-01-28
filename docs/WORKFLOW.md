# Fluxo de Trabalho e Deploy (Git Flow)

Este documento define o padrão de desenvolvimento e *release* para o **ControlAI**. O objetivo é garantir estabilidade em produção e evitar deploys acidentais ou quebrados.

## Estrutura de Branches

### 1. `main` (Produção) 🚀
- **Estado**: Sempre estável.
- **Proteção**: Nunca faça commit direto aqui.
- **Deploy**: Qualquer push/merge para esta branch dispara um deploy automático na Vercel (Ambiente de Produção).
- **Conteúdo**: Apenas código testado e aprovado.

### 2. `develop` (Homologação/Staging) 🛠️
- **Estado**: Beta constante. Contém as funcionalidades mais recentes.
- **Uso**: Branch padrão para desenvolvimento diário.
- **Deploy**: Pode ser conectado a um ambiente de "Preview" ou "Staging" na Vercel.
- **Fluxo**: Todos os Pull Requests (PRs) ou commits de funcionalidades devem ir para cá primeiro.

### 3. Branches de Feature (`feat/...`, `fix/...`)
- Opcional para tarefas menores, mandatório para features grandes.
- Nascem de `develop` e morrem em `develop`.

---

## O Ciclo da Aprovação

1.  **Desenvolvimento**:
    *   O Agente (ou Desenvolvedor) trabalha na branch `develop`.
    *   Funcionalidades são criadas, testadas e commitadas aqui.

2.  **Validação (Staging)**:
    *   O usuário testa as funcionalidades na branch `develop` (localmente ou em ambiente de preview).
    *   Se bugs forem encontrados, correções são feitas diretamente na `develop`.

3.  **Release (Ida para Produção)**:
    *   Apenas quando o usuário disser *"Pode subir"* ou *"Release v1.X"*.
    *   **Comando**:
        ```bash
        git checkout main
        git merge develop
        git push origin main
        ```
    *   Isso dispara o deploy final.

## Regras de Ouro

> [!IMPORTANT]
> **NUNCA** faça push direto na `main` sem passar pela `develop` e sem validação explícita.

> [!TIP]
> Use Tags para marcar versões estáveis na `main` (ex: `v1.0.0`), facilitando rollback se necessário.
