<?php

declare(strict_types=1);

return [
    'allowed_entra_tenants' => array_values(array_filter(array_map('trim', explode(',', (string) env('ENTRA_ALLOWED_TENANT_IDS', ''))))),

    'oidc' => [
        'expected_audience' => (string) env('ENTRA_CLIENT_ID', ''),
        'issuer_prefix' => (string) env('ENTRA_ISSUER_PREFIX', 'https://login.microsoftonline.com/'),
        'expected_nonce' => (string) env('ENTRA_EXPECTED_NONCE', ''),
    ],

    'entra_group_role_map' => json_decode((string) env('ENTRA_GROUP_ROLE_MAP_JSON', '{}'), true) ?: [],

    'ingestion' => [
        'max_attempts' => (int) env('GRAPH_RETRY_MAX_ATTEMPTS', 3),
        'retry_delay_ms' => (int) env('GRAPH_RETRY_DELAY_MS', 200),
    ],

    'score_weights' => [
        'identity_currency' => 0.20,
        'device_currency' => 0.15,
        'app_currency' => 0.10,
        'security_posture' => 0.25,
        'governance_readiness' => 0.15,
        'integration_readiness' => 0.15,
    ],
];
