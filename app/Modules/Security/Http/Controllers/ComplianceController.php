<?php

declare(strict_types=1);

namespace App\Modules\Security\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class ComplianceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        $frameworks = DB::table('compliance_frameworks')->orderBy('name')->get();

        $results = [];
        foreach ($frameworks as $fw) {
            $controls = DB::table('compliance_controls')
                ->where('framework_id', $fw->id)
                ->get();

            $totalControls = $controls->count();
            $compliantCount = 0;

            foreach ($controls as $control) {
                // Get all rule_keys mapped to this control
                $ruleKeys = DB::table('compliance_control_mappings')
                    ->where('control_id', $control->id)
                    ->pluck('finding_rule_key')
                    ->toArray();

                if (empty($ruleKeys)) {
                    // No mappings = assume compliant (informational control)
                    $compliantCount++;
                    continue;
                }

                // Check if any open findings exist for these rule_keys
                $openFindings = DB::table('findings')
                    ->whereIn('rule_key', $ruleKeys)
                    ->where('status', 'open')
                    ->when($tenantId, fn ($q, $id) => $q->where('tenant_id', $id))
                    ->count();

                if ($openFindings === 0) {
                    $compliantCount++;
                }
            }

            $results[] = [
                'id' => $fw->id,
                'name' => $fw->name,
                'slug' => $fw->slug,
                'version' => $fw->version,
                'description' => $fw->description,
                'total_controls' => $totalControls,
                'compliant_controls' => $compliantCount,
                'compliance_pct' => $totalControls > 0 ? round(($compliantCount / $totalControls) * 100, 1) : 0,
            ];
        }

        return ApiResponse::success(['frameworks' => $results]);
    }

    public function show(Request $request, string $slug): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        $framework = DB::table('compliance_frameworks')->where('slug', $slug)->first();

        if (!$framework) {
            return ApiResponse::error('not_found', 'Framework not found.', 404);
        }

        $controls = DB::table('compliance_controls')
            ->where('framework_id', $framework->id)
            ->orderBy('control_ref')
            ->get();

        $controlResults = [];
        foreach ($controls as $control) {
            $ruleKeys = DB::table('compliance_control_mappings')
                ->where('control_id', $control->id)
                ->pluck('finding_rule_key')
                ->toArray();

            $openFindingsCount = 0;
            $totalFindingsCount = 0;

            if (!empty($ruleKeys)) {
                $findingsQuery = DB::table('findings')
                    ->whereIn('rule_key', $ruleKeys)
                    ->when($tenantId, fn ($q, $id) => $q->where('tenant_id', $id));

                $totalFindingsCount = (clone $findingsQuery)->count();
                $openFindingsCount = (clone $findingsQuery)->where('status', 'open')->count();
            }

            $controlResults[] = [
                'id' => $control->id,
                'control_ref' => $control->control_ref,
                'title' => $control->title,
                'description' => $control->description,
                'category' => $control->category,
                'status' => empty($ruleKeys) ? 'not_mapped' : ($openFindingsCount === 0 ? 'compliant' : 'non_compliant'),
                'open_findings' => $openFindingsCount,
                'total_findings' => $totalFindingsCount,
                'mapped_rules' => $ruleKeys,
            ];
        }

        $compliant = collect($controlResults)->whereIn('status', ['compliant', 'not_mapped'])->count();

        return ApiResponse::success([
            'framework' => [
                'id' => $framework->id,
                'name' => $framework->name,
                'slug' => $framework->slug,
                'version' => $framework->version,
                'description' => $framework->description,
            ],
            'controls' => $controlResults,
            'summary' => [
                'total_controls' => count($controlResults),
                'compliant' => $compliant,
                'non_compliant' => count($controlResults) - $compliant,
                'compliance_pct' => count($controlResults) > 0 ? round(($compliant / count($controlResults)) * 100, 1) : 0,
            ],
        ]);
    }
}
