import { type UrlObject } from "url";

import { mergeQueryParams } from "./merge-query-params";
import { parseQueryParams } from "./parse-query-params";
import { type QueryParams } from "./types";

type AddQueryParamsToUrlOptions = {
  readonly replaceExisting: boolean;
};

/**
 * Adds the provided query parameters to the provided URL {@link UrlObject} or path, {@link string},
 * either updating/merging with existing query parameters or replacing them entirely, depending on
 * the options, {@link AddQueryParamsToUrlOptions},  provided to the  method.
 *
 * @param {string | UrlObject} url
 *   The URL {@link string} or object, {@link UrlObject}, that the query parameters should either be
 *   merged into or replaced with entirely.
 *
 * @param {QueryParams} query
 *   The query parameters that should be merged into the provided URL {@link UrlObject} or path,
 *   {@link string}, or replace the existing query parameters on the provided URL {@link UrlObject}
 *   or path, {@link string}, entirely.
 *
 * @param {AddQueryParamsToUrlOptions} opts
 *   Options that dictate whether or not existing query parameters on the provided URL
 *   {@link UrlObject} or path, {@link string}, should be replaced entirely or merged into.
 *
 * @returns {U}
 *   The URL {@link string} or object, {@link UrlObject} (depending on the type of the first
 *   argument) with the query parameters added.
 */
export const addQueryParamsToUrl = <U extends string | UrlObject>(
  url: U,
  query: QueryParams,
  opts?: AddQueryParamsToUrlOptions,
): U => {
  const u = typeof url === "string" ? url : url.search || "";

  let urlParams =
    opts?.replaceExisting === true
      ? new URLSearchParams()
      : parseQueryParams(u, { form: "object" });
  urlParams = mergeQueryParams(urlParams, query);

  if (urlParams.toString() !== "") {
    if (typeof url === "string") {
      return (url.split("?")[0] + "?" + urlParams.toString()) as U;
    }
    /* TODO: We will need to revisit this, as there are other properties of the URL object that
       might need to be specified. */
    return {
      ...(url as UrlObject),
      query: urlParams.toString(),
      search: urlParams.toString(), // I do not think this is right!
    } as U;
  }
  return url;
};
