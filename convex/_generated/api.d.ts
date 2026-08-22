/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as content_scenarios from "../content/scenarios.js";
import type * as lib_audit from "../lib/audit.js";
import type * as lib_ledger from "../lib/ledger.js";
import type * as lib_scoring from "../lib/scoring.js";
import type * as lib_seasons from "../lib/seasons.js";
import type * as lib_taxFederal from "../lib/taxFederal.js";
import type * as playthroughs from "../playthroughs.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "content/scenarios": typeof content_scenarios;
  "lib/audit": typeof lib_audit;
  "lib/ledger": typeof lib_ledger;
  "lib/scoring": typeof lib_scoring;
  "lib/seasons": typeof lib_seasons;
  "lib/taxFederal": typeof lib_taxFederal;
  playthroughs: typeof playthroughs;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
