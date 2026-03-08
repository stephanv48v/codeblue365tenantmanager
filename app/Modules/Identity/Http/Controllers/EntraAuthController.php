<?php

declare(strict_types=1);

namespace App\Modules\Identity\Http\Controllers;

use App\Modules\Identity\Application\Services\GroupRoleMappingService;
use App\Modules\Identity\Application\Services\JitProvisioningService;
use App\Modules\Identity\Application\Services\TokenClaimValidationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class EntraAuthController extends Controller
{
    public function callback(
        Request $request,
        JitProvisioningService $jitProvisioningService,
        TokenClaimValidationService $tokenClaimValidationService,
        GroupRoleMappingService $groupRoleMappingService
    ): JsonResponse {
        $claims = $request->validate([
            'oid' => ['required', 'string'],
            'tid' => ['required', 'string'],
            'preferred_username' => ['nullable', 'string'],
            'email' => ['nullable', 'string'],
            'name' => ['nullable', 'string'],
            'amr' => ['nullable', 'array'],
            'iss' => ['nullable', 'string'],
            'aud' => ['nullable', 'string'],
            'nonce' => ['nullable', 'string'],
            'groups' => ['nullable', 'array'],
            'groups.*' => ['string'],
        ]);

        $validation = $tokenClaimValidationService->validate($claims);
        if (! $validation['valid']) {
            DB::table('audit_logs')->insert([
                'event_type' => 'auth.invalid_claims',
                'actor_identifier' => (string) ($claims['preferred_username'] ?? $claims['email'] ?? $claims['oid']),
                'payload' => json_encode(['errors' => $validation['errors'], 'tid' => $claims['tid'] ?? null], JSON_THROW_ON_ERROR),
                'created_at' => now(),
            ]);

            return ApiResponse::error('invalid_claims', 'Token claims failed validation.', 403, [
                'errors' => $validation['errors'],
            ]);
        }

        $userId = $jitProvisioningService->upsertFromClaims($claims);
        $groupRoleMappingService->syncUserRoles($userId, $claims['groups'] ?? []);

        DB::table('audit_logs')->insert([
            'event_type' => 'auth.success',
            'actor_identifier' => (string) ($claims['preferred_username'] ?? $claims['email'] ?? $claims['oid']),
            'payload' => json_encode(['user_id' => $userId, 'tid' => $claims['tid']], JSON_THROW_ON_ERROR),
            'created_at' => now(),
        ]);

        return ApiResponse::success([
            'message' => 'Authentication callback processed.',
            'user_id' => $userId,
        ]);
    }
}
