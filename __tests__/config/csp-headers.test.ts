/**
 * CSP CONFIGURATION TESTS
 * ----------------------------------------------------------------------------
 * Unit tests to verify Content-Security-Policy headers are correctly configured
 * to allow the 3D dice roller (@3d-dice/dice-box) to function.
 * 
 * The dice roller requires:
 * - worker-src 'self' blob: (for OffscreenCanvas Web Workers)
 * - connect-src 'self' blob: (for worker script loading)
 * 
 * If these tests fail, the dice roller will not initialize properly.
 * This test was added after commit f97b3f74 broke the dice roller by
 * adding CSP headers without the necessary worker-src directive.
 */

import { describe, it, expect } from 'vitest';
import nextConfig from '../../next.config';

describe('Security Headers Configuration', () => {
    // Get the headers from next.config
    const getCSPHeader = async (): Promise<string | undefined> => {
        if (typeof nextConfig.headers !== 'function') {
            return undefined;
        }

        const headers = await nextConfig.headers();
        const allRouteHeaders = headers.find((h: { source: string }) => h.source === '/(.*)');
        if (!allRouteHeaders?.headers) {
            return undefined;
        }

        const cspHeader = allRouteHeaders.headers.find(
            (h: { key: string }) => h.key === 'Content-Security-Policy'
        );
        return cspHeader?.value;
    };

    it('should include worker-src directive for DiceBox Web Workers', async () => {
        const csp = await getCSPHeader();
        expect(csp).toBeDefined();
        expect(csp).toContain("worker-src 'self' blob:");
    });

    it('should include blob: in connect-src for worker scripts', async () => {
        const csp = await getCSPHeader();
        expect(csp).toBeDefined();
        // Parse out the connect-src directive and verify it includes blob:
        const connectSrcMatch = csp?.match(/connect-src\s+([^;]+)/);
        expect(connectSrcMatch).toBeTruthy();
        expect(connectSrcMatch?.[1]).toContain('blob:');
    });

    it('should have all required CSP directives', async () => {
        const csp = await getCSPHeader();
        expect(csp).toBeDefined();

        // Essential directives for app functionality
        expect(csp).toContain("default-src 'self'");
        expect(csp).toContain("script-src");
        expect(csp).toContain("style-src");
        expect(csp).toContain("img-src");
        expect(csp).toContain("font-src");
        expect(csp).toContain("connect-src");
        expect(csp).toContain("worker-src"); // Critical for dice roller!
    });

    it('should allow Supabase connections', async () => {
        const csp = await getCSPHeader();
        expect(csp).toBeDefined();
        expect(csp).toContain('https://*.supabase.co');
        expect(csp).toContain('wss://*.supabase.co');
    });

    it('should allow Google Fonts', async () => {
        const csp = await getCSPHeader();
        expect(csp).toBeDefined();
        expect(csp).toContain('https://fonts.googleapis.com');
        expect(csp).toContain('https://fonts.gstatic.com');
    });
});
