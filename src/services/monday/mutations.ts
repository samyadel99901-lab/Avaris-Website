/**
 * Monday write-backs for the invoicing automation.
 *
 * After a customer's invoice is sent we flip each invoiced project's
 * "Invoice Status" so it leaves the eligible set and is never re-invoiced.
 */

import { mondayQuery } from "./client";
import { MONDAY_BOARDS, PROJECT_COLS } from "./constants";

/**
 * The label set on a project's Invoice Status once it's been invoiced.
 *
 * NOTE: this is the board's REAL label, which is misspelled "Pendeing"
 * (status id 0 on `status__1`). It must match the board exactly — a
 * different string would fail the mutation, and a correctly-spelled
 * "Pending" doesn't exist on the column.
 */
export const INVOICED_STATUS_LABEL = "Pendeing";

const CHANGE_SIMPLE_VALUE = /* GraphQL */ `
  mutation ($boardId: ID!, $itemId: ID!, $columnId: String!, $value: String!) {
    change_simple_column_value(
      board_id: $boardId
      item_id: $itemId
      column_id: $columnId
      value: $value
    ) {
      id
    }
  }
`;

/**
 * Set a project's Invoice Status. Defaults to the post-invoice label.
 * Throws (via mondayQuery) on failure — the caller decides whether a
 * failed write-back should fail the whole send.
 */
export async function setInvoiceStatus(
  mondayItemId: number,
  label: string = INVOICED_STATUS_LABEL,
): Promise<void> {
  await mondayQuery<{ change_simple_column_value: { id: string } }>(
    CHANGE_SIMPLE_VALUE,
    {
      boardId: MONDAY_BOARDS.projects,
      itemId: String(mondayItemId),
      columnId: PROJECT_COLS.invoiceStatus,
      value: label,
    },
  );
}
