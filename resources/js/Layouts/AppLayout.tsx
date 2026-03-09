import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { SharedPageProps } from '../types';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

type Props = {
    title: string;
    children: React.ReactNode;
};

export default function AppLayout({ title, children }: Props) {
    const { auth } = usePage<SharedPageProps>().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const user = auth.user ?? { id: 0, name: 'Guest', email: '', roles: [] };

    return (
        <div className="flex h-screen overflow-hidden bg-slate-100">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="fixed inset-0 bg-slate-900/80"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <div className="fixed inset-0 flex">
                        <div className="relative mr-16 flex w-full max-w-64">
                            <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                                <button onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5">
                                    <XMarkIcon className="h-6 w-6 text-white" />
                                </button>
                            </div>
                            <Sidebar user={user} />
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop sidebar */}
            <aside className="hidden w-64 flex-shrink-0 lg:flex">
                <Sidebar user={user} />
            </aside>

            {/* Main content area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <TopHeader title={title} user={user} onMenuToggle={() => setSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
        </div>
    );
}
