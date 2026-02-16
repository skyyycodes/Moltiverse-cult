-- Add on-chain transfer tracking columns to bribe_offers
alter table public.bribe_offers
  add column if not exists transfer_tx_hash text null,
  add column if not exists transfer_status text null;
