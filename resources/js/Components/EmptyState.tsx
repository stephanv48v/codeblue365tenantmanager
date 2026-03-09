import type { ComponentType, ReactNode, SVGProps } from 'react';

type Props = {
    icon?: ComponentType<SVGProps<SVGSVGElement>>;
    title: string;
    description?: string;
    action?: ReactNode;
};

export default function EmptyState({ icon: Icon, title, description, action }: Props) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-12 text-center">
            {Icon && (
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <Icon className="h-6 w-6 text-slate-400" />
                </div>
            )}
            <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
            {description && <p className="mt-1 max-w-sm text-xs text-slate-400">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
