<?php

namespace App\Services\Monday;

use Illuminate\Support\Facades\Http;

class MondayClient
{
    private string $apiUrl;
    private string $apiToken;
    private string $boardId;

    public function __construct()
    {
        $this->apiUrl = config('services.monday.api_url');
        $this->apiToken = config('services.monday.api_token');
        $this->boardId = config('services.monday.board_id');
    }

    public function getBoardData(): array
    {
        $query = <<<'GRAPHQL'
        query ($boardId: ID!) {
            boards(ids: [$boardId]) {
                id
                name
                groups {
                    id
                    title
                }
                items_page(limit: 500) {
                    cursor
                    items {
                        id
                        name
                        group {
                            id
                            title
                        }
                        column_values {
                            id
                            type
                            text
                            value
                            ... on StatusValue {
                                label
                                index
                            }
                            ... on DropdownValue {
                                values {
                                    id
                                    label
                                }
                            }
                            ... on BoardRelationValue {
                                linked_items {
                                    id
                                    name
                                }
                            }
                            ... on MirrorValue {
                                display_value
                            }
                            ... on NumbersValue {
                                number
                            }
                            ... on FormulaValue {
                                text
                            }
                        }
                    }
                }
            }
        }
        GRAPHQL;

        $response = Http::withHeaders([
            'Authorization' => $this->apiToken,
            'API-Version' => '2024-10',
        ])->post($this->apiUrl, [
            'query' => $query,
            'variables' => [
                'boardId' => $this->boardId,
            ],
        ]);

        if ($response->failed()) {
            throw new \Exception('Failed to fetch Monday board data: ' . $response->body());
        }

        $data = $response->json();

        if (isset($data['errors'])) {
            throw new \Exception('Monday API errors: ' . json_encode($data['errors']));
        }

        $boards = $data['data']['boards'] ?? [];

        if (empty($boards)) {
            throw new \Exception('Board not found or no access. Board ID: ' . $this->boardId);
        }

        return $boards[0];
    }


    /**
     * يحدث الـ status بتاع item معين في Monday.
     *
     * @param string $itemId       الـ Monday item ID
     * @param string $statusLabel  الـ label الجديد (مثلاً: "Pending")
     * @return bool
     */
    public function updateItemStatus(string $itemId, string $statusLabel): bool
    {
        $statusColumnId = config('services.monday.columns.status');

        $mutation = <<<'GRAPHQL'
        mutation ($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
            change_column_value(
                board_id: $boardId,
                item_id: $itemId,
                column_id: $columnId,
                value: $value
            ) {
                id
            }
        }
        GRAPHQL;

        // Monday بيتوقع value كـ JSON string بهذا الشكل
        $valueJson = json_encode(['label' => $statusLabel]);

        $response = Http::withHeaders([
            'Authorization' => $this->apiToken,
            'API-Version' => '2024-10',
        ])->post($this->apiUrl, [
            'query' => $mutation,
            'variables' => [
                'boardId' => $this->boardId,
                'itemId' => $itemId,
                'columnId' => $statusColumnId,
                'value' => $valueJson,
            ],
        ]);

        if ($response->failed()) {
            throw new \Exception("Failed to update Monday item {$itemId}: " . $response->body());
        }

        $data = $response->json();

        if (isset($data['errors'])) {
            throw new \Exception("Monday API errors updating item {$itemId}: " . json_encode($data['errors']));
        }

        return true;
    }
}