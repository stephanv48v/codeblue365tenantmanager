import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { NavItem } from '../types';
import SidebarNavItem from './SidebarNavItem';

type Props = {
    title: string;
    items: NavItem[];
    userRoles: string[];
};

export default function SidebarNavGroup({ title, items, userRoles }: Props) {
    const [expanded, setExpanded] = useState(true);

    const isAdmin = userRoles.includes('platform-super-admin');
    const visible = items.filter(
        (item) => !item.requiredRole || isAdmin || userRoles.includes(item.requiredRole),
    );

    if (visible.length === 0) return null;

    return (
        <div className="mb-1">
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300"
            >
                {title}
                {expanded ? (
                    <ChevronDownIcon className="h-3.5 w-3.5" />
                ) : (
                    <ChevronRightIcon className="h-3.5 w-3.5" />
                )}
            </button>
            {expanded && (
                <div className="space-y-0.5 px-2">
                    {visible.map((item) => (
                        <SidebarNavItem key={item.href} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
}
