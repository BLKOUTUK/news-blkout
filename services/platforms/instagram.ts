import {
    SocialMediaPlatform,
    PlatformCredentials,
    PublishOptions,
    PublishResult,
    PlatformStatus,
} from './base';

/**
 * Instagram Graph API Connector
 * Docs: https://developers.facebook.com/docs/instagram-api
 */
export class InstagramPlatform extends SocialMediaPlatform {
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly apiVersion = 'v18.0';
    private readonly baseUrl = 'https://graph.facebook.com';

    constructor(clientId: string, clientSecret: string, credentials?: PlatformCredentials) {
        super(credentials);
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    getAuthUrl(redirectUri: string): string {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: redirectUri,
            scope: 'instagram_basic,instagram_content_publish',
            response_type: 'code',
        });
        return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
    }

    async authenticate(authCode: string): Promise<PlatformCredentials> {
        // Exchange authorization code for access token
        const response = await fetch(`${this.baseUrl}/oauth/access_token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: this.clientId,
                client_secret: this.clientSecret,
                grant_type: 'authorization_code',
                redirect_uri: window.location.origin + '/auth/callback',
                code: authCode,
            }),
        });

        const data = await response.json();
        
        this.credentials = {
            accessToken: data.access_token,
            accountId: data.user_id,
        };

        return this.credentials;
    }

    async refreshAccessToken(): Promise<PlatformCredentials> {
        if (!this.credentials) throw new Error('No credentials to refresh');

        // Instagram uses long-lived tokens that don't need frequent refresh
        // But we can exchange short-lived for long-lived tokens
        const response = await fetch(
            `${this.baseUrl}/${this.apiVersion}/oauth/access_token?` +
            new URLSearchParams({
                grant_type: 'ig_exchange_token',
                client_secret: this.clientSecret,
                access_token: this.credentials.accessToken,
            })
        );

        const data = await response.json();
        
        this.credentials.accessToken = data.access_token;
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

        try {
            const caption = this.buildCaption(options.caption, options.hashtags);

            // Step 1: Create media container
            const containerResponse = await fetch(
                `${this.baseUrl}/${this.apiVersion}/${this.credentials!.accountId}/media`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        [mediaType === 'image' ? 'image_url' : 'video_url']: mediaUrl,
                        caption,
                        access_token: this.credentials!.accessToken,
                    }),
                }
            );

            const containerData = await containerResponse.json();
            const containerId = containerData.id;

            // Step 2: Publish the container
            const publishResponse = await fetch(
                `${this.baseUrl}/${this.apiVersion}/${this.credentials!.accountId}/media_publish`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        creation_id: containerId,
                        access_token: this.credentials!.accessToken,
                    }),
                }
            );

            const publishData = await publishResponse.json();

            return {
                success: true,
                postId: publishData.id,
                url: `https://www.instagram.com/p/${publishData.id}`,
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
            const response = await fetch(
                `${this.baseUrl}/${this.apiVersion}/${this.credentials!.accountId}?` +
                new URLSearchParams({
                    fields: 'username,account_type',
                    access_token: this.credentials!.accessToken,
                })
            );

            const data = await response.json();

            return {
                connected: true,
                accountName: data.username,
                accountId: this.credentials!.accountId,
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

        // Instagram aspect ratio requirements
        const [width, height] = aspectRatio.split(':').map(Number);
        const ratio = width / height;

        if (mediaType === 'image') {
            if (ratio < 0.8 || ratio > 1.91) {
                errors.push('Image aspect ratio must be between 4:5 and 1.91:1');
            }
            if (fileSize && fileSize > 8 * 1024 * 1024) {
                errors.push('Image file size must be under 8MB');
            }
        } else {
            if (ratio < 0.5625 || ratio > 1.91) {
                errors.push('Video aspect ratio must be between 9:16 and 1.91:1');
            }
            if (fileSize && fileSize > 100 * 1024 * 1024) {
                errors.push('Video file size must be under 100MB');
            }
        }

        return { valid: errors.length === 0, errors };
    }

    private buildCaption(caption?: string, hashtags?: string[]): string {
        let result = caption || '';
        if (hashtags && hashtags.length > 0) {
            result += '\n\n' + hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
        }
        return result;
    }
}

