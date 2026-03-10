import { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import {
    BuildingOfficeIcon,
    MagnifyingGlassIcon,
    UsersIcon,
    PuzzlePieceIcon,
    ChartBarIcon,
    BellIcon,
    AdjustmentsHorizontalIcon,
    PaintBrushIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../../Components/PageHeader';
import BrandingSection from './sections/BrandingSection';
import PartnerTenantSection from './sections/PartnerTenantSection';
import TenantDiscoverySection from './sections/TenantDiscoverySection';
import UserManagementSection from './sections/UserManagementSection';
import IntegrationsSection from './sections/IntegrationsSection';
import ScoringSection from './sections/ScoringSection';
import NotificationsSection from './sections/NotificationsSection';
import ThresholdsSection from './sections/ThresholdsSection';

const sections = [
    { id: 'branding', label: 'Branding', icon: PaintBrushIcon },
    { id: 'partner-tenant', label: 'Partner Tenant', icon: BuildingOfficeIcon },
    { id: 'tenant-discovery', label: 'Tenant Discovery', icon: MagnifyingGlassIcon },
    { id: 'user-management', label: 'User Management', icon: UsersIcon },
    { id: 'integrations', label: 'Integrations', icon: PuzzlePieceIcon },
    { id: 'scoring', label: 'Scoring', icon: ChartBarIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'thresholds', label: 'Thresholds', icon: AdjustmentsHorizontalIcon },
] as const;

type SectionId = (typeof sections)[number]['id'];

export default function SettingsIndex() {
    const [activeSection, setActiveSection] = useState<SectionId>('branding');

    return (
        <AppLayout title="Settings">
            <PageHeader title="Settings" subtitle="Application configuration" breadcrumbs={[{ label: 'Administration' }, { label: 'Settings' }]} />
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar nav */}
                <nav className="w-full lg:w-56 flex-shrink-0">
                    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                        {sections.map((section) => {
                            const Icon = section.icon;
                            const active = activeSection === section.id;
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                                        active
                                            ? 'bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-600'
                                            : 'text-slate-600 hover:bg-slate-50 border-l-2 border-transparent'
                                    }`}
                                >
                                    <Icon className="h-5 w-5 flex-shrink-0" />
                                    {section.label}
                                </button>
                            );
                        })}
                    </div>
                </nav>

                {/* Content panel */}
                <div className="flex-1 min-w-0">
                    {activeSection === 'branding' && <BrandingSection />}
                    {activeSection === 'partner-tenant' && <PartnerTenantSection />}
                    {activeSection === 'tenant-discovery' && <TenantDiscoverySection />}
                    {activeSection === 'user-management' && <UserManagementSection />}
                    {activeSection === 'integrations' && <IntegrationsSection />}
                    {activeSection === 'scoring' && <ScoringSection />}
                    {activeSection === 'notifications' && <NotificationsSection />}
                    {activeSection === 'thresholds' && <ThresholdsSection />}
                </div>
            </div>
        </AppLayout>
    );
}
