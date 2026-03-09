import AppLayout from '../../Layouts/AppLayout';
import {
    ComputerDesktopIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    CogIcon,
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import StatCard from '../../Components/StatCard';
import ChartCard from '../../Components/ChartCard';
import PageHeader from '../../Components/PageHeader';
import SkeletonLoader from '../../Components/SkeletonLoader';
import { useDevicesData } from './hooks/useDevicesData';

const OS_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];

export default function DevicesIndex() {
    const { overview, loading } = useDevicesData();

    if (loading) {
        return (
            <AppLayout title="Devices Overview">
                <PageHeader title="Devices" subtitle="Device compliance and inventory" />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    <SkeletonLoader variant="stat-card" count={5} className="contents" />
                </div>
            </AppLayout>
        );
    }

    const d = overview!;

    const osData = d.os_distribution.map((os, i) => ({
        name: os.operating_system || 'Unknown',
        value: os.count,
        fill: OS_COLORS[i % OS_COLORS.length],
    }));

    const complianceByTenant = d.compliance_by_tenant.map((t) => ({
        name: t.customer_name.length > 15 ? t.customer_name.slice(0, 15) + '...' : t.customer_name,
        compliant: t.compliant,
        nonCompliant: t.total - t.compliant,
    }));

    return (
        <AppLayout title="Devices Overview">
            <PageHeader
                title="Devices"
                subtitle="Device compliance and inventory across all tenants"
                breadcrumbs={[{ label: 'Devices' }]}
            />

            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                <StatCard label="Total Devices" value={d.total} icon={ComputerDesktopIcon} accentColor="blue" />
                <StatCard
                    label="Compliance Rate"
                    value={`${d.compliance_rate}%`}
                    icon={CheckCircleIcon}
                    accentColor={d.compliance_rate >= 90 ? 'emerald' : d.compliance_rate >= 70 ? 'amber' : 'red'}
                />
                <StatCard label="Compliant" value={d.compliant} accentColor="emerald" />
                <StatCard label="Non-Compliant" value={d.non_compliant} icon={ExclamationTriangleIcon} accentColor="red" />
                <StatCard label="Managed" value={d.managed} icon={CogIcon} accentColor="blue" subtitle={`${d.unmanaged} unmanaged`} />
            </div>

            <div className="mb-6 grid gap-6 lg:grid-cols-12">
                <ChartCard title="OS Distribution" className="lg:col-span-4">
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie data={osData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                                {osData.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Compliance by Tenant" className="lg:col-span-8">
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={complianceByTenant} layout="vertical">
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="compliant" name="Compliant" stackId="a" fill="#10b981" />
                            <Bar dataKey="nonCompliant" name="Non-Compliant" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
        </AppLayout>
    );
}
