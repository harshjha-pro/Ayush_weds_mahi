# Database Design — Shared backend for BFI

**Status:** design for approval. Today every collection below lives in one browser (`localStorage` key `bfi.data.v6`, files in IndexedDB). This plan moves them to a shared database so the team, partners and clients work on the same data.

## 1. Recommended stack: Supabase
| Need | Supabase feature |
|---|---|
| Relational data, reports | Postgres |
| Team & partner sign-in | Auth (email magic link / OTP) |
| Per-role access | Row Level Security (RLS) |
| Client portal without accounts | `security definer` RPC functions keyed by the private token |
| Photos, voice notes, PDFs, HTML packages | Storage (private buckets, signed URLs) |
| Emails, payment webhooks, scheduled jobs | Edge Functions + pg_cron |
| Live chat updates | Realtime on `messages` |

Free tier is enough to build and test. For a live business, Supabase Pro (about $25/month; check current pricing) adds daily backups and no auto-pause.

**Why this fits:** the app already reads/writes through one module (`bfi/js/db.js`: `db`, `commit`, `byId`, `putFile`, `fileUrl`). We keep that interface and swap its storage, so the views barely change.

## 2. Schema (Postgres)

All tables: `id uuid primary key default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at timestamptz`.

### People & access
```sql
profiles (            -- one per team member / partner (auth.users.id)
  id uuid primary key references auth.users,
  name text, email text, phone text,
  role text check (role in ('admin','marketing','outreach','designer','qa','freelancer','affiliate')),
  active boolean default true,
  access_until date,                 -- freelancers
  partner_type text,                 -- 'affiliate' | 'trade'
  partner_kind text, ref_code text unique,
  commission_override jsonb,         -- {basic, premium, luxury}
  trade_limit int, payout jsonb      -- {upi, bank, pan, invoice_path}
);
freelancer_projects (profile_id uuid, project_id uuid, primary key (profile_id, project_id));

clients (                            -- a family account
  name text, phone text, email text, city text,
  token text unique not null,        -- private portal link (22 chars)
  prefs jsonb                        -- notifications, language, contact time
);
```

### Sales
```sql
leads (
  name text, phone text, email text, city text, wedding_date date,
  occasion text, interest text, source text, ref_code text,
  affiliate_id uuid references profiles, referrer_project_id uuid,
  owner_id uuid references profiles,         -- client manager
  client_id uuid references clients,         -- repeat client requests
  template_id uuid, stage text, lost_reason text, lost_note text,
  waitlist boolean default false, quote jsonb, converted_at timestamptz
);
lead_notes (lead_id uuid references leads on delete cascade, author text, text text);
```

### Delivery
```sql
projects (
  code text unique, token text unique,        -- legacy per-project link
  client_id uuid references clients, lead_id uuid references leads,
  occasion text, client_name text, bride_name text, groom_name text,
  phone text, email text, city text, wedding_date date,
  tier text, addons text[], items jsonb, discount int, rush boolean, price int,
  template_id uuid references templates,
  client_manager_id uuid, designer_id uuid, qa_id uuid, affiliate_id uuid,  -- → profiles
  stage smallint, stage_since timestamptz, status text, due_date date,
  extra_revisions int, override_note text,
  intake jsonb,                                -- structured details form
  handover jsonb, qa jsonb, approval jsonb, delivery jsonb,
  review jsonb, consent jsonb, costs jsonb, complaints int,
  ref_code text, design_approved_at timestamptz, delivered_at timestamptz,
  cancelled_at timestamptz, cancel_reason text, seen jsonb
);
assets      (project_id, file_path text, url text, name, mime, kind, purpose, note, uploaded_by text);
previews    (project_id, url, note, round int, by_id uuid);
revisions   (project_id, round int, summary, status, items jsonb);   -- items: [{text, where, done}]
notes       (project_id, by_id uuid, text, tag, done boolean);       -- internal only
messages    (project_id, from_client boolean, by_id uuid, text, tags text[]);
payments    (project_id, amount int, method, ref, paid_at timestamptz);
invoices    (project_id, no text unique, amount int, issued_at timestamptz);
refunds     (project_id, amount int, reason);
```

