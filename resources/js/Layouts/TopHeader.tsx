import {
    Bars3Icon,
    BellIcon,
    Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';
import type { AuthUser } from '../types';
import TenantSelector from '../Components/TenantSelector';

type Props = {
    title: string;
    user: AuthUser;
    onMenuToggle: () => void;
};

export default function TopHeader({ title, user, onMenuToggle }: Props) {
    const initials = user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
            {/* Left: hamburger + title + tenant selector */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuToggle}
                    aria-label="Toggle menu"
                    className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
                >
                    <Bars3Icon className="h-6 w-6" />
                </button>
                <h1 className="hidden text-lg font-semibold text-slate-900 md:block">{title}</h1>
                <span className="hidden h-6 w-px bg-slate-200 md:block" />
                <TenantSelector />
            </div>

            {/* Search - placeholder for future implementation */}
            <div className="hidden md:block" />

            {/* Right: icons + avatar */}
            <div className="flex items-center gap-3">
                <button aria-label="Notifications" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
                    <BellIcon className="h-5 w-5" />
                </button>
                <Link href="/settings" aria-label="Settings" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
                    <Cog6ToothIcon className="h-5 w-5" />
                </Link>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                    {initials}
                </div>
            </div>
        </header>
    );
}
