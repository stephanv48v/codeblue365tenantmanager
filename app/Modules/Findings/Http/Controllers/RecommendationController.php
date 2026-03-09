<?php

declare(strict_types=1);

namespace App\Modules\Findings\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class RecommendationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DB::table('recommendations')->orderByDesc('created_at');

        if ($request->filled('tenant_id')) {
            $query->where('tenant_id', (string) $request->string('tenant_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', (string) $request->string('status'));
        }

        $recommendations = $query->paginate((int) $request->integer('per_page', 25));

        return ApiResponse::success([
            'items' => $recommendations->items(),
            'pagination' => [
                'total' => $recommendations->total(),
                'per_page' => $recommendations->perPage(),
                'current_page' => $recommendations->currentPage(),
                'last_page' => $recommendations->lastPage(),
            ],
        ]);
    }
}
