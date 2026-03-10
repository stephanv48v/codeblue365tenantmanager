import { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatusBadge from '../../Components/StatusBadge';
import SkeletonLoader from '../../Components/SkeletonLoader';
import SectionHeader from '../../Components/SectionHeader';
import ExportButton from '../../Components/ExportButton';
import { usePdfReport } from '../../hooks/usePdfReport';
import { useTenantScope } from '../../hooks/useTenantScope';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import {
    useComplianceData,
    type FrameworkSummary,
    type ComplianceControl,
} from './hooks/useComplianceData';

const statusVariant = (status: ComplianceControl['status']) => {
    switch (status) {
        case 'compliant':
            return 'success' as const;
        case 'non_compliant':
            return 'critical' as const;
        case 'not_mapped':
            return 'neutral' as const;
    }
};

const statusLabel = (status: ComplianceControl['status']) => {
    switch (status) {
        case 'compliant':
            return 'Compliant';
        case 'non_compliant':
            return 'Non-Compliant';
        case 'not_mapped':
            return 'Not Mapped';
    }
};

function FrameworkCard({
    fw,
    isSelected,
    onSelect,
}: {
    fw: FrameworkSummary;
    isSelected: boolean;
    onSelect: () => void;
}) {
    const pct = fw.compliance_pct;
    const color = pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
    const bgColor =
        pct >= 80 ? 'bg-emerald-50' : pct >= 60 ? 'bg-amber-50' : 'bg-red-50';
    const borderColor = isSelected
        ? 'ring-2 ring-blue-500 border-blue-200'
        : 'border-slate-200';

    return (
        <button
            onClick={onSelect}
            className={`rounded-xl border ${borderColor} bg-white p-6 text-left transition-all hover:shadow-md w-full`}
        >
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                        {fw.name}
                    </h3>
                    {fw.version && (
                        <p className="text-xs text-slate-400 mt-0.5">
                            {fw.version}
                        </p>
                    )}
                </div>
                <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${bgColor}`}
                >
                    <span className="text-lg font-bold" style={{ color }}>
                        {pct}%
                    </span>
                </div>
            </div>
            {fw.description && (
                <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                    {fw.description}
                </p>
            )}
            <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>
                        {fw.compliant_controls} / {fw.total_controls} controls
                        compliant
                    </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                    <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                            width: `${pct}%`,
                            backgroundColor: color,
                        }}
                    />
                </div>
            </div>
        </button>
    );
}

export default function ComplianceOverview() {
    const {
        frameworks,
        selectedFramework,
        loading,
        detailLoading,
        selectFramework,
    } = useComplianceData();
    const { generating, generateReport } = usePdfReport();
    const { selectedTenant, isFiltered } = useTenantScope();
    const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

    const handleToggle = (slug: string) => {
        if (expandedSlug === slug) {
            setExpandedSlug(null);
            selectFramework(null);
        } else {
            setExpandedSlug(slug);
            selectFramework(slug);
        }
    };

    const handlePdfExport = async () => {
        const totalCtrl = frameworks.reduce((s, fw) => s + fw.total_controls, 0);
        const totalComp = frameworks.reduce((s, fw) => s + fw.compliant_controls, 0);
        const avgComp = frameworks.length > 0
            ? Math.round(frameworks.reduce((s, fw) => s + fw.compliance_pct, 0) / frameworks.length)
            : 0;

        // Build rows from all frameworks' controls (if detail is loaded, use it; otherwise summarize from framework list)
        const controlRows: string[][] = [];
        if (selectedFramework) {
            for (const c of selectedFramework.controls) {
                controlRows.push([
                    selectedFramework.framework.name,
                    c.control_ref,
                    c.title,
                    c.category || 'General',
                    c.status === 'compliant' ? 'Compliant' : c.status === 'non_compliant' ? 'Non-Compliant' : 'Not Mapped',
                ]);
            }
        }

        await generateReport({
            title: 'Compliance Overview',
            subtitle: isFiltered && selectedTenant ? selectedTenant.customer_name : 'All Tenants',
            orientation: 'portrait',
            sections: [
                {
                    type: 'stats',
                    data: [
                        { label: 'Total Frameworks', value: frameworks.length },
                        { label: 'Avg Compliance', value: `${avgComp}%` },
                        { label: 'Controls Assessed', value: `${totalComp} / ${totalCtrl}` },
                    ],
                },
                {
                    type: 'table',
                    title: 'Framework Summary',
                    headers: ['Framework', 'Version', 'Compliance %', 'Compliant Controls', 'Total Controls'],
                    rows: frameworks.map((fw) => [
                        fw.name,
                        fw.version || '-',
                        `${fw.compliance_pct}%`,
                        String(fw.compliant_controls),
                        String(fw.total_controls),
                    ]),
                },
                ...(controlRows.length > 0
                    ? [{
                        type: 'table' as const,
                        title: 'Controls Detail',
                        headers: ['Framework', 'Control Ref', 'Title', 'Category', 'Status'],
                        rows: controlRows,
                    }]
                    : []),
            ],
        });
    };

    if (loading) {
        return (
            <AppLayout title="Compliance Overview">
                <PageHeader
                    title="Compliance Overview"
                    subtitle="Framework compliance mapped to security findings"
                    breadcrumbs={[
                        {
                            label: 'Security & Compliance',
                            href: '/security',
                        },
                        { label: 'Compliance' },
                    ]}
                    actions={<ExportButton csvEndpoint="/api/v1/reports/compliance" onExportPdf={handlePdfExport} pdfGenerating={generating} />}
                />
                <div className="mb-6 grid gap-6 md:grid-cols-3">
                    <SkeletonLoader
                        variant="stat-card"
                        count={3}
                        className="contents"
                    />
                </div>
            </AppLayout>
        );
    }

    if (frameworks.length === 0) {
        return (
            <AppLayout title="Compliance Overview">
                <PageHeader
                    title="Compliance Overview"
                    subtitle="Framework compliance mapped to security findings"
                    breadcrumbs={[
                        {
                            label: 'Security & Compliance',
                            href: '/security',
                        },
                        { label: 'Compliance' },
                    ]}
                    actions={<ExportButton csvEndpoint="/api/v1/reports/compliance" onExportPdf={handlePdfExport} pdfGenerating={generating} />}
                />
                <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white">
                    <p className="text-sm text-slate-400">
                        No compliance frameworks available.
                    </p>
                </div>
            </AppLayout>
        );
    }

    const totalControls = frameworks.reduce(
        (s, fw) => s + fw.total_controls,
        0,
    );
    const totalCompliant = frameworks.reduce(
        (s, fw) => s + fw.compliant_controls,
        0,
    );
    const avgCompliance =
        frameworks.length > 0
            ? Math.round(
                  frameworks.reduce((s, fw) => s + fw.compliance_pct, 0) /
                      frameworks.length,
              )
            : 0;

    // Build grouped controls when a framework detail is loaded
    let grouped: Record<string, ComplianceControl[]> = {};
    if (selectedFramework) {
        grouped = selectedFramework.controls.reduce(
            (acc, c) => {
                const cat = c.category || 'General';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(c);
                return acc;
            },
            {} as Record<string, ComplianceControl[]>,
        );
    }

    return (
        <AppLayout title="Compliance Overview">
            <PageHeader
                title="Compliance Overview"
                subtitle="Framework compliance mapped to security findings"
                breadcrumbs={[
                    { label: 'Security & Compliance', href: '/security' },
                    { label: 'Compliance' },
                ]}
                actions={<ExportButton csvEndpoint="/api/v1/reports/compliance" onExportPdf={handlePdfExport} pdfGenerating={generating} />}
            />

            {/* Overall Stats */}
            <div className="mb-6 grid gap-4 grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Total Frameworks
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                        {frameworks.length}
                    </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Avg Compliance
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                        {avgCompliance}%
                    </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Controls Assessed
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                        {totalCompliant}{' '}
                        <span className="text-sm font-normal text-slate-400">
                            / {totalControls}
                        </span>
                    </p>
                </div>
            </div>

            {/* Framework Cards */}
            <div className="mb-6 grid gap-6 md:grid-cols-3">
                {frameworks.map((fw) => (
                    <FrameworkCard
                        key={fw.id}
                        fw={fw}
                        isSelected={expandedSlug === fw.slug}
                        onSelect={() => handleToggle(fw.slug)}
                    />
                ))}
            </div>

            {/* Selected Framework Detail */}
            {expandedSlug && (
                <div className="mb-6">
                    {detailLoading ? (
                        <SkeletonLoader variant="table" count={8} />
                    ) : selectedFramework ? (
                        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                            {/* Detail Header */}
                            <div className="border-b border-slate-200 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-sm font-semibold text-slate-800">
                                            {selectedFramework.framework.name}
                                        </h3>
                                        {selectedFramework.framework
                                            .version && (
                                            <span className="text-xs text-slate-400">
                                                {
                                                    selectedFramework.framework
                                                        .version
                                                }
                                            </span>
                                        )}
                                        <StatusBadge
                                            variant={
                                                selectedFramework.summary
                                                    .compliance_pct >= 80
                                                    ? 'success'
                                                    : selectedFramework.summary
                                                            .compliance_pct >=
                                                        60
                                                      ? 'warning'
                                                      : 'critical'
                                            }
                                            label={`${selectedFramework.summary.compliance_pct}% Compliant`}
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            setExpandedSlug(null);
                                            selectFramework(null);
                                        }}
                                        className="text-xs font-medium text-blue-600 hover:text-blue-700"
                                    >
                                        &larr; Back to Overview
                                    </button>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">
                                    {selectedFramework.summary.compliant}{' '}
                                    compliant,{' '}
                                    {selectedFramework.summary.non_compliant}{' '}
                                    non-compliant out of{' '}
                                    {selectedFramework.summary.total_controls}{' '}
                                    controls
                                </p>
                            </div>

                            {/* Controls Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b border-slate-200 bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                                Control Ref
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                                Title
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                                Category
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                                Findings
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {Object.entries(grouped).map(
                                            ([category, controls]) => (
                                                <>
                                                    {/* Category Header Row */}
                                                    <tr
                                                        key={`cat-${category}`}
                                                        className="bg-slate-50/80"
                                                    >
                                                        <td
                                                            colSpan={5}
                                                            className="px-4 py-2"
                                                        >
                                                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                                {category}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    {/* Control Rows */}
                                                    {controls.map(
                                                        (control) => (
                                                            <tr
                                                                key={control.id}
                                                                className="hover:bg-slate-50/50"
                                                            >
                                                                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-medium text-slate-600">
                                                                    {
                                                                        control.control_ref
                                                                    }
                                                                </td>
                                                                <td className="max-w-xs px-4 py-3 text-slate-700">
                                                                    <div>
                                                                        <p className="text-sm">
                                                                            {
                                                                                control.title
                                                                            }
                                                                        </p>
                                                                        {control.description && (
                                                                            <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">
                                                                                {
                                                                                    control.description
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                                                                    {control.category ||
                                                                        'General'}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <StatusBadge
                                                                        variant={statusVariant(
                                                                            control.status,
                                                                        )}
                                                                        label={statusLabel(
                                                                            control.status,
                                                                        )}
                                                                        dot
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    {control.open_findings >
                                                                    0 ? (
                                                                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                                                            {
                                                                                control.open_findings
                                                                            }{' '}
                                                                            open
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-xs text-slate-400">
                                                                            --
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )}
                                                </>
                                            ),
                                        )}
                                        {selectedFramework.controls.length ===
                                            0 && (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="px-6 py-12 text-center text-slate-400"
                                                >
                                                    No controls available for
                                                    this framework.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
        </AppLayout>
    );
}
