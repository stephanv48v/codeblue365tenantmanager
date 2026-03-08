<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Http\JsonResponse;

class ApiResponse
{
    /**
     * @param array<string, mixed> $data
     */
    public static function success(array $data = [], int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $data,
            'error' => null,
            'meta' => [
                'timestamp' => now()->toIso8601String(),
            ],
        ], $status);
    }

    /**
     * @param array<string, mixed> $details
     */
    public static function error(string $code, string $message, int $status, array $details = []): JsonResponse
    {
        return response()->json([
            'success' => false,
            'data' => null,
            'error' => [
                'code' => $code,
                'message' => $message,
                'details' => $details,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
            ],
        ], $status);
    }
}
