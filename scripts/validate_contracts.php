<?php

declare(strict_types=1);

$openApiPath = __DIR__.'/../docs/openapi.yaml';
$checklistPath = __DIR__.'/../docs/BUILD_CHECKLIST.md';

if (! file_exists($openApiPath)) {
    fwrite(STDERR, "Missing OpenAPI file\n");
    exit(1);
}

if (! file_exists($checklistPath)) {
    fwrite(STDERR, "Missing checklist file\n");
    exit(1);
}

$openApi = (string) file_get_contents($openApiPath);
$checklist = (string) file_get_contents($checklistPath);

$requiredOpenApi = ['/api/v1', '/tenants', '/integrations/validate', '/playbooks', '/playbooks/{slug}', '/playbooks/{slug}/validate', '/sync/tenant/{tenantId}'];
foreach ($requiredOpenApi as $entry) {
    if (! str_contains($openApi, $entry)) {
        fwrite(STDERR, "OpenAPI missing entry: {$entry}\n");
        exit(1);
    }
}

$requiredChecklist = [
    'Identity and Access',
    'RBAC and Core Data Model',
    'Tenant, Integration, and Playbook APIs',
    'Ingestion, Scoring, and Findings',
];

foreach ($requiredChecklist as $entry) {
    if (! str_contains($checklist, $entry)) {
        fwrite(STDERR, "Checklist missing section: {$entry}\n");
        exit(1);
    }
}

echo "Contract validation checks passed.\n";
