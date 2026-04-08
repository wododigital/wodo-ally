"use client";

import { UserPlus } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { cn } from "@/lib/utils/cn";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLE_DEFINITIONS = [
  { role: "admin",      label: "Admin",      color: "bg-accent/10 text-accent border-accent/20",                 description: "Full access to all features, settings, and user management." },
  { role: "manager",    label: "Manager",    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",           description: "Can manage clients, projects, invoices, and expenses. Cannot manage users or settings." },
  { role: "accountant", label: "Accountant", color: "bg-purple-500/10 text-purple-400 border-purple-500/20",     description: "Read-only access to invoices, payments, and expenses. Can record payments." },
  { role: "viewer",     label: "Viewer",     color: "bg-surface-DEFAULT text-text-muted border-black/[0.08]",    description: "Read-only access to all data. Cannot create or modify any records." },
];

// ---------------------------------------------------------------------------
// Tab: Users
// ---------------------------------------------------------------------------

export function UsersTab() {
  const users = [
    { name: "Shyam Singh Bhati", email: "accounts@wodo.digital", role: "admin", status: "Active" },
  ];

  return (
    <div className="space-y-5">
      <GlassCard padding="lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-text-primary">Team Members</h3>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-button text-sm font-semibold text-white transition-all"
            style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            <UserPlus className="w-4 h-4" />
            Invite User
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.05]">
                <th className="text-left pb-3 text-xs font-medium uppercase tracking-wider text-text-muted">Name</th>
                <th className="text-left pb-3 text-xs font-medium uppercase tracking-wider text-text-muted">Email</th>
                <th className="text-left pb-3 text-xs font-medium uppercase tracking-wider text-text-muted">Role</th>
                <th className="text-left pb-3 text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
                <th className="pb-3 w-16" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const roleDef = ROLE_DEFINITIONS.find((r) => r.role === user.role);
                return (
                  <tr key={user.email} className="border-b border-black/[0.05] last:border-0">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-xs font-bold text-accent shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-text-primary whitespace-nowrap">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <span className="text-sm text-text-secondary">{user.email}</span>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", roleDef?.color ?? "bg-surface-DEFAULT text-text-muted border-black/[0.08]")}>
                        {roleDef?.label ?? user.role}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                        {user.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button className="text-xs text-text-muted hover:text-text-secondary transition-colors px-2 py-1 rounded-button hover:bg-surface-DEFAULT">
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard padding="lg">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Role Permissions</h3>
        <div className="space-y-3">
          {ROLE_DEFINITIONS.map((r) => (
            <div key={r.role} className="flex items-start gap-3">
              <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border shrink-0 mt-0.5", r.color)}>
                {r.label}
              </span>
              <p className="text-sm text-text-secondary">{r.description}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
