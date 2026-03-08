import React from 'react';

type NavItem = {
  label: string;
  href: string;
  requiredRole?: string;
};

type Props = {
  title: string;
  children: React.ReactNode;
  userRoles?: string[];
};

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Tenants', href: '/tenants', requiredRole: 'engineer' },
  { label: 'Integrations', href: '/integrations', requiredRole: 'integration-admin' },
  { label: 'Playbooks', href: '/playbooks', requiredRole: 'integration-admin' },
  { label: 'Findings', href: '/findings', requiredRole: 'security-admin' },
];

export default function AppLayout({ title, children, userRoles = ['engineer'] }: Props) {
  const allowed = navItems.filter((item) => !item.requiredRole || userRoles.includes(item.requiredRole));

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b bg-white px-6 py-4">
        <h1 className="text-xl font-semibold">CodeBlue 365 Tenant Manager · {title}</h1>
        <nav className="mt-3 flex flex-wrap gap-2">
          {allowed.map((item) => (
            <a
              key={item.href}
              className="rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
              href={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
