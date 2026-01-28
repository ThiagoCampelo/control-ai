-- Adiciona coluna is_deleted para Soft Delete em chat_sessions
ALTER TABLE chat_sessions 
ADD COLUMN is_deleted BOOLEAN DEFAULT false;

-- Opcional: Adicionar índice para performance de filtros
CREATE INDEX idx_chat_sessions_is_deleted ON chat_sessions(is_deleted);
