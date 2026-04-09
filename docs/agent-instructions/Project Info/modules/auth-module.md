# WODO Ally - Auth Module Documentation

Complete reference guide for authentication, authorization, role-based access control (RBAC), and user management in WODO Ally.

---

## Database Models

### Tables
- **`profiles`** - Extended user profile (extends Supabase auth.users)
- **`role_permissions`** - Mapping of roles to permissions
- **`user_sessions`** - Active session tracking

### User Roles (RBAC)
- `admin` - Full system access, team management, billing
- `manager` - Read/write access to core features, limited team management
- `accountant` - Read/write access to finances, no team management
- `viewer` - Read-only access to assigned resources
- `superadmin` - System-level access (rarely used)

### Permissions
**Core Permissions:**
- `invoices.create`, `invoices.read`, `invoices.update`, `invoices.delete`
- `clients.create`, `clients.read`, `clients.update`, `clients.delete`
- `payments.record`, `payments.read`, `payments.update`
- `expenses.create`, `expenses.read`, `expenses.update`, `expenses.delete`
- `projects.create`, `projects.read`, `projects.update`, `projects.delete`
- `contracts.create`, `contracts.read`, `contracts.update`, `contracts.delete`
- `reports.generate`, `reports.send`, `reports.read`

**Admin Permissions:**
- `team.manage` - Add/remove/update users
- `settings.update` - Company settings, bank details, invoice rules
- `billing.manage` - Subscription, payments, coupons
- `audit.view` - View activity logs

---

## Core Hooks

### File: `src/lib/hooks/use-auth.ts`

#### 1. **useAuth()**
Get current authenticated user with role and permissions.
```typescript
// Usage
const { user, role, permissions, isLoading } = useAuth();

// Returns:
// {
//   user: { id, email, name, avatar_url },
//   role: "admin" | "manager" | "accountant" | "viewer",
//   permissions: string[],
//   isLoading: boolean,
//   isAuthenticated: boolean
// }
```
- Type: Custom hook with React Context
- Caches in session storage
- Rehydrates on app load

#### 2. **useLogin()**
Sign in with email and password.
```typescript
// Usage
const { mutate: login } = useLogin();

await login({
  email: "user@example.com",
  password: "SecurePassword123!"
});
```
- Type: Mutation
- Validates credentials against Supabase auth
- Sets JWT in httpOnly cookie
- Invalidates user queries
- Auto-redirect on success

#### 3. **useSignup()**
Create new user account (self-serve or admin-invoked).
```typescript
// Usage
const { mutate: signup } = useSignup();

await signup({
  email: "newuser@example.com",
  password: "SecurePassword123!",
  name: "John Doe",
  role: "accountant" // Admin-invoked only
});
```
- Validates password strength (8+ chars, uppercase, lowercase, number, special)
- Email verification sent (Supabase)
- Sets default role for self-signup: "viewer"
- Admin can pre-set role

#### 4. **useLogout()**
Sign out current user.
```typescript
// Usage
const { mutate: logout } = useLogout();

await logout();
```
- Clears session/cookies
- Invalidates auth state
- Auto-redirect to login page

#### 5. **useResetPassword()**
Send password reset email.
```typescript
// Usage
const { mutate: resetPassword } = useResetPassword();

await resetPassword("user@example.com");
```
- Sends Supabase reset link to email
- User clicks link, redirects to password reset page
- 1-hour link expiry

#### 6. **useConfirmReset()**
Confirm password reset with token.
```typescript
// Usage
const { mutate: confirmReset } = useConfirmReset();

await confirmReset({
  token: "reset-token-from-email",
  newPassword: "NewPassword123!"
});
```
- Validates token hasn't expired
- Updates password
- Clears session (user must re-login)

#### 7. **useUser()**
Fetch current user profile details.
```typescript
// Usage
const { data: profile } = useUser();

// Returns: Profile
// { id, email, name, avatar_url, company_id, role, created_at }
```
- Type: Query (TanStack)
- Includes extended profile data

