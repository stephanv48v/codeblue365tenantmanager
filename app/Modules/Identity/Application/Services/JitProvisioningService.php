<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Services;

use Illuminate\Support\Facades\DB;

class JitProvisioningService
{
    /**
     * @param array<string, mixed> $claims
     */
    public function upsertFromClaims(array $claims): int
    {
        $email = (string) ($claims['preferred_username'] ?? $claims['email'] ?? '');
        $entraId = (string) ($claims['oid'] ?? '');
        $tenantId = (string) ($claims['tid'] ?? '');
        $displayName = (string) ($claims['name'] ?? $email);

        $existing = DB::table('users')
            ->where('entra_object_id', $entraId)
            ->orWhere('email', $email)
            ->first();

        $payload = [
            'name' => $displayName,
            'email' => $email,
            'entra_object_id' => $entraId,
            'entra_tenant_id' => $tenantId,
            'last_login_at' => now(),
            'updated_at' => now(),
        ];

        if ($existing === null) {
            $payload['created_at'] = now();

            return (int) DB::table('users')->insertGetId($payload);
        }

        DB::table('users')->where('id', $existing->id)->update($payload);

        return (int) $existing->id;
    }
}
