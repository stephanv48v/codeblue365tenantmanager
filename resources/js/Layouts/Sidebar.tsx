import { useEffect, useRef } from 'react';
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
    FingerPrintIcon,
    UserPlusIcon,
    ArrowRightOnRectangleIcon,
    ArrowLeftOnRectangleIcon,
    SignalIcon,
    SparklesIcon,
    ChartBarIcon,
    CpuChipIcon,
    ServerStackIcon,
    ChartBarSquareIcon,
    LightBulbIcon,
    ClipboardDocumentCheckIcon,
    EnvelopeIcon,
    UserGroupIcon,
    CommandLineIcon,
    ChatBubbleLeftRightIcon,
    LockClosedIcon,
    BoltIcon,
    TicketIcon,
    CurrencyDollarIcon,
    ArrowsRightLeftIcon,
    BellIcon,
    PlayIcon,
    EyeIcon,
    GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import type { AuthUser, NavGroup } from '../types';
import SidebarNavGroup from './SidebarNavGroup';
import { useBranding } from '../contexts/BrandingContext';

const navGroups: NavGroup[] = [
    {
        title: 'Overview',
        items: [{ label: 'Dashboard', href: '/dashboard', icon: HomeIcon }],
    },
    {
        title: 'Customers',
        items: [
            { label: 'Tenants', href: '/tenants', icon: BuildingOfficeIcon, requiredRole: 'engineer' },
            { label: 'Comparison', href: '/tenant-comparison', icon: ArrowsRightLeftIcon, requiredRole: 'engineer' },
        ],
    },
    {
        title: 'Identity',
        items: [
            { label: 'Users', href: '/identity/users', icon: UsersIcon, requiredRole: 'engineer' },
            { label: 'Auth Methods', href: '/identity/auth-methods', icon: FingerPrintIcon, requiredRole: 'engineer' },
            { label: 'Admin Accounts', href: '/identity/admin-accounts', icon: KeyIcon, requiredRole: 'security-admin' },
            { label: 'Guest Users', href: '/identity/guest-users', icon: UserPlusIcon, requiredRole: 'engineer' },
            { label: 'Sign-In Activity', href: '/identity/sign-in-activity', icon: ArrowRightOnRectangleIcon, requiredRole: 'engineer' },
            { label: 'Password Health', href: '/identity/password-health', icon: KeyIcon, requiredRole: 'security-admin' },
            { label: 'PIM Activations', href: '/identity/pim', icon: ShieldCheckIcon, requiredRole: 'security-admin' },
            { label: 'Risky Users', href: '/identity/risky-users', icon: ExclamationTriangleIcon, requiredRole: 'security-admin' },
            { label: 'Conditional Access', href: '/identity/conditional-access', icon: KeyIcon, requiredRole: 'security-admin' },
        ],
    },
    {
        title: 'Email & Exchange',
        items: [
            { label: 'Mailboxes', href: '/exchange', icon: EnvelopeIcon, requiredRole: 'engineer' },
            { label: 'Forwarding Rules', href: '/exchange/forwarding', icon: ExclamationTriangleIcon, requiredRole: 'security-admin' },
            { label: 'Mail Flow Rules', href: '/exchange/mail-flow', icon: ArrowsRightLeftIcon, requiredRole: 'engineer' },
            { label: 'Distribution Lists', href: '/exchange/distribution-lists', icon: UserGroupIcon, requiredRole: 'engineer' },
        ],
    },
    {
        title: 'Groups',
        items: [
            { label: 'All Groups', href: '/groups', icon: UserGroupIcon, requiredRole: 'engineer' },
        ],
    },
    {
        title: 'Teams',
        items: [
            { label: 'Overview', href: '/teams', icon: ChatBubbleLeftRightIcon, requiredRole: 'engineer' },
            { label: 'Usage', href: '/teams/usage', icon: ChartBarIcon, requiredRole: 'engineer' },
        ],
    },
    {
        title: 'Copilot',
        items: [
            { label: 'Readiness', href: '/copilot', icon: SparklesIcon, requiredRole: 'engineer' },
            { label: 'Usage', href: '/copilot/usage', icon: ChartBarIcon, requiredRole: 'engineer' },
            { label: 'Agents', href: '/copilot/agents', icon: CpuChipIcon, requiredRole: 'engineer' },
            { label: 'SharePoint', href: '/copilot/sharepoint', icon: ServerStackIcon, requiredRole: 'engineer' },
            { label: 'Audit', href: '/copilot/audit', icon: ClipboardDocumentCheckIcon, requiredRole: 'engineer' },
        ],
    },
    {
        title: 'Devices',
        items: [
            { label: 'Overview', href: '/devices', icon: ComputerDesktopIcon, requiredRole: 'engineer' },
            { label: 'Compliance Policies', href: '/devices/compliance-policies', icon: ClipboardDocumentCheckIcon, requiredRole: 'engineer' },
            { label: 'Autopilot', href: '/devices/autopilot', icon: CpuChipIcon, requiredRole: 'engineer' },
        ],
    },
    {
        title: 'App Registrations',
        items: [
            { label: 'Applications', href: '/app-registrations', icon: CommandLineIcon, requiredRole: 'security-admin' },
        ],
    },
    {
        title: 'Security & Compliance',
        items: [
            { label: 'Security', href: '/security', icon: ShieldCheckIcon, requiredRole: 'security-admin' },
            { label: 'Posture', href: '/security/posture', icon: ChartBarSquareIcon, requiredRole: 'security-admin' },
            { label: 'Secure Score Actions', href: '/security/score-actions', icon: LightBulbIcon, requiredRole: 'security-admin' },
            { label: 'Defender Alerts', href: '/security/defender-alerts', icon: ShieldExclamationIcon, requiredRole: 'security-admin' },
            { label: 'Findings', href: '/findings', icon: ShieldExclamationIcon, requiredRole: 'security-admin' },
            { label: 'Recommendations', href: '/security/recommendations', icon: LightBulbIcon, requiredRole: 'security-admin' },
            { label: 'Compliance', href: '/security/compliance', icon: ClipboardDocumentCheckIcon, requiredRole: 'security-admin' },
            { label: 'DLP Policies', href: '/dlp', icon: LockClosedIcon, requiredRole: 'security-admin' },
            { label: 'Sensitivity Labels', href: '/dlp/labels', icon: LockClosedIcon, requiredRole: 'security-admin' },
            { label: 'Alerts', href: '/alerts', icon: BellAlertIcon, requiredRole: 'security-admin' },
        ],
    },
    {
        title: 'Licensing',
        items: [
            { label: 'Overview', href: '/licensing', icon: CreditCardIcon, requiredRole: 'engineer' },
            { label: 'Cost Analysis', href: '/licensing/cost-analysis', icon: CurrencyDollarIcon, requiredRole: 'engineer' },
        ],
    },
    {
        title: 'Power Platform',
        items: [
            { label: 'Overview', href: '/power-platform', icon: BoltIcon, requiredRole: 'engineer' },
            { label: 'Flows', href: '/power-platform/flows', icon: PlayIcon, requiredRole: 'engineer' },
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
            { label: 'ConnectWise', href: '/connectwise', icon: TicketIcon, requiredRole: 'integration-admin' },
        ],
    },
    {
        title: 'Operations',
        items: [
            { label: 'Operations', href: '/operations', icon: CogIcon, requiredRole: 'engineer' },
            { label: 'Remediation', href: '/remediation', icon: WrenchScrewdriverIcon, requiredRole: 'engineer' },
            { label: 'Reports', href: '/reports', icon: DocumentChartBarIcon, requiredRole: 'engineer' },
        ],
    },
    {
        title: 'Administration',
        items: [
            { label: 'Settings', href: '/settings', icon: CogIcon, requiredRole: 'platform-super-admin' },
            { label: 'Notifications', href: '/notifications', icon: BellIcon, requiredRole: 'platform-super-admin' },
            { label: 'Audit Logs', href: '/admin', icon: WrenchScrewdriverIcon, requiredRole: 'platform-super-admin' },
        ],
    },
];