#### 8. **useUpdateUserProfile()**
Update user profile (name, avatar, preferences).
```typescript
// Usage
const { mutate: updateProfile } = useUpdateUserProfile();

await updateProfile({
  name: "Jane Doe",
  avatar_url: "https://..."
  // Note: email, password, role handled separately
});
```
- Invalidates user queries
- Auto-toast on success/error

#### 9. **useChangePassword()**
Change password (requires old password).
```typescript
// Usage
const { mutate: changePassword } = useChangePassword();

await changePassword({
  oldPassword: "CurrentPassword123!",
  newPassword: "NewPassword456!"
});
```
- Validates old password first
- Requires same strength rules as signup
- Logs out all other sessions

#### 10. **useUserRole()**
Get current user's role (shorthand).
```typescript
// Usage
const role = useUserRole();

if (role === "admin") { ... }
```
- Returns: "admin" | "manager" | "accountant" | "viewer"

#### 11. **useHasPermission(permission)**
Check if user can perform action.
```typescript
// Usage
if (useHasPermission("invoices.create")) {
  // Show create button
}
```
- Returns: boolean
- Cached from useAuth context
- Works offline (from cache)

#### 12. **useTeamMembers()**
Fetch team members (admin only).
```typescript
// Usage
const { data: members } = useTeamMembers();

// Returns: TeamMember[]
// [{ id, email, name, role, created_at, last_login }]
```
- Type: Query (TanStack)
- Admin-only endpoint

#### 13. **useAddTeamMember()**
Invite new team member (admin only).
```typescript
// Usage
const { mutate: addMember } = useAddTeamMember();

await addMember({
  email: "newmember@company.com",
  name: "New Member",
  role: "accountant"
});
```
- Sends invitation email with signup link
- Pre-sets user role
- Auto-toast on success

#### 14. **useRemoveTeamMember()**
Remove team member (admin only).
```typescript
// Usage
const { mutate: removeMember } = useRemoveTeamMember();

await removeMember("user-id");
```
- Soft delete or deactivate
- Invalidates team member queries
- Auto-toast

#### 15. **useUpdateMemberRole()**
Change team member's role (admin only).
```typescript
// Usage
const { mutate: updateRole } = useUpdateMemberRole();

await updateRole({
  userId: "user-id",
  newRole: "manager"
});
```
- Requires admin privilege
- May invalidate user's active sessions
- Auto-toast

---

## Auth Features

