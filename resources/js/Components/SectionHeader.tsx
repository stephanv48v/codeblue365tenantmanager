import { Link } from '@inertiajs/react';

type Props = {
    title: string;
    subtitle?: string;
    href?: string;
    linkText?: string;
};

export default function SectionHeader({ title, subtitle, href, linkText = 'View All' }: Props) {
    return (
        <div className="mb-4 flex items-center justify-between">
            <div>
                <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
                {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
            </div>
            {href && (
                <Link href={href} className="text-xs font-medium text-blue-600 hover:text-blue-700">
                    {linkText} &rarr;
                </Link>
            )}
        </div>
    );
}
