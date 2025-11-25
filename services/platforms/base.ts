/**
 * Base interface for social media platform connectors
 */

export interface PlatformCredentials {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    accountId?: string;
    accountName?: string;
}

export interface PublishOptions {
    caption?: string;
    hashtags?: string[];
    scheduledFor?: Date;
    location?: {
        name: string;
        latitude?: number;
        longitude?: number;
    };
    mentions?: string[];
}

export interface PublishResult {
    success: boolean;
    postId?: string;
    url?: string;
    error?: string;
}

export interface PlatformStatus {
    connected: boolean;
    accountName?: string;
    accountId?: string;
    lastSync?: Date;
    error?: string;
}

export abstract class SocialMediaPlatform {
    protected credentials: PlatformCredentials | null = null;

    constructor(credentials?: PlatformCredentials) {
        this.credentials = credentials || null;
    }

    /**
     * Authenticate with the platform
     */
    abstract authenticate(authCode: string): Promise<PlatformCredentials>;

    /**
     * Refresh access token if needed
     */
    abstract refreshAccessToken(): Promise<PlatformCredentials>;

    /**
     * Publish media to the platform
     */
    abstract publish(
        mediaUrl: string,
        mediaType: 'image' | 'video',
        options: PublishOptions
    ): Promise<PublishResult>;

    /**
     * Check platform connection status
     */
    abstract getStatus(): Promise<PlatformStatus>;

    /**
     * Validate media meets platform requirements
     */
    abstract validateMedia(
        mediaType: 'image' | 'video',
        aspectRatio: string,
        fileSize?: number
    ): { valid: boolean; errors: string[] };

    /**
     * Get OAuth authorization URL
     */
    abstract getAuthUrl(redirectUri: string): string;

    /**
     * Set credentials
     */
    setCredentials(credentials: PlatformCredentials): void {
        this.credentials = credentials;
    }

    /**
     * Check if credentials are valid and not expired
     */
    isAuthenticated(): boolean {
        if (!this.credentials) return false;
        if (!this.credentials.expiresAt) return true;
        return new Date() < this.credentials.expiresAt;
    }
}

