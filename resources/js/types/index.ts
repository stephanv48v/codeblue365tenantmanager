import type { ComponentType, SVGProps } from 'react';

export type AuthUser = {
    id: number;
    name: string;
    email: string;
    roles: string[];
};

export type BrandingConfig = {
    company_name: string;
    tagline: string;
    primary_color: string;
    logo_url: string | null;
    report_subtitle: string;
};

export type SharedPageProps = {
    auth: {
        user: AuthUser | null;
    };
    branding: BrandingConfig;
};

export type NavItem = {
    label: string;
    href: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    requiredRole?: string;
};

export type NavGroup = {
    title: string;
    items: NavItem[];
};
