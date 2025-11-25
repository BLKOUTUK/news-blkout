

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO'
}

export enum AIProvider {
  GOOGLE = 'Google (Gemini/Veo)',
  OPENAI = 'OpenAI (DALL-E/Sora)',
  STABILITY = 'Stability AI'
}

export enum AspectRatio {
  SQUARE = '1:1',
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
  STANDARD_LANDSCAPE = '4:3',
  STANDARD_PORTRAIT = '3:4'
}

export enum ImageStyle {
  NONE = 'No Style',
  MINIMALIST = 'Minimalist Corporate',
  CYBERPUNK = 'Cyberpunk Neon',
  WATERCOLOR = 'Artistic Watercolor',
  PHOTOREALISTIC = 'Hyper-Photorealistic',
  VINTAGE = 'Vintage Film',
  D3_RENDER = '3D Render',
  FLAT_DESIGN = 'Vector Flat Design',
  LUXURY = 'Luxury Editorial'
}

export enum VideoStyle {
  NONE = 'Natural',
  CINEMATIC = 'Cinematic Pan/Zoom',
  ORBIT = 'Orbiting Camera',
  TIMELAPSE = 'Time-Lapse',
  SLOW_MOTION = 'Slow Motion',
  ACTION = 'Dynamic Action',
  GLITCH = 'Digital Glitch & Distortion'
}

export enum VideoResolution {
  HD_720P = '720p',
  FHD_1080P = '1080p'
}

export enum ExportFormat {
  MP4 = 'mp4',
  MOV = 'mov',
  AVI = 'avi'
}

export enum OverlayAnimation {
  NONE = 'No Animation',
  FADE_IN = 'Fade In',
  SLIDE_UP = 'Slide Up',
  TYPEWRITER = 'Typewriter',
  BOUNCE = 'Bounce In',
  ZOOM_IN = 'Zoom In',
  ZOOM_OUT = 'Zoom Out',
  PULSE = 'Pulse'
}

export enum LogoPosition {
  TOP_LEFT = 'Top Left',
  TOP_RIGHT = 'Top Right',
  BOTTOM_LEFT = 'Bottom Left',
  BOTTOM_RIGHT = 'Bottom Right',
  CENTER = 'Center'
}

export interface GeneratedAsset {
  id: string;
  type: MediaType;
  url: string;
  prompt: string;
  timestamp: number;
  aspectRatio: AspectRatio;
  provider: AIProvider;
  resolution?: string;
  isFavorite?: boolean;
  tags?: string[];
}

export interface LogoAsset {
  id: string;
  name: string;
  url: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: 'Social' | 'Business' | 'Creative';
  config: {
    mediaType: MediaType;
    prompt: string;
    aspectRatio: AspectRatio;
    style: ImageStyle;
    videoStyle: VideoStyle;
    overlayText: string;
    overlayAnimation: OverlayAnimation;
  }
}

export type InputSource = 'UPLOAD' | 'URL';

// Integration Types

export enum AgentType {
  NEWS_CRAWLER = 'News Crawler Bot',
  VIRAL_TRENDS = 'Viral Trends Agent',
  EVENT_SCHEDULER = 'Event Scheduler',
  BRAND_GUARDIAN = 'Brand Guardian'
}

export enum SocialPlatform {
  INSTAGRAM = 'Instagram',
  TIKTOK = 'TikTok',
  LINKEDIN = 'LinkedIn',
  TWITTER = 'X (Twitter)'
}

export interface AgentTask {
  id: string;
  agentName: AgentType;
  title: string;
  description: string;
  suggestedConfig: {
    mediaType: MediaType;
    prompt: string;
    aspectRatio: AspectRatio;
    style: ImageStyle;
    videoStyle: VideoStyle;
    overlayText: string;
    referenceImageUrl?: string; // Optional reference provided by agent
  };
  targetPlatform: SocialPlatform;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: number;
}