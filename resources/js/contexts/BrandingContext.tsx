import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { BrandingConfig } from '../types';

const defaultBranding: BrandingConfig = {
    company_name: 'CodeBlue 365',
    tagline: 'Tenant Manager',
    primary_color: '#3b82f6',
    logo_url: null,
    report_subtitle: 'Managed Services Platform',
};

const BrandingContext = createContext<BrandingConfig>(defaultBranding);

/** Read branding from the Inertia page data embedded in the DOM */
function readBrandingFromPage(): BrandingConfig {
    try {
        const appEl = document.getElementById('app');
        if (appEl) {
            const pageData = appEl.getAttribute('data-page');
            if (pageData) {
                const parsed = JSON.parse(pageData);
                if (parsed?.props?.branding) {
                    return { ...defaultBranding, ...parsed.props.branding };
                }
            }
        }
    } catch {
        // Fallback to default
    }
    return defaultBranding;
}

export function BrandingProvider({ children }: { children: ReactNode }) {
    const [branding, setBranding] = useState<BrandingConfig>(() => readBrandingFromPage());

    // Re-read on navigation (Inertia updates page data on each visit)
    useEffect(() => {
        const handler = () => {
            setTimeout(() => {
                setBranding(readBrandingFromPage());
            }, 50);
        };

        document.addEventListener('inertia:finish', handler);
        return () => document.removeEventListener('inertia:finish', handler);
    }, []);

    return (
        <BrandingContext.Provider value={branding}>
            {children}
        </BrandingContext.Provider>
    );
}

export function useBranding(): BrandingConfig {
    return useContext(BrandingContext);
}

/** Convert hex color string to [r, g, b] tuple for jsPDF */
export function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
        : [59, 130, 246]; // fallback to default blue
}
