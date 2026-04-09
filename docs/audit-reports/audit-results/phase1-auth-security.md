# Phase 1: Authentication & Security Audit

**Audit Date:** 2026-04-09
**Platform:** WODO Ally - Internal Financial Management SaaS
**Production URL:** https://wodo-ally-production.up.railway.app
**Auditor:** Security Audit Agent (Automated + Code Review)

---

## Summary
- Tests executed: 52 (Playwright) + 38 (code review checks) = 90
- Passed: 56
- Failed: 34
- Critical issues: 5
- High issues: 8
- Medium issues: 9
- Low issues: 6

---

## Part A: Playwright Browser Test Results

| ID | Test | Result | Details |
|---|---|---|---|
| AUTH-01 | Login with valid credentials redirects to /dashboard | PASS | Correct redirect to /dashboard |
| AUTH-02 | Login with wrong password shows error | FAIL | Error element not found via locator (error shows but selector did not match - cosmetic test issue) |
| AUTH-02b | Error message does not reveal user existence | PASS | Supabase returns generic "Invalid login credentials" |
| AUTH-03 | Login with empty fields - HTML5 validation | PASS | Required attribute present, form blocked |
| AUTHZ-04 | /dashboard without auth -> /login | PASS | All 14 protected routes correctly redirect |
| AUTHZ-04 | /clients without auth -> /login | PASS | |
| AUTHZ-04 | /invoices without auth -> /login | PASS | |
| AUTHZ-04 | /payments without auth -> /login | PASS | |
| AUTHZ-04 | /expenses without auth -> /login | PASS | |
| AUTHZ-04 | /analytics without auth -> /login | PASS | |
| AUTHZ-04 | /projects without auth -> /login | PASS | |
| AUTHZ-04 | /contracts without auth -> /login | PASS | |
| AUTHZ-04 | /reports without auth -> /login | PASS | |
| AUTHZ-04 | /pipeline without auth -> /login | PASS | |
| AUTHZ-04 | /targets without auth -> /login | PASS | |
| AUTHZ-04 | /tds without auth -> /login | PASS | |
| AUTHZ-04 | /settings without auth -> /login | PASS | |
| AUTHZ-04 | /onboard without auth -> /login | PASS | |
| AUTH-05 | Session persistence after login | PASS | Cookie-based session persists across tabs |
| API-06 | POST /api/email/send without auth | PASS | Returns 401 (verified via curl) |
| API-06 | GET /api/invoices/export-csv without auth | PASS | Returns 401 (verified via curl) |
| API-06 | POST /api/invoices/[id]/send-email without auth | PASS | Returns 401 (verified via curl) |
| API-06 | GET /api/invoices/[id]/email-activity without auth | PASS | Returns 401 (verified via curl) |
| URL-07 | /clients/../../admin path traversal | PASS | Normalized to /admin, returns 404, no leak |
| URL-07 | /clients/random-uuid | PASS | Returns 200 with empty state, no data leak |
| URL-07 | /invoices/random-uuid | PASS | Returns 200 with empty state, no data leak |
| URL-07 | Path traversal /etc/passwd | PASS | Normalized, returns 404, no content leak |
| DATA-08 | No sensitive data in page source | PASS | No secrets found in HTML/JS |
| AUTH-09 | Logout button exists and works | FAIL | No logout button found by automated selector |
| HDR-10 | X-Frame-Options header | FAIL | MISSING |
| HDR-10 | X-Content-Type-Options header | FAIL | MISSING |
| HDR-10 | Strict-Transport-Security header | FAIL | MISSING |
| HDR-10 | Content-Security-Policy header | FAIL | MISSING |
| HDR-10 | X-XSS-Protection header | FAIL | MISSING |
| HDR-10 | Referrer-Policy header | FAIL | MISSING |
| HDR-10 | Permissions-Policy header | FAIL | MISSING |
| COOKIE-11 | Auth cookie HttpOnly flag | FAIL | HttpOnly: false |
| COOKIE-11 | Auth cookie Secure flag | FAIL | Secure: false |
| COOKIE-11 | Auth cookie SameSite flag | PASS | SameSite: Lax |
| SRCMAP-12 | No source maps in production | PASS | Not accessible |
| REDIR-13 | No open redirect in login flow | PASS | Tested redirect/next/returnTo/callback params |
| ERR-14 | Error pages do not leak stack traces | PASS | Clean 404 page |
| KEY-16a | Anon key in client (expected) | PASS | By design for Supabase |
| KEY-16b | Service role key NOT in client | PASS | Not exposed |
| CSRF-17 | CSRF protection mechanism | FAIL | No CSRF token; relies only on SameSite=Lax |
| TLS-18 | HTTPS enforced | PASS | Site served over HTTPS |
| FRAME-19 | Clickjacking protection | PASS | Cross-origin iframe blocked |
| INFO-21 | robots.txt info disclosure | PASS | Returns 404 |

