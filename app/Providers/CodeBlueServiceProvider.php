<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\ManagedTenant;
use App\Modules\Ingestion\Application\Clients\RetryingGraphClient;
use App\Modules\Ingestion\Application\Clients\StubGraphClient;
use App\Modules\Ingestion\Application\Contracts\GraphClient;
use App\Policies\ManagedTenantPolicy;
use Illuminate\Routing\Router;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class CodeBlueServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(StubGraphClient::class, static fn () => new StubGraphClient());

        $this->app->bind(GraphClient::class, function ($app): GraphClient {
            return new RetryingGraphClient(
                $app->make(StubGraphClient::class),
                (int) config('codeblue365.ingestion.max_attempts', 3),
                (int) config('codeblue365.ingestion.retry_delay_ms', 200)
            );
        });
    }

    public function boot(Router $router): void
    {
        Gate::policy(ManagedTenant::class, ManagedTenantPolicy::class);

        $router->aliasMiddleware('permission', \App\Modules\Identity\Http\Middleware\RequirePermission::class);
    }
}
