<?php

declare(strict_types=1);

namespace App\Modules\Security\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class SecurityPostureController extends Controller
{
    public function posture(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        // Get latest score per tenant
        $latestScores = DB::table('scores as s')
            ->joinSub(
                DB::table('scores')
                    ->select('tenant_id', DB::raw('MAX(calculated_at) as max_calc'))
                    ->groupBy('tenant_id'),
                'latest',
                fn ($join) => $join->on('s.tenant_id', '=', 'latest.tenant_id')
                    ->on('s.calculated_at', '=', 'latest.max_calc')
            )
            ->leftJoin('managed_tenants', 's.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                's.tenant_id',
                'managed_tenants.customer_name',
                's.identity_currency',
                's.device_currency',
                's.app_currency',
                's.security_posture',
                's.governance_readiness',
                's.integration_readiness',
                's.composite_score',
                's.calculated_at',
            ])
            ->when($tenantId, fn ($q, $id) => $q->where('s.tenant_id', $id))
            ->orderByDesc('s.composite_score')
            ->get();

        if ($latestScores->isEmpty()) {
            return ApiResponse::success([
                'overall_score' => 0,
                'pillars' => [],
                'tenants' => [],
            ]);
        }

        // Aggregate scores (average across tenants if no filter)
        $avgIdentity = round($latestScores->avg('identity_currency'), 1);
        $avgDevice = round($latestScores->avg('device_currency'), 1);
        $avgApp = round($latestScores->avg('app_currency'), 1);
        $avgSecurity = round($latestScores->avg('security_posture'), 1);
        $avgGovernance = round($latestScores->avg('governance_readiness'), 1);
        $avgIntegration = round($latestScores->avg('integration_readiness'), 1);
        $avgComposite = round($latestScores->avg('composite_score'), 1);

        return ApiResponse::success([
            'overall_score' => $avgComposite,
            'pillars' => [
                ['key' => 'identity', 'label' => 'Identity', 'score' => $avgIdentity, 'weight' => 20],
                ['key' => 'device', 'label' => 'Device', 'score' => $avgDevice, 'weight' => 15],
                ['key' => 'app', 'label' => 'Application', 'score' => $avgApp, 'weight' => 10],
                ['key' => 'security', 'label' => 'Security Posture', 'score' => $avgSecurity, 'weight' => 25],
                ['key' => 'governance', 'label' => 'Governance', 'score' => $avgGovernance, 'weight' => 15],
                ['key' => 'integration', 'label' => 'Integration', 'score' => $avgIntegration, 'weight' => 15],
            ],
            'tenants' => $latestScores->map(fn ($s) => [
                'tenant_id' => $s->tenant_id,
                'customer_name' => $s->customer_name,
                'composite_score' => (float) $s->composite_score,
                'identity' => (int) $s->identity_currency,
                'device' => (int) $s->device_currency,
                'app' => (int) $s->app_currency,
                'security' => (int) $s->security_posture,
                'governance' => (int) $s->governance_readiness,
                'integration' => (int) $s->integration_readiness,
            ])->values(),
        ]);
    }

    public function history(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        $query = DB::table('scores')
            ->select([
                DB::raw("DATE(calculated_at) as date"),
                DB::raw('ROUND(AVG(identity_currency), 1) as identity'),
                DB::raw('ROUND(AVG(device_currency), 1) as device'),
                DB::raw('ROUND(AVG(app_currency), 1) as app'),
                DB::raw('ROUND(AVG(security_posture), 1) as security'),
                DB::raw('ROUND(AVG(governance_readiness), 1) as governance'),
                DB::raw('ROUND(AVG(integration_readiness), 1) as integration'),
                DB::raw('ROUND(AVG(composite_score), 1) as composite'),
            ])
            ->when($tenantId, fn ($q, $id) => $q->where('tenant_id', $id))
            ->groupBy(DB::raw('DATE(calculated_at)'))
            ->orderBy('date')
            ->get();

        // Calculate change (first → last)
        $change = [
            'composite' => 0,
            'identity' => 0,
            'device' => 0,
            'app' => 0,
            'security' => 0,
            'governance' => 0,
            'integration' => 0,
        ];

        if ($query->count() >= 2) {
            $first = $query->first();
            $last = $query->last();
            $change = [
                'composite' => round($last->composite - $first->composite, 1),
                'identity' => round($last->identity - $first->identity, 1),
                'device' => round($last->device - $first->device, 1),
                'app' => round($last->app - $first->app, 1),
                'security' => round($last->security - $first->security, 1),
                'governance' => round($last->governance - $first->governance, 1),
                'integration' => round($last->integration - $first->integration, 1),
            ];
        }

        return ApiResponse::success([
            'trend' => $query->map(fn ($row) => [
                'date' => $row->date,
                'composite' => (float) $row->composite,
                'identity' => (float) $row->identity,
                'device' => (float) $row->device,
                'app' => (float) $row->app,
                'security' => (float) $row->security,
                'governance' => (float) $row->governance,
                'integration' => (float) $row->integration,
            ])->values(),
            'change' => $change,
        ]);
    }
}
