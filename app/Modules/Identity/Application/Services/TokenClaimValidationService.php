<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Services;

class TokenClaimValidationService
{
    /**
     * @param array<string, mixed> $claims
     * @return array{valid: bool, errors: array<int, string>}
     */
    public function validate(array $claims): array
    {
        $errors = [];

        $allowedTenants = config('codeblue365.allowed_entra_tenants', []);
        $expectedAudience = (string) config('codeblue365.oidc.expected_audience', '');
        $issuerPrefix = (string) config('codeblue365.oidc.issuer_prefix', 'https://login.microsoftonline.com/');
        $expectedNonce = (string) config('codeblue365.oidc.expected_nonce', '');

        $tid = (string) ($claims['tid'] ?? '');
        $aud = (string) ($claims['aud'] ?? '');
        $iss = (string) ($claims['iss'] ?? '');
        $nonce = (string) ($claims['nonce'] ?? '');

        if ($tid === '' || ! in_array($tid, $allowedTenants, true)) {
            $errors[] = 'invalid_or_untrusted_tenant';
        }

        if ($expectedAudience !== '' && $aud !== '' && $aud !== $expectedAudience) {
            $errors[] = 'audience_mismatch';
        }

        if ($iss !== '' && ! str_starts_with($iss, $issuerPrefix)) {
            $errors[] = 'issuer_mismatch';
        }

        if ($expectedNonce !== '' && $nonce !== '' && ! hash_equals($expectedNonce, $nonce)) {
            $errors[] = 'nonce_mismatch';
        }

        return [
            'valid' => count($errors) === 0,
            'errors' => $errors,
        ];
    }
}
