/**
 * Platform Manager - Coordinates all social media platform connectors
 */

import { SocialMediaPlatform, PublishOptions, PublishResult } from './base';
import { InstagramPlatform } from './instagram';
import { TikTokPlatform } from './tiktok';
import { SocialPlatform } from '../../types';

export * from './base';
export * from './instagram';
export * from './tiktok';

class PlatformManager {
    private platforms: Map<SocialPlatform, SocialMediaPlatform> = new Map();

    constructor() {
        // Initialize platforms with environment variables
        // In production, these would come from secure backend storage
        const instagramClientId = import.meta.env.VITE_INSTAGRAM_CLIENT_ID || '';
        const instagramClientSecret = import.meta.env.VITE_INSTAGRAM_CLIENT_SECRET || '';
        const tiktokClientKey = import.meta.env.VITE_TIKTOK_CLIENT_KEY || '';
        const tiktokClientSecret = import.meta.env.VITE_TIKTOK_CLIENT_SECRET || '';

        if (instagramClientId && instagramClientSecret) {
            this.platforms.set(
                SocialPlatform.INSTAGRAM,
                new InstagramPlatform(instagramClientId, instagramClientSecret)
            );
        }

        if (tiktokClientKey && tiktokClientSecret) {
            this.platforms.set(
                SocialPlatform.TIKTOK,
                new TikTokPlatform(tiktokClientKey, tiktokClientSecret)
            );
        }

        // LinkedIn and Twitter connectors would be added here
        // this.platforms.set(SocialPlatform.LINKEDIN, new LinkedInPlatform(...));
        // this.platforms.set(SocialPlatform.TWITTER, new TwitterPlatform(...));
    }

    /**
     * Get platform connector
     */
    getPlatform(platform: SocialPlatform): SocialMediaPlatform | undefined {
        return this.platforms.get(platform);
    }

    /**
     * Publish content to a specific platform
     */
    async publish(
        platform: SocialPlatform,
        mediaUrl: string,
        mediaType: 'image' | 'video',
        options: PublishOptions
    ): Promise<PublishResult> {
        const connector = this.platforms.get(platform);

        if (!connector) {
            return {
                success: false,
                error: `Platform ${platform} is not configured`,
            };
        }

        if (!connector.isAuthenticated()) {
            return {
                success: false,
                error: `Not authenticated with ${platform}`,
            };
        }

        // Validate media before publishing
        const validation = connector.validateMedia(mediaType, options.aspectRatio || '1:1');
        if (!validation.valid) {
            return {
                success: false,
                error: `Media validation failed: ${validation.errors.join(', ')}`,
            };
        }

        return await connector.publish(mediaUrl, mediaType, options);
    }

    /**
     * Check if a platform is connected and authenticated
     */
    async isConnected(platform: SocialPlatform): Promise<boolean> {
        const connector = this.platforms.get(platform);
        if (!connector) return false;

        const status = await connector.getStatus();
        return status.connected;
    }

    /**
     * Get status for all platforms
     */
    async getAllStatuses(): Promise<Map<SocialPlatform, any>> {
        const statuses = new Map();

        for (const [platform, connector] of this.platforms.entries()) {
            const status = await connector.getStatus();
            statuses.set(platform, status);
        }

        return statuses;
    }

    /**
     * Get OAuth authorization URL for a platform
     */
    getAuthUrl(platform: SocialPlatform, redirectUri: string): string | null {
        const connector = this.platforms.get(platform);
        return connector ? connector.getAuthUrl(redirectUri) : null;
    }

    /**
     * Handle OAuth callback
     */
    async handleAuthCallback(
        platform: SocialPlatform,
        authCode: string
    ): Promise<boolean> {
        const connector = this.platforms.get(platform);
        if (!connector) return false;

        try {
            await connector.authenticate(authCode);
            return true;
        } catch (error) {
            console.error(`Authentication failed for ${platform}:`, error);
            return false;
        }
    }
}

// Export singleton instance
export const platformManager = new PlatformManager();

// Helper function to publish to multiple platforms
export async function publishToMultiplePlatforms(
    platforms: SocialPlatform[],
    mediaUrl: string,
    mediaType: 'image' | 'video',
    options: PublishOptions
): Promise<Map<SocialPlatform, PublishResult>> {
    const results = new Map<SocialPlatform, PublishResult>();

    await Promise.all(
        platforms.map(async (platform) => {
            const result = await platformManager.publish(
                platform,
                mediaUrl,
                mediaType,
                options
            );
            results.set(platform, result);
        })
    );

    return results;
}

