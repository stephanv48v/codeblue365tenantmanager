import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { TenantProvider } from './contexts/TenantContext';

createInertiaApp({
    title: (title) => (title ? `${title} - CodeBlue 365` : 'CodeBlue 365 Tenant Manager'),
    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.tsx', { eager: true }) as Record<
            string,
            { default: React.ComponentType }
        >;
        return pages[`./Pages/${name}.tsx`];
    },
    setup({ el, App, props }) {
        createRoot(el).render(
            <TenantProvider>
                <App {...props} />
            </TenantProvider>
        );
    },
    progress: {
        color: '#3b82f6',
    },
});
