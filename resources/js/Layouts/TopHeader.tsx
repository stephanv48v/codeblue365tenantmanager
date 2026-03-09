import {
    Bars3Icon,
    MagnifyingGlassIcon,
    BellIcon,
    Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';
import type { AuthUser } from '../types';

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
            {/* Left: hamburger + title */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuToggle}
                    className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
                >
                    <Bars3Icon className="h-6 w-6" />
                </button>
                <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
            </div>

            {/* Center: search */}
            <div className="hidden items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 md:flex">
                <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search..."
                    className="border-0 bg-transparent text-sm text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-0"
                    style={{ width: '200px' }}
                />
            </div>

            {/* Right: icons + avatar */}
            <div className="flex items-center gap-3">
                <button className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
                    <BellIcon className="h-5 w-5" />
                </button>
                <Link href="/settings" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
                    <Cog6ToothIcon className="h-5 w-5" />
                </Link>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                    {initials}
                </div>
            </div>
        </header>
    );
}
