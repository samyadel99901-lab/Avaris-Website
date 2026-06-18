<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    /**
     * GET /api/activities
     * يرجع آخر 20 activity log.
     */
    public function index(Request $request)
    {
        $limit = (int) $request->input('limit', 20);

        $activities = ActivityLog::latest()
            ->limit($limit)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'type' => $log->type,
                    'title' => $log->title,
                    'description' => $log->description,
                    'detail' => $log->detail,
                    'time' => $log->created_at->diffForHumans(),
                    'created_at' => $log->created_at->toIso8601String(),
                ];
            });

        return response()->json(['activities' => $activities]);
    }
}