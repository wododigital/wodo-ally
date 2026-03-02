# 04 - Authentication & Roles

## Auth Provider

Supabase Email Auth (Magic Link + Password). No social auth needed for v1.

## Login Page Design

Route: `/login`

Dark full-screen layout with:
- Centered glass card (max-w-md)
- WODO logo at top
- "WODO Ally" title with "Internal Management Platform" subtitle
- bg-wave.jpg as full-page background at 10% opacity
- Email input + Password input
- "Sign In" button (accent color)
- Error states with red border on inputs and error message

## Auth Flow

1. User navigates to any dashboard route
2. Middleware checks for Supabase session
3. No session -> redirect to `/login`
4. Valid session -> check if profile exists in `profiles` table
5. No profile -> auto-create with default 'viewer' role (admin manually upgrades)
6. Render page based on role permissions

## Middleware Implementation

Use `@supabase/ssr` to create server-side client in `src/middleware.ts`. Protect all routes under `/(dashboard)/*`. Let `/login` and `/api/*` pass through. On auth state change, refresh the session cookie.

## Role Permissions Matrix

| Feature | Admin | Manager | Accountant | Viewer |
|---------|-------|---------|------------|--------|
| Dashboard | Full | Full | Financial only | Read only |
| Clients CRUD | Yes | Yes | No | View only |
| Projects CRUD | Yes | Yes | No | View only |
| Invoices CRUD | Yes | Yes | Yes | View only |
| Send invoices | Yes | Yes | Yes | No |
| Contracts | Yes | Yes | No | View only |
| Payments CRUD | Yes | Yes | Yes | View only |
| Expenses upload | Yes | Yes | Yes | No |
| Expense categorize | Yes | Yes | Yes | No |
| Analytics | Full | Full | Financial | Limited |
| Targets CRUD | Yes | Yes | No | View only |
| Investor reports | Yes | No | No | No |
| Settings | Yes | No | No | No |
| User management | Yes | No | No | No |

## Implementation Notes

- Create a `useAuth` hook that returns `{ user, profile, role, isAdmin, isManagerOrAbove, isAccountantOrAbove }`
- Create a `withRole` HOC or wrapper component for page-level access control
- API routes should also check role from the session before performing mutations
- First user to sign up should be auto-assigned 'admin' role (check if profiles table is empty)

## Settings Page (Admin Only)

Route: `/settings`

Sections:
- Company Info (pre-filled, editable)
- User Management (invite users, change roles)
- Expense Categories (add/edit/reorder)
- Expense Rules (manage auto-categorization patterns)
- Invoice Settings (current sequence numbers, default tax rate, default payment terms)
- Email Templates (view/edit email content)
- Notification Preferences
