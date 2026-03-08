<?php

declare(strict_types=1);

namespace App\Modules\Integrations\Http\Controllers;

use App\Modules\Integrations\Application\Services\PlaybookValidationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class IntegrationPlaybookController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DB::table('integration_playbooks')
            ->where('is_active', true)
            ->select(['slug', 'title', 'integration_slug', 'version', 'owner', 'updated_at'])
            ->orderBy('title');

        if ($request->filled('integration_slug')) {
            $query->where('integration_slug', (string) $request->string('integration_slug'));
        }

        return ApiResponse::success(['items' => $query->get()]);
    }

    public function show(string $slug): JsonResponse
    {
        $playbook = DB::table('integration_playbooks')->where('slug', $slug)->first();

        if ($playbook === null) {
            return ApiResponse::error('playbook_not_found', 'Integration playbook not found.', 404);
        }

        return ApiResponse::success(['playbook' => $playbook]);
    }

    public function validatePlaybook(
        string $slug,
        Request $request,
        PlaybookValidationService $playbookValidationService
    ): JsonResponse {
        $validated = $request->validate([
            'tenant_id' => ['required', 'string', 'max:128'],
        ]);

        return $playbookValidationService->validateForTenant($slug, $validated['tenant_id']);
    }
}
