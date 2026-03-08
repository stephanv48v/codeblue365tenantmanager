<?php

declare(strict_types=1);

namespace App\Modules\Ingestion\Application\Contracts;

interface GraphClient
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function fetchUsers(string $tenantId): array;
}
