import { Link, usePage } from '@inertiajs/react';
import type { NavItem } from '../types';

type Props = {
    item: NavItem;
};

export default function SidebarNavItem({ item }: Props) {
    const { url } = usePage();
    const isActive =
        url === item.href ||
        (item.href !== '/dashboard' && url.startsWith(item.href + '/'));

    return (
        <Link
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                    ? 'bg-slate-800 font-medium text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
        >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {item.label}
        </Link>
    );
}
