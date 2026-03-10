import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import { useTenantScope } from '../../hooks/useTenantScope';
import { router } from '@inertiajs/react';
import {
    DocumentChartBarIcon,
    DocumentTextIcon,
    ArrowDownTrayIcon,
    UsersIcon,
    ShieldExclamationIcon,
    ComputerDesktopIcon,
    CreditCardIcon,
    SignalIcon,
    ChartBarIcon,
    SparklesIcon,
    ServerStackIcon,
    KeyIcon,
    ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';

const reports = [
    {
        title: 'Tenant Report',
        description: 'All managed tenants with GDAP status, integration status, and assigned engineers.',
        endpoint: '/api/v1/reports/tenants',
        icon: UsersIcon,
        color: 'blue' as const,
    },
    {
        title: 'Findings Report',
        description: 'All findings with severity, category, impact, and remediation details.',
        endpoint: '/api/v1/reports/findings',
        icon: ShieldExclamationIcon,
        color: 'red' as const,
    },
    {
        title: 'Scores Report',
        description: 'All tenant health scores across six scoring categories.',
        endpoint: '/api/v1/reports/scores',
        icon: ChartBarIcon,
        color: 'emerald' as const,
    },
    {
        title: 'Identity Report',
        description: 'User directory with MFA status, sign-in activity, and role assignments.',
        endpoint: '/api/v1/reports/identity',
        icon: UsersIcon,
        color: 'purple' as const,
    },
    {
        title: 'Device Compliance',
        description: 'Device inventory with compliance state, OS, and management status.',
        endpoint: '/api/v1/reports/device-compliance',
        icon: ComputerDesktopIcon,
        color: 'cyan' as const,
    },
    {
        title: 'License Utilization',
        description: 'License allocation with assigned vs available units and waste percentage.',
        endpoint: '/api/v1/reports/license-utilization',
        icon: CreditCardIcon,
        color: 'amber' as const,
    },
    {
        title: 'Security Posture',
        description: 'Per-tenant composite and sub-category security scores.',
        endpoint: '/api/v1/reports/security-posture',
        icon: ShieldExclamationIcon,
        color: 'emerald' as const,
    },
    {
        title: 'Service Health',
        description: 'Microsoft 365 service health events, incidents, and advisories.',
        endpoint: '/api/v1/reports/service-health',
        icon: SignalIcon,
        color: 'blue' as const,
    },
    {
        title: 'Copilot Usage',
        description: 'Per-user Copilot activity across Teams, Word, Excel, PowerPoint, and Outlook.',
        endpoint: '/api/v1/reports/copilot-usage',
        icon: SparklesIcon,
        color: 'purple' as const,
    },
    {
        title: 'SharePoint Sites',
        description: 'SharePoint site inventory with sharing, storage, sensitivity labels, and guest access.',
        endpoint: '/api/v1/reports/sharepoint-sites',
        icon: ServerStackIcon,
        color: 'cyan' as const,
    },
    {
        title: 'Admin Accounts',
        description: 'Directory role assignments with assignment type, status, and tenant mapping.',
        endpoint: '/api/v1/reports/admin-accounts',
        icon: KeyIcon,
        color: 'amber' as const,
    },
    {
        title: 'Guest Users',
        description: 'External guest user inventory with domain, state, and sign-in activity.',
        endpoint: '/api/v1/reports/guest-users',
        icon: UsersIcon,
        color: 'purple' as const,
    },
    {
        title: 'Risky Users',
        description: 'Identity Protection risky users with risk level, state, and detail.',
        endpoint: '/api/v1/reports/risky-users',
        icon: ShieldExclamationIcon,
        color: 'red' as const,
    },
    {
        title: 'Conditional Access',
        description: 'Conditional Access policies with state, conditions, and grant controls.',
        endpoint: '/api/v1/reports/conditional-access',
        icon: KeyIcon,
        color: 'purple' as const,
    },
    {
        title: 'Sign-In Activity',
        description: 'Sign-in summaries with success rates, MFA metrics, and failure reasons.',
        endpoint: '/api/v1/reports/sign-in-activity',
        icon: ChartBarIcon,
        color: 'blue' as const,
    },
    {
        title: 'Auth Methods',
        description: 'Authentication method adoption per tenant with MFA and SSPR coverage.',
        endpoint: '/api/v1/reports/auth-methods',
        icon: KeyIcon,
        color: 'cyan' as const,
    },
    {
        title: 'Alerts',
        description: 'System alerts with severity, status, and acknowledgement details.',
        endpoint: '/api/v1/reports/alerts',
        icon: ShieldExclamationIcon,
        color: 'amber' as const,
    },
    {
        title: 'Recommendations',
        description: 'Security recommendations with priority, status, and action URLs.',
        endpoint: '/api/v1/reports/recommendations',
        icon: ChartBarIcon,
        color: 'emerald' as const,
    },
    {
        title: 'Compliance Controls',
        description: 'Compliance framework controls with compliance status and open findings.',
        endpoint: '/api/v1/reports/compliance',
        icon: DocumentChartBarIcon,
        color: 'emerald' as const,
    },
    {
        title: 'Copilot Agents',
        description: 'Copilot agent inventory with type, status, and interaction counts.',
        endpoint: '/api/v1/reports/copilot-agents',
        icon: SparklesIcon,
        color: 'purple' as const,
    },
    {
        title: 'Sync Runs',
        description: 'Sync operation history with status, records processed, and duration.',
        endpoint: '/api/v1/reports/sync-runs',
        icon: ServerStackIcon,
        color: 'blue' as const,
    },
    {
        title: 'Copilot Audit',
        description: 'Comprehensive audit across 6 categories with check status, values, and remediation.',
        endpoint: '/api/v1/reports/copilot-audit',
        icon: ClipboardDocumentCheckIcon,
        color: 'emerald' as const,
    },
];

const iconBg: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
    cyan: 'bg-cyan-50 text-cyan-600',
};

