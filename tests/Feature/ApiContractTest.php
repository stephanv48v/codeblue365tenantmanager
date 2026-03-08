<?php

declare(strict_types=1);

namespace Tests\Feature;

use PHPUnit\Framework\TestCase;

class ApiContractTest extends TestCase
{
    public function test_openapi_file_exists_and_contains_expected_v1_paths(): void
    {
        $path = __DIR__.'/../../docs/openapi.yaml';

        $this->assertFileExists($path);
        $content = (string) file_get_contents($path);

        $this->assertStringContainsString('/api/v1', $content);
        $this->assertStringContainsString('/auth/entra/callback', $content);
        $this->assertStringContainsString('/tenants', $content);
        $this->assertStringContainsString('/playbooks/{slug}/validate', $content);
    }
}
