import { buildDeepLink, parseDeepLink, routes } from '../../lib/navigation';

describe('navigation helpers', () => {
  it('builds profile route', () => {
    expect(routes.profile()).toBe('/profile');
  });

  it('builds client deep link and parses it', () => {
    const url = buildDeepLink('client', 'client_123');
    const parsed = parseDeepLink(url);
    expect(parsed?.type).toBe('client');
    expect(parsed?.id).toBe('client_123');
  });

  it('builds equipment deep link with params and parses it', () => {
    const url = buildDeepLink('equipment', 'asset_1', { siteId: 'site_9' });
    const parsed = parseDeepLink(url);
    expect(parsed?.type).toBe('equipment');
    expect(parsed?.id).toBe('asset_1');
    expect(parsed?.params?.siteId).toBe('site_9');
  });
});
