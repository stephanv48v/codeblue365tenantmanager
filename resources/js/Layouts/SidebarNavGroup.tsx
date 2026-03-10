import { useState, useCallback } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { NavItem } from '../types';
import SidebarNavItem from './SidebarNavItem';

type Props = {
    title: string;
    items: NavItem[];
    userRoles: string[];
};

function getInitialExpanded(title: string): boolean {
    try {
        const saved = sessionStorage.getItem('sidebar-groups');
        if (saved) {
            const state = JSON.parse(saved);
            if (title in state) return state[title];
        }
    } catch { /* ignore */ }
    return true;
}

function saveGroupState(title: string, expanded: boolean) {
    try {
        const saved = sessionStorage.getItem('sidebar-groups');
        const state = saved ? JSON.parse(saved) : {};
        state[title] = expanded;
        sessionStorage.setItem('sidebar-groups', JSON.stringify(state));
    } catch { /* ignore */ }
}

export default function SidebarNavGroup({ title, items, userRoles }: Props) {
    const [expanded, setExpanded] = useState(() => getInitialExpanded(title));

    const isAdmin = userRoles.includes('platform-super-admin');
    const visible = items.filter(
        (item) => !item.requiredRole || isAdmin || userRoles.includes(item.requiredRole),
    );

    if (visible.length === 0) return null;

    return (
        <div className="mb-3">
            <button
                onClick={() => {
                    const next = !expanded;
                    setExpanded(next);
                    saveGroupState(title, next);
                }}
                className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300"
            >
                {title}
                {expanded ? (
                    <ChevronDownIcon className="h-3.5 w-3.5" />
                ) : (
                    <ChevronRightIcon className="h-3.5 w-3.5" />
                )}
            </button>
            {expanded && (
                <div className="mt-1 space-y-0.5">
                    {visible.map((item) => (
                        <SidebarNavItem key={item.href} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
}
