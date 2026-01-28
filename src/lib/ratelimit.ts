import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Criar instância do Redis se as variáveis de ambiente existirem
const redis = (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
    ? new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
    })
    : null;

/**
 * Utilitário de Rate Limiting para proteger rotas da API.
 * Usa algoritmo "fixed window" para limitar requisições.
 * 
 * Exemplo: 10 requisições a cada 10 segundos.
 */
export const ratelimit = redis
    ? new Ratelimit({
        redis: redis,
        limiter: Ratelimit.fixedWindow(10, "10 s"),
        prefix: "@controlai/ratelimit",
        analytics: true,
    })
    : null;
