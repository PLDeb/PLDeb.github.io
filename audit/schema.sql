CREATE TABLE IF NOT EXISTS audits (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  status TEXT NOT NULL,            -- queued, running, review, sent, failed
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  business TEXT NOT NULL,
  followup INTEGER NOT NULL DEFAULT 0,   -- consentement aux suivis par courriel
  ip_hash TEXT NOT NULL,
  client_token TEXT NOT NULL,      -- lien privé du rapport client
  admin_token TEXT NOT NULL,       -- page de revue (Pierre-Luc seulement)
  score INTEGER,
  flags TEXT,
  error TEXT,
  sent_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_audits_domain ON audits(domain, created_at);
CREATE INDEX IF NOT EXISTS idx_audits_ip ON audits(ip_hash, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_audits_client_token ON audits(client_token);