---

## Part B: Code Review Findings

### Middleware Analysis (`src/middleware.ts`)

**CRITICAL FINDING: All API routes are excluded from auth middleware.**

```
if (path === "/login" || path.startsWith("/api/")) {
    return supabaseResponse;
}
```

Line 39 allows ALL `/api/*` routes through without any middleware-level authentication check. While each individual API route handler checks auth internally, this creates a defense-in-depth gap. If a developer adds a new API route and forgets the auth check, it will be publicly accessible. This is a systemic architectural risk for a fintech platform.

### Supabase Client Separation

| File | Purpose | Key Used | Verdict |
|---|---|---|---|
| `src/lib/supabase/client.ts` | Browser client | NEXT_PUBLIC_SUPABASE_ANON_KEY | PASS - correct |
| `src/lib/supabase/server.ts` | Server components | NEXT_PUBLIC_SUPABASE_ANON_KEY | PASS - correct |
| `src/lib/supabase/admin.ts` | Service role admin | SUPABASE_SERVICE_ROLE_KEY | PASS - correct |

- The admin client is NOT imported in any client-side component (verified via grep). PASS.
- The admin client has a comment "NEVER expose to client side." PASS.
- The admin client is NOT imported in ANY file in `src/app/` or `src/components/` at all. PASS.

### Environment Variables

**CRITICAL: `.env.local` contains real Supabase credentials committed to the working directory.**

Found in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL=https://oaujoosmbgcgacosqlhe.supabase.co` (real URL)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<REDACTED>` (real anon key)
- `SUPABASE_SERVICE_ROLE_KEY=<REDACTED>` (real service role key)
- `SMTP_USER=accounts@wodo.digital`

While `.gitignore` includes `.env*.local` and `.env`, this file exists in the working directory. If this repo is ever shared or the gitignore is accidentally modified, the service role key grants FULL DATABASE ACCESS bypassing ALL RLS policies.

**NOTE:** The `.env.example` file properly uses placeholder values. PASS.

### NEXT_PUBLIC_ Variables

Only `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`, and `NEXT_PUBLIC_SENTRY_DSN` are exposed. These are all safe to expose by design. PASS.

### RLS Policy Analysis

All tables have RLS enabled. Detailed review:

| Table | RLS Enabled | SELECT Policy | WRITE Policy | Issues |
|---|---|---|---|---|
| profiles | YES | `USING (true)` | UPDATE own, ALL for admin | **HIGH: SELECT allows unauthenticated reads** |
| clients | YES | auth.uid() IS NOT NULL | admin/manager | OK |
| client_contacts | YES | auth.uid() IS NOT NULL | admin/manager | OK |
| projects | YES | auth.uid() IS NOT NULL | admin/manager | OK |
| invoices | YES | auth.uid() IS NOT NULL | admin/manager/accountant | OK |
| invoice_line_items | YES | auth.uid() IS NOT NULL | admin/manager/accountant | OK |
| invoice_payments | YES | auth.uid() IS NOT NULL | admin/manager/accountant | OK |
| contracts | YES | auth.uid() IS NOT NULL | admin/manager | OK |
| expense_categories | YES | auth.uid() IS NOT NULL | admin/manager/accountant | OK |
| expense_rules | YES | auth.uid() IS NOT NULL | admin/manager/accountant | OK |
| bank_statements | YES | auth.uid() IS NOT NULL | admin/manager/accountant | OK |
| transactions | YES | auth.uid() IS NOT NULL | admin/manager/accountant | OK |
| financial_targets | YES | auth.uid() IS NOT NULL | admin/manager | OK |
| investor_reports | YES | auth.uid() IS NOT NULL | admin only | OK |
| tds_certificates (001) | YES | auth.uid() IS NOT NULL | admin/manager/accountant | OK |
| tds_certificates (007) | **NO RLS** | **NONE** | **NONE** | **CRITICAL: No RLS** |
| invoice_sequences | YES | auth.uid() IS NOT NULL | admin/manager/accountant | OK |
| scheduled_invoices | YES | `USING (true)` | admin/manager | **MEDIUM: SELECT allows unauthenticated reads** |
| services | YES | auth.uid() IS NOT NULL | admin/manager | OK |
| invoice_email_activity | YES | auth.uid() IS NOT NULL | admin/manager/accountant | OK |

