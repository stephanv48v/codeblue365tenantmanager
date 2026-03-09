import { Link } from '@inertiajs/react';
import type { ComponentType, SVGProps } from 'react';

type Props = {
    label: string;
    value: number | string;
    icon?: ComponentType<SVGProps<SVGSVGElement>>;
    href?: string;
    accentColor?: 'emerald' | 'red' | 'amber' | 'blue' | 'slate' | 'purple' | 'cyan';
    badge?: { text: string; color: 'red' | 'amber' | 'emerald' | 'blue' | 'purple' | 'cyan' };
    trend?: { value: string; direction: 'up' | 'down' | 'neutral' };
    subtitle?: string;
};

const accents: Record<string, string> = {
    emerald: 'border-l-emerald-500',
    red: 'border-l-red-500',
    amber: 'border-l-amber-500',
    blue: 'border-l-blue-500',
    slate: 'border-l-slate-400',
    purple: 'border-l-purple-500',
    cyan: 'border-l-cyan-500',
};

const iconBg: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    slate: 'bg-slate-100 text-slate-500',
    purple: 'bg-purple-50 text-purple-600',
    cyan: 'bg-cyan-50 text-cyan-600',
};

const badgeColors: Record<string, string> = {
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    cyan: 'bg-cyan-100 text-cyan-700',
};

const trendColors: Record<string, string> = {
    up: 'text-emerald-600',
    down: 'text-red-600',
    neutral: 'text-slate-400',
};

const trendIcons: Record<string, string> = {
    up: '\u2191',
    down: '\u2193',
    neutral: '\u2192',
};

export default function StatCard({ label, value, icon: Icon, href, accentColor = 'blue', badge, trend, subtitle }: Props) {
    const content = (
        <div className={`rounded-xl border border-l-4 ${accents[accentColor]} bg-white p-5 transition-shadow hover:shadow-md ${href ? 'cursor-pointer' : ''}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
                    <div className="mt-1 flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-slate-900">{value}</p>
                        {trend && (
                            <span className={`text-xs font-medium ${trendColors[trend.direction]}`}>
                                {trendIcons[trend.direction]} {trend.value}
                            </span>
                        )}
                    </div>
                    {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
                    {badge && (
                        <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badgeColors[badge.color]}`}>
                            {badge.text}
                        </span>
                    )}
                </div>
                {Icon && (
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg[accentColor]}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                )}
            </div>
        </div>
    );

    if (href) {
        return <Link href={href}>{content}</Link>;
    }

    return content;
}
