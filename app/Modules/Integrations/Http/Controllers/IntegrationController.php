<?php

declare(strict_types=1);

namespace App\Modules\Integrations\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class IntegrationController extends Controller
{
    public function index(): JsonResponse
    {
        $integrations = DB::table('integrations')
            ->select(['id', 'slug', 'name', 'status', 'description'])
            ->orderBy('name')
            ->get();

        return ApiResponse::success(['items' => $integrations]);
    }

    public function validateIntegration(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'integration_slug' => ['required', 'string', 'max:128'],
            'tenant_id' => ['required', 'string', 'max:128'],
        ]);

        $integration = DB::table('integrations')->where('slug', $validated['integration_slug'])->first();

        if ($integration === null) {
            return ApiResponse::error('integration_not_found', 'Unknown integration slug.', 404);
        }

        return ApiResponse::success([
            'status' => 'passed',
            'integration' => $integration->slug,
            'tenant_id' => $validated['tenant_id'],
            'checks' => [
                ['name' => 'integration_exists', 'result' => 'passed'],
                ['name' => 'consent_validation', 'result' => 'pending'],
                ['name' => 'gdap_role_validation', 'result' => 'pending'],
            ],
        ]);
    }
}