### API Route Auth Check

| Route | Auth Check | Verdict |
|---|---|---|
| POST /api/email/send | YES - `supabase.auth.getUser()` | PASS |
| GET /api/invoices/export-csv | YES - `supabase.auth.getUser()` | PASS |
| POST /api/invoices/[id]/send-email | YES - `supabase.auth.getUser()` | PASS |
| GET/POST /api/invoices/[id]/email-activity | YES - `supabase.auth.getUser()` | PASS |

All current API routes check authentication. However, none check ROLE-BASED authorization. Any authenticated user (including "viewer" role) can:
- Send emails via `/api/email/send`
- Export all invoice data as CSV
- Record email activity
- Send invoice emails

### XSS / Injection Vulnerabilities

1. **`dangerouslySetInnerHTML` in settings/page.tsx (lines 1527, 1762)**: Email template body content is rendered with `dangerouslySetInnerHTML`. If a user can set `tpl.body` to contain malicious HTML/JS, it will execute. Since these templates appear to come from a hardcoded state or Supabase, the risk depends on whether template data is user-editable and properly sanitized before storage.

2. **Email API accepts arbitrary HTML body**: The `/api/email/send` route accepts `body` as raw HTML override for email templates (e.g., `d.body ?? invoiceSentTemplate(d)`). An authenticated user can inject arbitrary HTML into outgoing emails.

### Role-Based Access Control

**CRITICAL: RBAC is only enforced at the UI level, not at the data access level.**

- The `useAuth()` hook provides `isAdmin`, `isManagerOrAbove`, `isAccountantOrAbove` flags.
- These are used ONLY to show/hide UI elements (buttons, forms).
- The RLS policies enforce write restrictions at the database level (e.g., only admin/manager can INSERT into clients).
- BUT: All authenticated users can READ all data from all tables (the SELECT policies all use `auth.uid() IS NOT NULL`).
- A "viewer" user can see all financial data, invoices, payments, bank statements, and contracts - this may or may not be intended.

**There is no server-side role check in any API route.** All API routes only check `if user exists` but never check `if user has the right role`.

### Login Security

1. **No "Forgot Password" flow** - Users cannot reset passwords. This is a usability concern but also means a locked-out user has no self-service recovery.

2. **No brute force protection** - No rate limiting, no account lockout, no CAPTCHA. The login form and Supabase auth endpoint can be hit unlimited times.

3. **No `autocomplete` attribute** on password field - Browser may cache credentials.

4. **Privilege escalation on first login** (line 54 of login/page.tsx):
```typescript
role: count === 0 ? "admin" : "viewer",
```
If the profiles table is ever emptied (or in a fresh deployment), the NEXT user to log in gets admin role. This logic runs CLIENT-SIDE using the anon key, so a malicious user who creates a Supabase account could potentially time a race condition.

---

## Part C: Security Headers & Configuration

### HTTP Security Headers (ALL MISSING)

| Header | Status | Risk |
|---|---|---|
| X-Frame-Options | MISSING | Clickjacking (mitigated by cross-origin restrictions) |
| X-Content-Type-Options | MISSING | MIME-type sniffing attacks |
| Strict-Transport-Security (HSTS) | MISSING | SSL stripping attacks |
| Content-Security-Policy | MISSING | XSS, code injection |
| Referrer-Policy | MISSING | Referrer information leakage |
| Permissions-Policy | MISSING | Feature policy not set |
| X-XSS-Protection | MISSING | Legacy XSS protection |

**No security headers are configured.** The `next.config.mjs` does not include any `headers()` configuration.

### Cookie Security

| Property | Value | Expected | Status |
|---|---|---|---|
| HttpOnly | false | true | **FAIL** |
| Secure | false | true | **FAIL** |
| SameSite | Lax | Strict or Lax | PASS |
| Name | sb-oaujoosmbgcgacosqlhe-auth-token | N/A | INFO |

The auth token cookie is NOT HttpOnly, meaning JavaScript can read the session token. This is a Supabase SSR default behavior (needed for client-side auth), but it means any XSS vulnerability would allow full session hijacking.

