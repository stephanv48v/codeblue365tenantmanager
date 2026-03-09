import {
    HomeIcon,
    BuildingOfficeIcon,
    PuzzlePieceIcon,
    HeartIcon,
    BookOpenIcon,
    ShieldExclamationIcon,
    ShieldCheckIcon,
    BellAlertIcon,
    CogIcon,
    DocumentChartBarIcon,
    WrenchScrewdriverIcon,
    UsersIcon,
    ComputerDesktopIcon,
    CreditCardIcon,
    KeyIcon,
    ExclamationTriangleIcon,
    SignalIcon,
} from '@heroicons/react/24/outline';
import type { AuthUser, NavGroup } from '../types';
import SidebarNavGroup from './SidebarNavGroup';

const navGroups: NavGroup[] = [
    {
        title: 'Overview',
        items: [{ label: 'Dashboard', href: '/dashboard', icon: HomeIcon }],
    },
    {
        title: 'Customers',
        items: [
            { label: 'Tenants', href: '/tenants', icon: BuildingOfficeIcon, requiredRole: 'engineer' },
        ],
    },
    {
        title: 'Identity',
        items: [
            { label: 'Overview', href: '/identity', icon: UsersIcon, requiredRole: 'engineer' },
            { label: 'Users', href: '/identity/users', icon: UsersIcon, requiredRole: 'engineer' },
            { label: 'Risky Users', href: '/identity/risky-users', icon: ExclamationTriangleIcon, requiredRole: 'security-admin' },
            { label: 'Conditional Access', href: '/identity/conditional-access', icon: KeyIcon, requiredRole: 'security-admin' },
        ],
    },
    {
        title: 'Devices',
        items: [
            { label: 'Overview', href: '/devices', icon: ComputerDesktopIcon, requiredRole: 'engineer' },
        ],
    },
    {
        title: 'Security & Compliance',
        items: [
            { label: 'Security', href: '/security', icon: ShieldCheckIcon, requiredRole: 'security-admin' },
            { label: 'Findings', href: '/findings', icon: ShieldExclamationIcon, requiredRole: 'security-admin' },
            { label: 'Alerts', href: '/alerts', icon: BellAlertIcon, requiredRole: 'security-admin' },
        ],
    },
    {
        title: 'Licensing',
        items: [
            { label: 'Overview', href: '/licensing', icon: CreditCardIcon, requiredRole: 'engineer' },
        ],
    },
    {
        title: 'Service Health',
        items: [
            { label: 'Status', href: '/service-health', icon: SignalIcon, requiredRole: 'engineer' },
        ],
    },
    {
        title: 'Integrations',
        items: [
            { label: 'Integrations', href: '/integrations', icon: PuzzlePieceIcon, requiredRole: 'integration-admin' },
            { label: 'Health', href: '/integrations/health', icon: HeartIcon, requiredRole: 'integration-admin' },
            { label: 'Playbooks', href: '/playbooks', icon: BookOpenIcon, requiredRole: 'integration-admin' },
        ],
    },
    {
        title: 'Operations',
        items: [
            { label: 'Operations', href: '/operations', icon: CogIcon, requiredRole: 'engineer' },
            { label: 'Reports', href: '/reports', icon: DocumentChartBarIcon, requiredRole: 'engineer' },
        ],
    },
    {
        title: 'Administration',
        items: [
            { label: 'Settings', href: '/settings', icon: CogIcon, requiredRole: 'platform-super-admin' },
            { label: 'Audit Logs', href: '/admin', icon: WrenchScrewdriverIcon, requiredRole: 'platform-super-admin' },
        ],
    },
];

type Props = {
    user: AuthUser;
};

export default function Sidebar({ user }: Props) {
    const initials = user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="flex h-full flex-col bg-slate-900">
            {/* Brand */}
            <div className="flex items-center gap-3 border-b border-slate-700/50 px-5 py-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
                    CB
                </div>
                <div>
                    <p className="text-sm font-bold text-white">CodeBlue 365</p>
                    <p className="text-xs text-slate-500">Tenant Manager</p>
                </div>
            </div>

            {/* User profile */}
            <div className="flex items-center gap-3 border-b border-slate-700/50 px-5 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-slate-300">
                    {initials}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-200">{user.name}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-scroll flex-1 overflow-y-auto px-2 py-4">
                {navGroups.map((group) => (
                    <SidebarNavGroup
                        key={group.title}
                        title={group.title}
                        items={group.items}
                        userRoles={user.roles}
                    />
                ))}
            </nav>

            {/* Footer */}
            <div className="border-t border-slate-700/50 px-5 py-3">
                <p className="text-xs text-slate-600">v1.0.0</p>
            </div>
        </div>
    );
}
