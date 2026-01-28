import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utilitário para combinar classes CSS condicionalmente e resolver conflitos do Tailwind.
 * Wrapper em torno de clsx e tailwind-merge.
 * 
 * @param inputs - Lista de classes ou objetos condicionais.
 * @returns String de classes processada e otimizada.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
