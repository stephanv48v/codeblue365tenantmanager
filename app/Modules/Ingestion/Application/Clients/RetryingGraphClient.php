<?php

declare(strict_types=1);

namespace App\Modules\Ingestion\Application\Clients;

use App\Modules\Ingestion\Application\Contracts\GraphClient;
use RuntimeException;
use Throwable;

class RetryingGraphClient implements GraphClient
{
    public function __construct(
        private readonly GraphClient $inner,
        private readonly int $maxAttempts = 3,
        private readonly int $retryDelayMs = 200
    ) {
    }

    public function fetchUsers(string $tenantId): array
    {
        return $this->retry(fn () => $this->inner->fetchUsers($tenantId), 'fetchUsers', $tenantId);
    }

    public function fetchDevices(string $tenantId): array
    {
        return $this->retry(fn () => $this->inner->fetchDevices($tenantId), 'fetchDevices', $tenantId);
    }

    public function fetchLicenses(string $tenantId): array
    {
        return $this->retry(fn () => $this->inner->fetchLicenses($tenantId), 'fetchLicenses', $tenantId);
    }

    public function fetchServiceHealth(string $tenantId): array
    {
        return $this->retry(fn () => $this->inner->fetchServiceHealth($tenantId), 'fetchServiceHealth', $tenantId);
    }

    public function fetchSecureScore(string $tenantId): array
    {
        return $this->retry(fn () => $this->inner->fetchSecureScore($tenantId), 'fetchSecureScore', $tenantId);
    }

    public function fetchDelegatedTenants(): array
    {
        return $this->retry(fn () => $this->inner->fetchDelegatedTenants(), 'fetchDelegatedTenants', 'partner');
    }

    public function fetchRiskyUsers(string $tenantId): array
    {
        return $this->retry(fn () => $this->inner->fetchRiskyUsers($tenantId), 'fetchRiskyUsers', $tenantId);
    }

    public function fetchConditionalAccessPolicies(string $tenantId): array
    {
        return $this->retry(fn () => $this->inner->fetchConditionalAccessPolicies($tenantId), 'fetchConditionalAccessPolicies', $tenantId);
    }

    public function fetchSecureScoreHistory(string $tenantId): array
    {
        return $this->retry(fn () => $this->inner->fetchSecureScoreHistory($tenantId), 'fetchSecureScoreHistory', $tenantId);
    }

    public function fetchServiceHealthEvents(string $tenantId): array
    {
        return $this->retry(fn () => $this->inner->fetchServiceHealthEvents($tenantId), 'fetchServiceHealthEvents', $tenantId);
    }

    public function fetchMailboxUsage(string $tenantId): array
    {
        return $this->retry(fn () => $this->inner->fetchMailboxUsage($tenantId), 'fetchMailboxUsage', $tenantId);
    }

    public function fetchSharePointUsage(string $tenantId): array
    {
        return $this->retry(fn () => $this->inner->fetchSharePointUsage($tenantId), 'fetchSharePointUsage', $tenantId);
    }

    /** @return mixed */
    private function retry(callable $callback, string $method, string $tenantId): mixed
    {
        $attempt = 0;
        $lastError = null;

        while ($attempt < $this->maxAttempts) {
            $attempt++;

            try {
                return $callback();
            } catch (Throwable $throwable) {
                $lastError = $throwable;

                if ($attempt >= $this->maxAttempts) {
                    break;
                }

                usleep($this->retryDelayMs * 1000);
            }
        }

        throw new RuntimeException(
            sprintf('Failed %s for tenant [%s] after %d attempts.', $method, $tenantId, $this->maxAttempts),
            previous: $lastError
        );
    }
}
