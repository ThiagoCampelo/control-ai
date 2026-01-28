-- Add stripe_subscription_id to track active subscriptions
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- Index for faster lookups by Stripe IDs
CREATE INDEX IF NOT EXISTS idx_companies_stripe_customer_id ON public.companies(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_companies_stripe_subscription_id ON public.companies(stripe_subscription_id);
