-- Soft revocation: set revoked_at instead of deleting rows so codes stay permanently consumed
alter table early_access_users add column if not exists revoked_at timestamptz;