### Money to people
```sql
commissions (project_id, profile_id uuid, role text check (role in ('partner','client_manager','designer')),
             rate numeric, amount int, status text default 'owed', payout_id uuid,
             unique (project_id, profile_id, role));
payouts     (profile_id, amount int, ref text, paid_at timestamptz);
```

### Content & marketing
```sql
templates (name, slug text unique, art text, tier text, tiers text[], tags text[], status text, preview_url text);
library   (title, kind, source, project_id, status, file_path, url, source_asset_id);
vendors   (name, contact, kind, city, phone, handle, stage, terms, next_follow_up date, partner_id uuid);
vendor_notes (vendor_id, text);
campaigns (title, kind, channel, date date, project_id, asset_id, status);
seo_pages (title, url, keyword, target int, position int, status, visits int, leads int);
ads       (title, channel, budget int, variant_a, variant_b, result, status);
spend     (month text, channel, amount int);
traffic   (month text, visitors int);
msg_templates (name, audience, body);
broadcasts    (audience, body, channel, count int);
documents     (title, kind, party_id uuid, signed_at date, file_path);
settings      (key text primary key, value jsonb);   -- tiers, add-ons, commission, capacity, policy, UPI
audit_log     (by_id uuid, by_name text, action, entity, detail);   -- insert-only
counters      (name text primary key, value int);    -- project & invoice numbers
```

## 3. Access rules (RLS summary)
| Table | Admin | Marketing | Outreach | Designer / Freelancer | QA | Affiliate | Client (token) |
|---|---|---|---|---|---|---|---|
| leads | all | read | own + unassigned; create | — | — | own (status only via view) | own requests (RPC) |
| projects | all | delivered & consented (read) | where client_manager = me | where designer = me (freelancer: also in `freelancer_projects` and before `access_until`) | where qa = me | own referrals via **view without prices/notes** | own via RPC |
| notes | all | — | own projects | own projects | own projects | — | **never** |
| messages | all | — | own projects | own projects | own projects | — | own via RPC |
| payments / invoices | all | — | own projects (read) | — | — | — | own via RPC |
| commissions / payouts | all | — | own | own | — | own | — |
| vendors, referrals | all | read | all | — | — | — | — |
| campaigns, seo, ads, library | all | all | read | library read | — | approved library read | — |
| settings | all write | read | read | read | read | read (public subset) | public subset |
| audit_log | read | — | — | — | — | — | — |

Implementation: a helper `auth_role()` reads `profiles.role`; each policy combines role + ownership. The website and client portal use **RPC functions** (`portal_get(token)`, `portal_send_message(token, …)`, `portal_submit_intake(token, …)`, `public_capacity()`, `public_reviews()`, `create_enquiry(…)`) that check the token server-side and return only allowed fields.

## 4. Storage
Buckets (all private): `project-assets/<project_id>/…`, `library/…`, `documents/…`, `payout-invoices/…`. Access through signed URLs (1 hour). Limits: 25 MB per file; images resized on upload (phase 2).

## 5. Server-side logic (moved from browser to database/functions)
- `ensure_commission(project)` — trigger when a project becomes delivered and fully paid (same rules as `calc.js`).
- `capacity()` — view used by website and app.
- Project/invoice numbering via `counters` in a transaction.
- Audit trigger on every table → `audit_log`.
- Edge Functions: `notify` (email on preview/payment/delivery), `payment-webhook` (gateway → `payments`), daily digest for overdue projects and follow-ups.

## 6. Migration plan
1. Create Supabase project (needs your approval; free tier).
2. Apply schema + RLS as SQL migrations stored in `bfi/supabase/migrations/`.
3. Import: admin exports the current backup JSON (Settings → Back up) → `scripts/import.js` maps collections to tables (ids preserved as text → uuid map; tokens unchanged so client links keep working).
4. Swap `js/db.js` to Supabase (keep API; add async loading + optimistic `commit`).
5. Files: upload remaining IndexedDB files from the admin's device via a one-time "Upload local files" button.
6. Run both in parallel on preview for a week; then switch production.

## 7. Backups & data rights
- Daily automatic backups (Supabase Pro) + weekly JSON export kept by the admin.
- Client data deletion on request (DPDP): delete `clients` row cascades to projects' personal fields; keep anonymised financial records for tax.
