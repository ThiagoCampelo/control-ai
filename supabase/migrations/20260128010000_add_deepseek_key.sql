-- Add api_key_deepseek column to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS api_key_deepseek text;
