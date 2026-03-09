import type { ComponentType, SVGProps } from 'react';

export type AuthUser = {
    id: number;
    name: string;
    email: string;
    roles: string[];
};

export type SharedPageProps = {
    auth: {
        user: AuthUser | null;
    };
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
