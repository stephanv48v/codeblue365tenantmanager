import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import { useTenantScope } from '../../hooks/useTenantScope';
import {
    DocumentChartBarIcon,
    ArrowDownTrayIcon,
    UsersIcon,
    ShieldExclamationIcon,
    ComputerDesktopIcon,
    CreditCardIcon,
    SignalIcon,
    ChartBarIcon,
    SparklesIcon,
    ServerStackIcon,
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

    return (
        <AppLayout title="Reports">
            <PageHeader
                title="Reports"
                subtitle={isFiltered ? `Export data reports for ${selectedTenant?.customer_name}` : 'Export data reports as CSV'}
                breadcrumbs={[{ label: 'Operations' }, { label: 'Reports' }]}
            />

            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                <StatCard label="Available Reports" value={reports.length} icon={DocumentChartBarIcon} accentColor="blue" />
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
        </AppLayout>
    );
}