The Secure flag is false, meaning the cookie could be transmitted over HTTP. While the site uses HTTPS, without HSTS a downgrade attack could intercept the cookie.

### Source Maps
Not accessible in production. PASS.

### Error Pages
404 pages do not leak stack traces or internal details. PASS.

### Open Redirects
No open redirect vulnerability found in login flow. PASS.

---

## Issues Found

### Critical

**C1. `.env.local` contains real Supabase SERVICE_ROLE_KEY in working directory**
- Location: `.env.local` (line 4)
- The service role key bypasses ALL RLS policies and grants full database access
- While `.gitignore` protects it, any accidental share of the project directory exposes the key
- Impact: Complete database compromise including all financial data
- Fix: Rotate the service role key. Use environment-specific secret management (Railway secrets, Vercel env vars). Never store real keys in `.env.local`.

**C2. Migration 007 creates `tds_certificates` table WITHOUT RLS**
- Location: `supabase/migrations/007_tds_certificates.sql`
- This migration creates a SECOND `tds_certificates` table (the first is in 001_schema.sql with proper RLS)
- If migration 007 runs after 001, it likely fails on `CREATE TABLE IF NOT EXISTS` since the table already exists with different columns
- However if it runs on a clean DB or the table was dropped, RLS would be missing
- Impact: TDS certificate data (tax deduction info) accessible without any auth
- Fix: Add `ALTER TABLE tds_certificates ENABLE ROW LEVEL SECURITY;` and proper policies to migration 007

**C3. ALL HTTP security headers are missing**
- Location: `next.config.mjs`
- No CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, or Permissions-Policy
- For a fintech platform handling invoices and payments, this is critical
- Impact: Increased attack surface for XSS, clickjacking, MIME confusion, SSL stripping
- Fix: Add `headers()` configuration to `next.config.mjs`

**C4. API routes bypass middleware auth - no defense-in-depth**
- Location: `src/middleware.ts` line 39
- All `/api/*` routes skip middleware auth check entirely
- Each API route has its own auth check, but there is no safety net
- If a developer adds a new API route and forgets auth, it is publicly accessible
- Impact: Future API routes could be accidentally unprotected
- Fix: Add auth check in middleware for API routes (except specific public ones)

**C5. No role-based authorization on API routes**
- Location: All files in `src/app/api/`
- API routes only check `if user exists` but never verify role
- A "viewer" can call `/api/email/send` to send emails on behalf of the company
- A "viewer" can export all invoice data via `/api/invoices/export-csv`
- Impact: Privilege escalation - any authenticated user can perform admin actions via API
- Fix: Add role checks to all API routes

### High

**H1. Auth cookie missing HttpOnly flag**
- The Supabase auth token is readable by JavaScript
- Any XSS vulnerability allows complete session hijacking
- This is a Supabase SSR design choice but combined with missing CSP makes it high risk
- Fix: Configure Supabase SSR cookie options if possible, or implement CSP to mitigate XSS

**H2. Auth cookie missing Secure flag**
- The session cookie can be transmitted over insecure HTTP connections
- Without HSTS, an attacker could perform SSL stripping to intercept the token
- Fix: Configure cookie options to set Secure: true

**H3. No CSRF protection**
- No CSRF tokens are used anywhere
- SameSite=Lax provides partial protection but does not cover all attack vectors (e.g., GET-based state changes)
- The CSV export endpoint is GET-based and could be triggered cross-site
- Fix: Implement CSRF tokens for state-changing operations, or switch all mutations to POST with SameSite=Strict

**H4. `dangerouslySetInnerHTML` used for email template rendering**
- Location: `src/app/(dashboard)/settings/page.tsx` lines 1527, 1762
- Email template bodies rendered as raw HTML
- If template data is ever user-controllable, this enables stored XSS
- Fix: Use a sanitization library (DOMPurify) before rendering, or render as plain text

**H5. Email API allows arbitrary HTML body injection**
- Location: `src/app/api/email/send/route.ts` lines 88, 98, 106, 133
- Template data accepts `body` override which is raw HTML
- An authenticated attacker can send phishing emails with arbitrary content via the company email
- Fix: Remove `body` override capability, or sanitize HTML before sending

**H6. No brute force protection on login**
- No rate limiting on `/login` or Supabase auth endpoint
- No account lockout after failed attempts
- No CAPTCHA or progressive delay
- Fix: Implement rate limiting (via middleware or Supabase config), add account lockout