export default function ReportsIndex() {
    const { selectedTenantId, selectedTenant, buildUrl, isFiltered } = useTenantScope();

    const handleExport = (endpoint: string) => {
        window.open(buildUrl(endpoint), '_blank');
    };

    const pdfReports = [
        { title: 'Security Dashboard', description: 'Security posture summary with findings breakdown, GDAP coverage, and tenant rankings.', href: '/security', icon: ShieldExclamationIcon, color: 'red' as const },
        { title: 'Security Posture', description: 'Pillar score gauges, trend analysis, and per-tenant score comparison.', href: '/security/posture', icon: ChartBarIcon, color: 'emerald' as const },
        { title: 'Compliance Audit', description: 'Framework compliance percentages and control-by-control status report.', href: '/security/compliance', icon: DocumentChartBarIcon, color: 'emerald' as const },
        { title: 'Findings Report', description: 'All findings with severity, category, status, and remediation details.', href: '/findings', icon: ShieldExclamationIcon, color: 'red' as const },
        { title: 'Identity Overview', description: 'MFA coverage, risky users breakdown, and identity health summary.', href: '/identity', icon: UsersIcon, color: 'purple' as const },
        { title: 'Device Compliance', description: 'OS distribution, compliance by tenant, and device inventory.', href: '/devices', icon: ComputerDesktopIcon, color: 'cyan' as const },
        { title: 'License Utilization', description: 'SKU utilization, waste analysis, and per-tenant license breakdown.', href: '/licensing', icon: CreditCardIcon, color: 'amber' as const },
        { title: 'Copilot Readiness', description: 'Readiness scores, pillar breakdown, adoption funnel, and tenant comparison.', href: '/copilot', icon: SparklesIcon, color: 'purple' as const },
        { title: 'Copilot Audit', description: 'Comprehensive 6-category audit with category scores, check details, and remediation.', href: '/copilot/audit', icon: ClipboardDocumentCheckIcon, color: 'emerald' as const },
    ];

    return (
        <AppLayout title="Reports">
            <PageHeader
                title="Reports"
                subtitle={isFiltered ? `Export data reports for ${selectedTenant?.customer_name}` : 'Export data reports as CSV'}
                breadcrumbs={[{ label: 'Operations' }, { label: 'Reports' }]}
            />

            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                <StatCard label="Available Reports" value={reports.length} icon={DocumentChartBarIcon} accentColor="blue" />
                <StatCard label="PDF Reports" value={pdfReports.length} icon={DocumentTextIcon} accentColor="purple" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {reports.map((report) => {
                    const Icon = report.icon;
                    return (
                        <div key={report.endpoint} className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md">
                            <div className="mb-3 flex items-center gap-3">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg[report.color]}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <h3 className="text-sm font-semibold text-slate-800">{report.title}</h3>
                            </div>
                            <p className="mb-4 text-xs text-slate-500 leading-relaxed">{report.description}</p>
                            <button
                                onClick={() => handleExport(report.endpoint)}
                                className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                            >
                                <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                                Export CSV
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* PDF Reports Section */}
            <div className="mt-10">
                <h2 className="text-lg font-bold text-slate-900 mb-1">PDF Reports</h2>
                <p className="text-sm text-slate-500 mb-4">Branded PDF reports with charts and tables. Navigate to each page to generate.</p>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {pdfReports.map((report) => {
                        const Icon = report.icon;
                        return (
                            <div key={report.href} className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md">
                                <div className="mb-3 flex items-center gap-3">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg[report.color]}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-slate-800">{report.title}</h3>
                                </div>
                                <p className="mb-4 text-xs text-slate-500 leading-relaxed">{report.description}</p>
                                <button
                                    onClick={() => router.visit(report.href)}
                                    className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                                >
                                    <DocumentTextIcon className="h-3.5 w-3.5" />
                                    Open Page &rarr;
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}
