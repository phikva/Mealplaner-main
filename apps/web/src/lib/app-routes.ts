/**
 * Canonical interne stier (redirects, revalidering, metadata). Header-/footer-lenker kommer fra Sanity `siteSettings.links`.
 */
export const MEAL_PLANNER_ROUTE = {
  path: "/maltidsplanlegger",
  label: "Måltidsplanlegger",
} as const;

export const FAVORITES_ROUTE = {
  path: "/favoritter",
  label: "Favoritter",
} as const;