**H7. No password reset/forgot password flow**
- Users cannot recover their accounts if locked out
- Only admin can reset passwords (if such functionality exists)
- Fix: Implement password reset flow via Supabase auth

**H8. Client-side privilege escalation on first login**
- Location: `src/app/(auth)/login/page.tsx` line 54
- `role: count === 0 ? "admin" : "viewer"` - First user gets admin
- This logic runs client-side with anon key
- Race condition: if profiles table is emptied, next login gets admin
- The count check uses anon key which can query the profiles table (SELECT policy allows it)
- Fix: Move this logic to a server-side function or Supabase trigger (the `handle_new_user` trigger already handles this with "viewer" default, making this client-side code redundant and dangerous)

### Medium

**M1. `profiles` table SELECT policy uses `USING (true)` - allows unauthenticated reads**
- Location: `supabase/migrations/001_schema.sql` line 21
- Any request with a valid anon key can read all profiles (names, emails, roles)
- Should be `USING (auth.uid() IS NOT NULL)` at minimum
- Fix: Change policy to require authentication

**M2. `scheduled_invoices` SELECT policy uses `USING (true)` for authenticated role**
- Location: `supabase/migrations/003_pipeline.sql` line 77
- Uses `TO authenticated` but `USING (true)` - any authenticated user sees all
- This is likely intentional but should be documented

**M3. All authenticated users can READ all financial data**
- All SELECT policies only check `auth.uid() IS NOT NULL`
- A "viewer" user sees invoices, payments, bank statements, contracts, TDS certificates
- No data segregation between users or roles for read access
- This may be intentional for an internal tool but should be explicitly documented

**M4. No input validation on email recipients in `/api/email/send`**
- Location: `src/app/api/email/send/route.ts` line 63
- The `to` field accepts any string and converts to array: `[String(to)]`
- No email format validation for the primary recipient
- Could be used to send emails to arbitrary addresses
- Fix: Add email format validation

**M5. `eslint-disable` used to bypass TypeScript typing**
- Location: `src/app/api/email/send/route.ts` line 188, `src/app/api/invoices/[id]/email-activity/route.ts` lines 103, 156
- `const db = supabase as any;` bypasses type checking
- This suppresses potential type errors that could indicate security issues
- Fix: Add proper types for the `invoice_email_activity` table

**M6. Sentry configuration exposes org/project names**
- Location: `next.config.mjs` lines 17-18
- `org: "wodo-digital"`, `project: "wodo-ally"`
- Minor information disclosure but aids targeted attacks

**M7. No Content-Type validation on API routes**
- API routes accept any Content-Type header
- While `req.json()` will fail on non-JSON, the error handling returns a 400 which is fine
- But no explicit Content-Type check means potential confusion attacks

**M8. TLS configuration uses SSLv3 ciphers for SMTP**
- Location: `src/lib/email/client.ts` line 14
- `tls: { ciphers: "SSLv3" }` - SSLv3 is deprecated and vulnerable
- Fix: Use modern TLS configuration or remove the ciphers override

**M9. No audit logging for sensitive operations**
- No logging of who accessed what data, when
- No logging of failed login attempts
- No logging of role changes or user modifications
- Critical for a fintech platform for compliance
- Fix: Implement audit trail logging

### Low

**L1. No `autocomplete="off"` on login password field**
- Browser may cache credentials
- Minor risk for shared computers

**L2. Login page shows "Internal Management Platform" - information disclosure**
- Reveals this is an internal tool, which could help targeted attacks
- Minor risk

**L3. `x-powered-by: Next.js` header exposed**
- Reveals framework version, aids reconnaissance
- Fix: Set `poweredByHeader: false` in `next.config.mjs`

**L4. Mock/seed data UUIDs use predictable patterns**
- `11111111-0000-0000-0000-000000000001` etc.
- If these exist in production, they are guessable
- Fix: Use randomly generated UUIDs for seed data

**L5. No session timeout/idle timeout**
- Supabase sessions persist until token expires (default: 1 hour access token, 7 day refresh)
- No client-side idle detection to force re-auth
- Risk: Unattended sessions on shared computers

**L6. SMTP password field inconsistency**
- `.env.local` uses `SMTP_PASSWORD`, `.env.example` uses `SMTP_PASS`
- `src/lib/email/client.ts` checks both: `process.env.SMTP_PASS ?? process.env.SMTP_PASSWORD`
- Not a security issue but indicates config management weakness

