import { useEffect, useState, useCallback } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type FrameworkSummary = {
    id: number;
    name: string;
    slug: string;
    version: string | null;
    description: string | null;
    total_controls: number;
    compliant_controls: number;
    compliance_pct: number;
};

export type ComplianceControl = {
    id: number;
    control_ref: string;
    title: string;
    description: string | null;
    category: string | null;
    status: 'compliant' | 'non_compliant' | 'not_mapped';
    open_findings: number;
    total_findings: number;
    mapped_rules: string[];
};

export type FrameworkDetail = {
    framework: {
        id: number;
        name: string;
        slug: string;
        version: string | null;
        description: string | null;
    };
    controls: ComplianceControl[];
    summary: {
        total_controls: number;
        compliant: number;
        non_compliant: number;
        compliance_pct: number;
    };
};

export function useComplianceData() {
    const { selectedTenantId, buildUrl } = useTenantScope();
    const [frameworks, setFrameworks] = useState<FrameworkSummary[]>([]);
    const [selectedFramework, setSelectedFramework] = useState<FrameworkDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        setSelectedFramework(null);
        fetch(buildUrl('/api/v1/compliance'))
            .then((r) => r.json())
            .then((res) => {
                setFrameworks(res.success ? res.data.frameworks : []);
                setLoading(false);
            })
            .catch(() => {
                setFrameworks([]);
                setLoading(false);
            });
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    const selectFramework = useCallback(
        (slug: string | null) => {
            if (!slug) {
                setSelectedFramework(null);
                return;
            }
            setDetailLoading(true);
            fetch(buildUrl(`/api/v1/compliance/${slug}`))
                .then((r) => r.json())
                .then((res) => {
                    setSelectedFramework(res.success ? res.data : null);
                    setDetailLoading(false);
                })
                .catch(() => {
                    setSelectedFramework(null);
                    setDetailLoading(false);
                });
        },
        [buildUrl], // eslint-disable-line react-hooks/exhaustive-deps
    );

    return { frameworks, selectedFramework, loading, detailLoading, selectFramework };
}
