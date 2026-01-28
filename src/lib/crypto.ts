import 'server-only'; // Garante que nunca vaze para o navegador
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// Algoritmo AES-256-GCM (Padrão de indústria)
const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.ENCRYPTION_KEY || '';

/**
 * Criptografa um texto usando AES-256-GCM.
 * Gera um IV aleatório para cada criptografia.
 * 
 * @param text - Texto plano a ser protegido.
 * @returns String no formato IV:Conteúdo:AuthTag (tudo em hex).
 */
export function encrypt(text: string) {
  if (!SECRET_KEY || SECRET_KEY.length !== 32) {
    throw new Error('ENCRYPTION_KEY inválida: verifique seu .env.local (deve ter 32 caracteres).');
  }

  const iv = randomBytes(12); // Vetor de inicialização
  const cipher = createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  // Retorna formato: IV:Conteúdo:Tag
  return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

/**
 * Descriptografa um texto cifrado no formato IV:Conteúdo:AuthTag.
 * Valida a integridade (AuthTag) antes de retornar.
 * 
 * @param text - Texto criptografado.
 * @returns Texto plano original.
 */
export function decrypt(text: string) {
  if (!SECRET_KEY || SECRET_KEY.length !== 32) {
    throw new Error('ENCRYPTION_KEY inválida.');
  }

  const parts = text.split(':');
  if (parts.length !== 3) throw new Error('Dado corrompido ou formato inválido.');

  const [ivHex, encryptedHex, authTagHex] = parts;

  const decipher = createDecipheriv(
    ALGORITHM,
    Buffer.from(SECRET_KEY),
    Buffer.from(ivHex, 'hex')
  );

  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}