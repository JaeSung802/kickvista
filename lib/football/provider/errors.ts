/**
 * Errors raised by football providers when a caller asks for strict results.
 *
 * By default RealFootballProvider swallows every failure and returns an empty
 * shape, so "no matches" and "the request failed" look identical. Callers that
 * must tell them apart (the home page) pass `{ strict: true }` and get a
 * FootballApiError instead of an empty list.
 */

export type FootballApiErrorKind =
  | "timeout"
  | "network"
  | "http"
  | "rate_limit"
  | "api_error"
  | "parse";

export class FootballApiError extends Error {
  readonly kind: FootballApiErrorKind;
  /** Set when the request was not sent because the URL is in its failure backoff. */
  readonly retryAfterMs?: number;

  constructor(kind: FootballApiErrorKind, path: string, retryAfterMs?: number) {
    // path never contains the API key (it is sent as a header)
    super(`football api ${kind}: ${path.split("?")[0]}`);
    this.name = "FootballApiError";
    this.kind = kind;
    this.retryAfterMs = retryAfterMs;
  }
}

/** Options for provider calls that can fail loudly instead of returning []. */
export interface FootballFetchOptions {
  strict?: boolean;
}
