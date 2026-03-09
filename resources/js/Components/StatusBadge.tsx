type Variant = 'critical' | 'high' | 'medium' | 'low' | 'success' | 'warning' | 'info' | 'neutral'
    | 'enabled' | 'disabled' | 'reportOnly' | 'active' | 'expired' | 'pending' | 'compliant' | 'nonCompliant';

const variantStyles: Record<Variant, string> = {
    critical: 'bg-red-100 text-red-700 ring-red-600/20',
    high: 'bg-orange-100 text-orange-700 ring-orange-600/20',
    medium: 'bg-amber-100 text-amber-700 ring-amber-600/20',
    low: 'bg-blue-100 text-blue-700 ring-blue-600/20',
    success: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
    warning: 'bg-amber-100 text-amber-700 ring-amber-600/20',
    info: 'bg-blue-100 text-blue-700 ring-blue-600/20',
    neutral: 'bg-slate-100 text-slate-600 ring-slate-500/20',
    enabled: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
    disabled: 'bg-slate-100 text-slate-500 ring-slate-400/20',
    reportOnly: 'bg-blue-100 text-blue-700 ring-blue-600/20',
    active: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
    expired: 'bg-red-100 text-red-700 ring-red-600/20',
    pending: 'bg-amber-100 text-amber-700 ring-amber-600/20',
    compliant: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
    nonCompliant: 'bg-red-100 text-red-700 ring-red-600/20',
};

type Props = {
    variant: Variant;
    label: string;
    size?: 'sm' | 'md';
    dot?: boolean;
};

export default function StatusBadge({ variant, label, size = 'sm', dot }: Props) {
    const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

    return (
        <span className={`inline-flex items-center gap-1 rounded-full font-medium ring-1 ring-inset ${variantStyles[variant]} ${sizeClass}`}>
            {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
            {label}
        </span>
    );
}
