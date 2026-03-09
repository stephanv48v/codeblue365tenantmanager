import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

type Breadcrumb = {
    label: string;
    href?: string;
};

type Props = {
    title: string;
    subtitle?: string;
    breadcrumbs?: Breadcrumb[];
    actions?: ReactNode;
};

export default function PageHeader({ title, subtitle, breadcrumbs, actions }: Props) {
    return (
        <div className="mb-6">
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="mb-2 flex items-center gap-1.5 text-xs text-slate-400">
                    {breadcrumbs.map((crumb, i) => (
                        <span key={i} className="flex items-center gap-1.5">
                            {i > 0 && <span>/</span>}
                            {crumb.href ? (
                                <Link href={crumb.href} className="hover:text-slate-600">
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span className="text-slate-600">{crumb.label}</span>
                            )}
                        </span>
                    ))}
                </nav>
            )}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">{title}</h1>
                    {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
        </div>
    );
}
