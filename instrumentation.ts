import type { Instrumentation } from "next";
import { reportError } from "@/lib/observability";

/**
 * Next.js calls `onRequestError` for every uncaught error thrown while handling
 * a request on the server — Server Components, Route Handlers, and Server
 * Actions included. This is the catch-all that makes server-side failures
 * visible; funnel it through the one reporting choke point.
 *
 * See node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md
 */
export const onRequestError: Instrumentation.onRequestError = (err, request, context) => {
  reportError(err, {
    source: "onRequestError",
    path: request.path,
    method: request.method,
    routeType: context.routeType,
    routePath: context.routePath,
  });
};
