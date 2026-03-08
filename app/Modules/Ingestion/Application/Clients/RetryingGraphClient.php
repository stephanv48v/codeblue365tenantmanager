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
        $attempt = 0;
        $lastError = null;

        while ($attempt < $this->maxAttempts) {
            $attempt++;

            try {
                return $this->inner->fetchUsers($tenantId);
            } catch (Throwable $throwable) {
                $lastError = $throwable;

                if ($attempt >= $this->maxAttempts) {
                    break;
                }

                usleep($this->retryDelayMs * 1000);
            }
        }

        throw new RuntimeException(
            sprintf('Failed to fetch users for tenant [%s] after %d attempts.', $tenantId, $this->maxAttempts),
            previous: $lastError
        );
    }
}
