<?php

declare(strict_types=1);

namespace App\Modules\Ingestion\Application\Contracts;

interface GraphClient
{
    /** @return array<int, array<string, mixed>> */
    public function fetchUsers(string $tenantId): array;

    /** @return array<int, array<string, mixed>> */
    public function fetchDevices(string $tenantId): array;

    /** @return array<int, array<string, mixed>> */
    public function fetchLicenses(string $tenantId): array;

    /** @return array<string, mixed> */
    public function fetchServiceHealth(string $tenantId): array;

    /** @return array<string, mixed> */
    public function fetchSecureScore(string $tenantId): array;

    /** @return array<int, array<string, mixed>> */
    public function fetchDelegatedTenants(): array;

    /** @return array<int, array<string, mixed>> */
    public function fetchRiskyUsers(string $tenantId): array;

    /** @return array<int, array<string, mixed>> */
    public function fetchConditionalAccessPolicies(string $tenantId): array;

    /** @return array<int, array<string, mixed>> */
    public function fetchSecureScoreHistory(string $tenantId): array;

    /** @return array<int, array<string, mixed>> */
    public function fetchServiceHealthEvents(string $tenantId): array;

    /** @return array<string, mixed> */
    public function fetchMailboxUsage(string $tenantId): array;

    /** @return array<string, mixed> */
    public function fetchSharePointUsage(string $tenantId): array;
}
