/**
 * Formata um valor numérico para o formato de moeda brasileira (BRL).
 * @param amount - O valor a ser formatado.
 * @returns Uma string representando o valor em reais (ex: R$ 1.500,00).
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(amount);
}

/**
 * Formata um número grande para uma representação abreviada (k, M).
 * Útil para dashboards e métricas.
 * @param num - O número a ser formatado.
 * @returns Uma string abreviada (ex: 1.5k, 2.3M) ou o número original.
 */
export function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
}
