import { useState, FormEvent } from 'react';
import { Head, usePage, router } from '@inertiajs/react';

// ── Types ────────────────────────────────────────────────────────────────────

type LoginPageProps = {
    branding: {
        company_name: string;
        tagline: string;
        primary_color: string;
        logo_url: string | null;
    };
    entra_config: {
        client_id: string;
        tenant_id: string;
        redirect_uri: string;
    } | null;
    errors: Record<string, string>;
};

// ── Microsoft Logo SVG ──────────────────────────────────────────────────────

function MicrosoftLogo() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="21"
            height="21"
            viewBox="0 0 21 21"
            className="shrink-0"
        >
            <rect x="1" y="1" width="9" height="9" fill="#f25022" />
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
            <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
            <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
        </svg>
    );
}

// ── Initials Block ──────────────────────────────────────────────────────────

function InitialsBlock({ name, color }: { name: string; color: string }) {
    const initials = name
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div
            className="flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold text-white shadow-lg"
            style={{ backgroundColor: color }}
        >
            {initials}
        </div>
    );
}

// ── Login Page ──────────────────────────────────────────────────────────────

export default function Login() {
    const {
        branding,
        entra_config: entraConfig,
        errors,
    } = usePage<LoginPageProps>().props;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const companyName = branding?.company_name || 'CodeBlue 365';
    const tagline = branding?.tagline || 'Tenant Manager';
    const primaryColor = branding?.primary_color || '#3b82f6';
    const logoUrl = branding?.logo_url ?? null;

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setSubmitting(true);

        router.post(
            '/login',
            { email, password },
            {
                onFinish: () => setSubmitting(false),
            }
        );
    }

    function handleSignIn() {
        if (!entraConfig) return;

        const nonce = crypto.randomUUID();
        const params = new URLSearchParams({
            client_id: entraConfig.client_id,
            response_type: 'id_token',
            redirect_uri: entraConfig.redirect_uri,
            scope: 'openid profile email',
            response_mode: 'form_post',
            nonce: nonce,
        });

        window.location.href = `https://login.microsoftonline.com/${entraConfig.tenant_id}/oauth2/v2.0/authorize?${params}`;
    }

    return (
        <>
            <Head title="Sign In" />

            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-12">
                <div className="w-full max-w-md">
                    {/* ── Card ────────────────────────────────── */}
                    <div className="rounded-xl bg-white px-8 py-10 shadow-2xl">
                        {/* Logo / Initials */}
                        <div className="flex justify-center">
                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    alt={`${companyName} logo`}
                                    className="h-16 w-auto object-contain"
                                />
                            ) : (
                                <InitialsBlock
                                    name={companyName}
                                    color={primaryColor}
                                />
                            )}
                        </div>

                        {/* Company Name & Tagline */}
                        <h1 className="mt-6 text-center text-2xl font-bold tracking-tight text-slate-900">
                            {companyName}
                        </h1>
                        <p className="mt-1 text-center text-sm font-medium text-slate-500">
                            {tagline}
                        </p>

                        {/* ── Email / Password Form ────────────── */}
                        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                            {errors?.email && (
                                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                                    {errors.email}
                                </div>
                            )}

                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-slate-700"
                                >
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                    autoFocus
                                    placeholder="you@example.com"
                                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-slate-700"
                                >
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-50"
                                style={{ backgroundColor: primaryColor }}
                            >
                                {submitting ? (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                ) : (
                                    'Sign in'
                                )}
                            </button>
                        </form>

                        {/* ── Divider ───────────────────────────── */}
                        <div className="relative mt-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-3 text-xs text-slate-500">
                                    or
                                </span>
                            </div>
                        </div>

                        {/* Microsoft Sign-in */}
                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={handleSignIn}
                                className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:shadow-md"
                            >
                                <MicrosoftLogo />
                                Sign in with Microsoft
                            </button>
                        </div>
                    </div>

                    {/* ── Footer ──────────────────────────────── */}
                    <p className="mt-8 text-center text-xs text-slate-500">
                        Powered by CodeBlue 365 Tenant Manager
                    </p>
                </div>
            </div>
        </>
    );
}
