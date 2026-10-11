/** Client-safe shared constants (no server-only imports). */

export const PHOTO_BUCKET = "client-photos";
export const SHARE_BUCKET = "shared-files";

/** Free plan caps the number of active clients. Pro is unlimited. */
export const FREE_CLIENT_LIMIT = 10;
/** Pro price, shown in the UI (INR). Keep in sync with your Razorpay plan. */
export const PRO_PRICE_INR = 999;
