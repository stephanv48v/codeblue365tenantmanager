import type { ReactNode } from 'react';
import SectionHeader from './SectionHeader';

type Props = {
    title: string;
    subtitle?: string;
    href?: string;
    linkText?: string;
    children: ReactNode;
    className?: string;
    id?: string;
};

export default function ChartCard({ title, subtitle, href, linkText, children, className = '', id }: Props) {
    return (
        <div id={id} className={`rounded-xl border border-slate-200 bg-white p-6 ${className}`}>
            <SectionHeader title={title} subtitle={subtitle} href={href} linkText={linkText} />
            {children}
        </div>
    );
}
