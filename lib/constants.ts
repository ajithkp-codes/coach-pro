/** Client-safe shared constants (no server-only imports). */

export const PHOTO_BUCKET = "client-photos";
export const SHARE_BUCKET = "shared-files";

/** Each plan caps the number of active clients. */
export const FREE_CLIENT_LIMIT = 5;
export const PRO_CLIENT_LIMIT = 15;
/** Pro price, shown in the UI (INR). Keep in sync with your Razorpay plan. */
export const PRO_PRICE_INR = 999;

/**
 * The shared demo/showcase account. Exempt from plan client caps so it can hold
 * a full sample roster; every other account is held strictly to its plan limit.
 */
export const DEMO_EMAIL = "demo@coachpro.app";
