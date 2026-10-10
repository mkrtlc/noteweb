-- NoteWeb Pro: encrypted sync + publishing (Cloudflare D1, binding DB)

-- Cached Polar license checks (key is stored only as a SHA-256 hash)
CREATE TABLE IF NOT EXISTS licenses (
  key_hash TEXT PRIMARY KEY,
  customer_id TEXT,
  status TEXT NOT NULL,
  checked_at INTEGER NOT NULL
);

-- One vault per Polar customer. The server only ever sees ciphertext.
CREATE TABLE IF NOT EXISTS vaults (
  vault_id TEXT PRIMARY KEY,
  salt TEXT NOT NULL,
  check_iv TEXT NOT NULL,
  check_ct TEXT NOT NULL,
  seq INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- Encrypted notes/folders; deleted rows are tombstones.
CREATE TABLE IF NOT EXISTS items (
  vault_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  iv TEXT,
  ct TEXT,
  deleted INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  seq INTEGER NOT NULL,
  PRIMARY KEY (vault_id, item_id)
);
CREATE INDEX IF NOT EXISTS items_by_seq ON items (vault_id, seq);

-- Published notes (intentionally public plaintext)
CREATE TABLE IF NOT EXISTS pages (
  slug TEXT PRIMARY KEY,
  vault_id TEXT NOT NULL,
  note_id TEXT NOT NULL,
  title TEXT NOT NULL,
  markdown TEXT NOT NULL,
  tags TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (vault_id, note_id)
);
