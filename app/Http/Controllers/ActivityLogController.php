<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        if (! $request->user()?->can('activity-log')) {
            abort(403, 'You are not authorized to view the activity log.');
        }

        $query = Activity::query()
            ->with(['causer', 'subject'])
            ->latest();

        if ($subjectType = $request->string('subject_type')->toString()) {
            $query->where('subject_type', $subjectType);
        }
        if ($causerId = $request->integer('causer_id')) {
            $query->where('causer_id', $causerId);
        }
        if ($from = $request->date('date_from')) {
            $query->whereDate('created_at', '>=', $from);
        }
        if ($to = $request->date('date_to')) {
            $query->whereDate('created_at', '<=', $to);
        }
        if ($event = $request->string('event')->toString()) {
            $query->forEvent($event);
        }
        if ($logName = $request->string('log_name')->toString()) {
            $query->inLog($logName);
        }

        $logs = $query->paginate(50)->withQueryString();

        $subjectTypes = collect([
            'App\\Models\\Sale',
            'App\\Models\\SaleItem',
            'App\\Models\\Transaction',
            'App\\Models\\Product',
            'App\\Models\\ProductBatch',
            'App\\Models\\ProductStock',
            'App\\Models\\Contact',
            'App\\Models\\Purchase',
            'App\\Models\\PurchaseItem',
            'App\\Models\\PurchaseTransaction',
            'App\\Models\\Expense',
            'App\\Models\\Employee',
            'App\\Models\\SalaryRecord',
            'App\\Models\\Store',
            'App\\Models\\User',
            'App\\Models\\Quotation',
            'App\\Models\\CashLog',
            'App\\Models\\Cheque',
        ])->mapWithKeys(fn ($fqcn) => [
            $fqcn => class_basename($fqcn),
        ])->all();

        $logNames = Activity::query()
            ->whereNotNull('log_name')
            ->distinct()
            ->orderBy('log_name')
            ->pluck('log_name')
            ->all();

        return Inertia::render('ActivityLog/Index', [
            'logs' => $logs,
            'subjectTypes' => $subjectTypes,
            'logNames' => $logNames,
            'events' => ['created', 'updated', 'deleted', 'restored'],
            'filters' => $request->only(['subject_type', 'causer_id', 'date_from', 'date_to', 'event', 'log_name']),
        ]);
    }

    public function pruneCount(Request $request)
    {
        if (! $request->user()?->can('activity-log')) {
            abort(403);
        }

        $data = $request->validate(['days' => 'required|integer|min:1|max:3650']);
        $count = Activity::where('created_at', '<', now()->subDays($data['days']))->count();

        return response()->json(['count' => $count]);
    }

    public function prune(Request $request)
    {
        if (! $request->user()?->can('activity-log')) {
            abort(403, 'You are not authorized to prune the activity log.');
        }

        $data = $request->validate(['days' => 'required|integer|min:1|max:3650']);
        $deleted = Activity::where('created_at', '<', now()->subDays($data['days']))->delete();

        return back()->with('success', "Pruned {$deleted} activity log record(s) older than {$data['days']} days.");
    }
}