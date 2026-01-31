type AnalyticsEvent =
  | 'navigate_to_profile'
  | 'navigate_to_profile_edit'
  | 'navigate_to_client'
  | 'navigate_to_site'
  | 'navigate_to_equipment'
  | 'navigate_to_report'
  | 'navigate_to_nc'
  | 'navigate_to_planning';

type AnalyticsPayload = Record<string, string | number | boolean | undefined>;

/**
 * Minimal analytics hook.
 * Replace implementation with a real provider if needed.
 */
export const trackEvent = (event: AnalyticsEvent, payload?: AnalyticsPayload) => {
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with real analytics provider
    return;
  }

  // Development logging
  // eslint-disable-next-line no-console
  console.log('[ANALYTICS]', event, payload || {});
};
