<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /** @return array{client_id: string, tenant_id: string, redirect_uri: string}|null */
    private function buildEntraConfig(): ?array
    {
        $clientId = (string) config('codeblue365.oidc.expected_audience', '');
        $allowedTenants = config('codeblue365.allowed_entra_tenants', []);
        $tenantId = is_array($allowedTenants) && count($allowedTenants) > 0 ? $allowedTenants[0] : '';

        if ($clientId === '' || $tenantId === '') {
            return null;
        }

        return [
            'client_id' => $clientId,
            'tenant_id' => $tenantId,
            'redirect_uri' => rtrim((string) config('app.url'), '/') . '/api/v1/auth/entra/callback',
        ];
    }

    /** @return array<string, mixed> */
    public function share(Request $request): array
    {
        $brandingSettings = Cache::remember('branding_settings', 300, fn () => DB::table('settings')
            ->where('group', 'branding')
            ->pluck('value', 'key')
            ->mapWithKeys(fn ($v, $k) => [
                str_replace('branding.', '', $k) => json_decode($v, true),
            ]));

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'roles' => $request->user()->roles()->pluck('slug')->toArray(),
                ] : null,
            ],
            'partner_connected' => Cache::remember('partner_connected', 300, fn () => DB::table('settings')
                ->where('key', 'partner_tenant.connection_status')
                ->value('value') === '"connected"'),
            'branding' => [
                'company_name' => $brandingSettings->get('company_name', 'CodeBlue 365'),
                'tagline' => $brandingSettings->get('tagline', 'Tenant Manager'),
                'primary_color' => $brandingSettings->get('primary_color', '#3b82f6'),
                'logo_url' => $brandingSettings->get('logo_path'),
                'report_subtitle' => $brandingSettings->get('report_subtitle', 'Managed Services Platform'),
            ],
            'entra_config' => $this->buildEntraConfig(),
            'app_env' => app()->environment(),
        ];
    }
}
