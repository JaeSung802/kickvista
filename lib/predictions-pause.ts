import "server-only";

/**
 * Temporary server-side pause of prediction placement and settlement.
 *
 * While a flag is true the matching API returns 503 before any point
 * deduction, prediction insert, point log, Football API call, DB query or
 * settlement RPC. Reading existing predictions, community stats and the
 * settlement notification flow are not affected.
 *
 * To resume, set the flag to false and redeploy. Typed as boolean (not a
 * literal) so the code paths after the checks stay type-checked.
 */
export const PREDICTION_PLACEMENT_PAUSED: boolean = true;
export const PREDICTION_SETTLEMENT_PAUSED: boolean = true;