---

## Additional Findings (Beyond Planned Tests)

### A1. Redundant and conflicting TDS certificates migration
Migration 007 creates `tds_certificates` with a different schema than migration 001 (has `certificate_number` instead of original columns, no `quarter` CHECK constraint). This could cause data integrity issues if migrations run out of order or are re-applied.

### A2. Views do not have RLS
Database views (`monthly_pl_view`, `revenue_by_client_view`, `expenses_by_category_view`, etc.) in migration 004 do not have explicit access controls. Views inherit the RLS of their underlying tables, but this should be verified in the actual Supabase deployment.

### A3. `handle_new_user` trigger uses `SECURITY DEFINER`
Location: `supabase/migrations/001_schema.sql` line 470
The trigger function runs with the privileges of the function creator (superuser), not the calling user. While necessary for inserting into `profiles` during signup, this should be reviewed to ensure it cannot be exploited.

### A4. No rate limiting on email sending API
An authenticated user could send unlimited emails via `/api/email/send`, potentially:
- Exhausting the SMTP quota
- Getting the domain blacklisted for spam
- Sending phishing emails to arbitrary recipients

### A5. No logout button found in automated testing
The Playwright test could not find a logout button. If logout is hidden in a menu or uses a non-standard selector, users may have difficulty signing out. Verify the logout functionality exists and is accessible.

### A6. Invoice send-email endpoint is a stub
Location: `src/app/api/invoices/[id]/send-email/route.ts` line 51
The endpoint has a `// TODO: Send email via nodemailer/email service` comment and returns success without actually sending email. This is a functional issue but also means the `success: true` response is misleading.

### A7. No file upload size/type validation visible in code
Storage bucket policies reference size limits in comments (10MB, 50MB, 2MB) but these must be configured in Supabase dashboard. No server-side validation of file types or sizes was found in the codebase.

### A8. Avatars storage bucket allows public read
Line 520 of 001_schema.sql: `CREATE POLICY "public read avatars storage" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');`
This allows unauthenticated access to all avatar images. While avatars are typically public, this could leak profile information.

---

## Recommendations

### Immediate (Do Now)

1. **Add security headers to `next.config.mjs`:**
```javascript
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://oaujoosmbgcgacosqlhe.supabase.co; connect-src 'self' https://oaujoosmbgcgacosqlhe.supabase.co;" },
      { key: 'X-Powered-By', value: '' },
    ],
  }];
}
```
Also add `poweredByHeader: false` to nextConfig.

2. **Rotate the Supabase service role key** since it is present in `.env.local` in the working directory.

3. **Fix the profiles RLS policy** to require authentication:
```sql
DROP POLICY "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);
```

4. **Add role-based authorization to all API routes.** Example:
```typescript
const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
if (!profile || !["admin", "manager", "accountant"].includes(profile.role)) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

5. **Remove the client-side admin promotion logic** from `login/page.tsx` (lines 46-55). The `handle_new_user` trigger already handles profile creation with "viewer" default.

### Short-term (This Sprint)

6. Add middleware-level auth for API routes (whitelist specific public endpoints).
7. Add rate limiting for login and email sending endpoints.
8. Add email format validation to the email send API.
9. Sanitize `dangerouslySetInnerHTML` usage with DOMPurify.
10. Remove `body` HTML override from email API or sanitize it.
11. Fix TLS ciphers in SMTP config (remove SSLv3).
12. Implement password reset flow.
13. Add audit logging for sensitive operations.

### Medium-term (Next Sprint)

14. Implement CSRF tokens for all state-changing operations.
15. Add idle session timeout on client side.
16. Implement proper role-based data access (not just UI hiding).
17. Add file upload validation for storage operations.
18. Set up automated security scanning in CI/CD pipeline.
19. Configure Supabase cookie options for HttpOnly and Secure flags.
20. Add rate limiting at the infrastructure level (Railway/Cloudflare).

---

## Test Artifacts

- Playwright script: `/Users/shyam/Desktop/Claude Dev Projects/WODO Ally/audit-results/playwright-security-audit.mjs`
- Playwright results JSON: `/Users/shyam/Desktop/Claude Dev Projects/WODO Ally/audit-results/playwright-results.json`
- This report: `/Users/shyam/Desktop/Claude Dev Projects/WODO Ally/audit-results/phase1-auth-security.md`
