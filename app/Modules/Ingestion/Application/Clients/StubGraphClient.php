<?php

declare(strict_types=1);

namespace App\Modules\Ingestion\Application\Clients;

use App\Modules\Ingestion\Application\Contracts\GraphClient;

class StubGraphClient implements GraphClient
{
    public function fetchUsers(string $tenantId): array
    {
        return [
            [
                'id' => 'stub-user-1',
                'displayName' => 'Stub Engineer',
                'mail' => 'engineer@'.$tenantId.'.example.com',
            ],
        ];
    }
}
