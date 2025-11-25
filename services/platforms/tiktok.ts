import {
    SocialMediaPlatform,
    PlatformCredentials,
    PublishOptions,
    PublishResult,
    PlatformStatus,
} from './base';

/**
 * TikTok Content Posting API Connector
 * Docs: https://developers.tiktok.com/doc/content-posting-api-get-started
 */
export class TikTokPlatform extends SocialMediaPlatform {
    private readonly clientKey: string;
    private readonly clientSecret: string;
    private readonly baseUrl = 'https://open.tiktokapis.com';

    constructor(clientKey: string, clientSecret: string, credentials?: PlatformCredentials) {
        super(credentials);
        this.clientKey = clientKey;
        this.clientSecret = clientSecret;
    }

    getAuthUrl(redirectUri: string): string {
        const csrfState = Math.random().toString(36).substring(2);
        const params = new URLSearchParams({
            client_key: this.clientKey,
            scope: 'user.info.basic,video.upload,video.publish',
            response_type: 'code',
            redirect_uri: redirectUri,
            state: csrfState,
        });
        return `https://www.tiktok.com/v2/auth/authorize?${params.toString()}`;
    }

    async authenticate(authCode: string): Promise<PlatformCredentials> {
        const response = await fetch(`${this.baseUrl}/v2/oauth/token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_key: this.clientKey,
                client_secret: this.clientSecret,
                code: authCode,
                grant_type: 'authorization_code',
                redirect_uri: window.location.origin + '/auth/callback',
            }),
        });

        const data = await response.json();

        this.credentials = {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: new Date(Date.now() + data.expires_in * 1000),
        };

        return this.credentials;
    }

    async refreshAccessToken(): Promise<PlatformCredentials> {
        if (!this.credentials?.refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await fetch(`${this.baseUrl}/v2/oauth/token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_key: this.clientKey,
                client_secret: this.clientSecret,
                grant_type: 'refresh_token',
                refresh_token: this.credentials.refreshToken,
            }),
        });

        const data = await response.json();

        this.credentials.accessToken = data.access_token;
        this.credentials.refreshToken = data.refresh_token;
        this.credentials.expiresAt = new Date(Date.now() + data.expires_in * 1000);

        return this.credentials;
    }

    async publish(
        mediaUrl: string,
        mediaType: 'image' | 'video',
        options: PublishOptions
    ): Promise<PublishResult> {
        if (!this.isAuthenticated()) {
            return { success: false, error: 'Not authenticated' };
        }

        if (mediaType === 'image') {
            return { success: false, error: 'TikTok only supports video content' };
        }

        try {
            // Step 1: Initialize video upload
            const initResponse = await fetch(`${this.baseUrl}/v2/post/publish/video/init/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.credentials!.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    post_info: {
                        title: options.caption || '',
                        privacy_level: 'PUBLIC_TO_EVERYONE',
                        disable_duet: false,
                        disable_comment: false,
                        disable_stitch: false,
                        video_cover_timestamp_ms: 1000,
                    },
                    source_info: {
                        source: 'FILE_UPLOAD',
                        video_url: mediaUrl,
                    },
                }),
            });

            const initData = await initResponse.json();

            if (initData.error) {
                return { success: false, error: initData.error.message };
            }

            return {
                success: true,
                postId: initData.data.publish_id,
                url: `https://www.tiktok.com/@user/video/${initData.data.publish_id}`,
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    async getStatus(): Promise<PlatformStatus> {
        if (!this.isAuthenticated()) {
            return { connected: false, error: 'Not authenticated' };
        }

        try {
            const response = await fetch(`${this.baseUrl}/v2/user/info/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.credentials!.accessToken}`,
                },
            });

            const data = await response.json();

            return {
                connected: true,
                accountName: data.data.user.display_name,
                accountId: data.data.user.open_id,
                lastSync: new Date(),
            };
        } catch (error: any) {
            return {
                connected: false,
                error: error.message,
            };
        }
    }

    validateMedia(
        mediaType: 'image' | 'video',
        aspectRatio: string,
        fileSize?: number
    ): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (mediaType === 'image') {
            errors.push('TikTok only supports video content');
            return { valid: false, errors };
        }

        // TikTok video requirements
        const [width, height] = aspectRatio.split(':').map(Number);
        const ratio = width / height;

        // TikTok prefers 9:16 (vertical) but supports other ratios
        if (ratio < 0.5 || ratio > 1.91) {
            errors.push('Video aspect ratio should be between 9:16 and 1.91:1');
        }

        if (fileSize) {
            if (fileSize > 287 * 1024 * 1024) {
                errors.push('Video file size must be under 287MB');
            }
        }

        return { valid: errors.length === 0, errors };
    }
}