type Props = {
    user: AuthUser;
};

export default function Sidebar({ user }: Props) {
    const branding = useBranding();
    const navRef = useRef<HTMLElement>(null);

    // Persist sidebar scroll position across Inertia navigations
    useEffect(() => {
        const nav = navRef.current;
        if (!nav) return;

        // Restore scroll position on mount
        const saved = sessionStorage.getItem('sidebar-scroll');
        if (saved) {
            nav.scrollTop = Number(saved);
        }

        // Save scroll position on every scroll
        const handleScroll = () => {
            sessionStorage.setItem('sidebar-scroll', String(nav.scrollTop));
        };
        nav.addEventListener('scroll', handleScroll, { passive: true });
        return () => nav.removeEventListener('scroll', handleScroll);
    }, []);

    const userInitials = user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const brandInitials = branding.company_name
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'CB';

    return (
        <div className="flex h-full flex-col bg-slate-900">
            {/* Brand */}
            <div className="flex items-center gap-3 border-b border-slate-700/50 px-5 py-5">
                {branding.logo_url ? (
                    <img
                        src={branding.logo_url}
                        alt={branding.company_name}
                        className="h-9 w-9 rounded-lg object-contain"
                    />
                ) : (
                    <div
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
                        style={{ backgroundColor: branding.primary_color }}
                    >
                        {brandInitials}
                    </div>
                )}
                <div>
                    <p className="text-sm font-bold text-white">{branding.company_name}</p>
                    <p className="text-xs text-slate-500">{branding.tagline}</p>
                </div>
            </div>

            {/* User profile */}
            <div className="flex items-center gap-3 border-b border-slate-700/50 px-5 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-slate-300">
                    {userInitials}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-200">{user.name}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
                <button
                    type="button"
                    onClick={() => router.post('/logout')}
                    title="Sign out"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-300"
                >
                    <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                </button>
            </div>

            {/* Navigation */}
            <nav ref={navRef} className="sidebar-scroll flex-1 overflow-y-auto px-3 py-3">
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