### Session Management
- **JWT Tokens**: Supabase Auth generates JWTs
- **httpOnly Cookies**: Tokens stored in secure, httpOnly cookies
- **Auto-Refresh**: Tokens auto-refresh before expiry
- **Session Timeout**: 24-hour max session length, auto-logout
- **Multi-Device**: Multiple active sessions per user allowed

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (!@#$%^&*)

### Email Verification
- Required for signup
- Verification link sent to email
- User clicks to confirm email
- 24-hour verification link expiry

### Permission Model
- Role-based access control (RBAC)
- Permissions tied to roles
- Can be extended to resource-level (future)
- Checked server-side for security
- Cached client-side for UX

### Session Security
- CSRF protection via SameSite cookies
- XSS protection via httpOnly cookies
- Rate limiting on auth endpoints (5 attempts/minute)
- Account lockout after 10 failed attempts (15 min)
- IP tracking for suspicious logins

---

## Pages

### File: `src/app/login/page.tsx`

**Features:**
- Email input
- Password input (masked)
- "Remember me" checkbox
- Login button
- "Forgot password?" link
- Signup link
- Error messages for invalid credentials
- Loading state during login

**Hooks Used:**
- `useLogin()` - Sign in

### File: `src/app/signup/page.tsx`

**Features:**
- Email input with validation
- Name input
- Password input with strength indicator
- Confirm password input
- T&Cs checkbox
- Signup button
- Login link
- Email verification notice
- Error display

**Hooks Used:**
- `useSignup()` - Create account
- Password strength validation

### File: `src/app/reset-password/page.tsx`

**Features:**
- Email input for forgot password
- Send reset link button
- Success message
- Auto-redirect to login after reset

**Hooks Used:**
- `useResetPassword()` - Send reset link
- `useConfirmReset()` - Confirm new password

### File: `src/app/(dashboard)/settings/page.tsx` (Profile Tab)

**Features:**
- Edit name, avatar
- Display current role
- Change password section
- Active sessions list
- Logout from other sessions
- Email (display only)

**Hooks Used:**
- `useUser()` - Fetch profile
- `useUpdateUserProfile()` - Update profile
- `useChangePassword()` - Change password

### File: `src/app/(dashboard)/settings/page.tsx` (Team Tab - Admin Only)

**Features:**
- Team members list with roles
- Add member button (modal)
- Edit role dropdown per member
- Remove member button (with confirmation)
- Member creation date
- Last login timestamp
- Activity indicator (online/offline)

**Hooks Used:**
- `useTeamMembers()` - Fetch list
- `useAddTeamMember()` - Invite
- `useUpdateMemberRole()` - Change role
- `useRemoveTeamMember()` - Remove

---

## Form Fields

### Login Form
- `email` (required, email input) - User email
- `password` (required, password input) - User password
- `remember_me` (checkbox) - Keep me logged in

### Signup Form
- `email` (required, email input) - New email
- `name` (required, text input) - Full name
- `password` (required, password input) - Password (8+ chars, strength rules)
- `confirm_password` (required, password input) - Confirm password
- `terms_accepted` (checkbox, required) - Accept T&Cs

### Password Reset Form
- `email` (required, email input) - Account email
- Then after clicking email link:
  - `new_password` (required, password input) - New password
  - `confirm_password` (required, password input) - Confirm

### Add Team Member Form
- `email` (required, email input) - New member email
- `name` (required, text input) - Member name
- `role` (required, dropdown) - Manager, Accountant, Viewer

---

## Validation Rules

**Email:**
- Valid email format (RFC 5322)
- Domain must exist (MX lookup)
- No disposable email domains

**Password:**
- Min 8 characters
- 1+ uppercase (A-Z)
- 1+ lowercase (a-z)
- 1+ number (0-9)
- 1+ special (!@#$%^&*)
- Not user's name or email

**Name:**
- Min 2 characters
- Max 100 characters
- Alphanumeric + spaces allowed

---

## Integrations

### Supabase Auth
- Email/password authentication
- JWT token generation & refresh
- Email verification
- Password reset email
- Rate limiting (built-in)

### Session Storage
- Supabase session in localStorage
- User profile in React Context
- Permissions cached in memory
- Auto-sync across browser tabs

### Protected Routes
- Middleware checks authentication on /dashboard routes
- Redirects unauthenticated users to /login
- Checks permissions for specific pages/actions
- Middleware in `src/app/middleware.ts`

---

## Type Definitions

```typescript
// Database
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Auth context
interface AuthContextType {
  user: User | null;
  role: UserRole;
  permissions: string[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials) => Promise<void>;
  logout: () => Promise<void>;
  signup: (credentials) => Promise<void>;
}

// User role
type UserRole = "admin" | "manager" | "accountant" | "viewer" | "superadmin";

// Team member
interface TeamMember extends Profile {
  last_login: string | null;
  is_online: boolean;
}
```

---

## API Routes (Planned)

- `POST /api/auth/login` - Email/password login
- `POST /api/auth/signup` - Create account
- `POST /api/auth/logout` - Sign out
- `POST /api/auth/reset-password` - Send reset email
- `POST /api/auth/confirm-reset` - Reset password
- `GET /api/auth/me` - Current user profile
- `PATCH /api/auth/me` - Update profile
- `PATCH /api/auth/password` - Change password
- `GET /api/auth/permissions` - Current permissions
- `POST /api/auth/refresh` - Refresh token

---

## Key Statistics

| Metric | Value |
|--------|-------|
| Total Hooks | 15 |
| Pages | 4 |
| User Roles | 5 |
| Password Requirements | 5 rules |
| Session Timeout | 24 hours |
| Rate Limit | 5 attempts / 60 sec |

---

## Last Updated

**Date:** 2026-03-05
**Status:** Phase 5 Complete
**Build:** 0 TypeScript errors

---

## Related Documentation
- `settings-module.md` - Team management section
- `clients-module.md` - User activity tracking
- Security policies in project docs
