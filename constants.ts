
import { AspectRatio, ImageStyle, LogoAsset, VideoStyle, OverlayAnimation, VideoResolution, ProjectTemplate, MediaType, AgentTask, AgentType, SocialPlatform, LogoPosition } from './types';

// Updated with placeholders representing the user's "BLKOUT" and other assets
export const LOGO_ASSETS: LogoAsset[] = [
  { id: 'blk-rainbow', name: 'BLKOUT Rainbow', url: 'https://placehold.co/150x150/1a1a1a/FFFFFF/png?text=BLK%5CnOUT&font=montserrat' }, 
  { id: 'blk-circle', name: 'BLK Hub Circle', url: 'https://placehold.co/150x150/FF00FF/FFFFFF/png?text=HUB&font=roboto' },
  { id: 'blk-white', name: 'BLKOUT White', url: 'https://placehold.co/150x150/FFFFFF/000000/png?text=BLK%5CnOUT' },
  { id: 'blk-icon', name: 'BLK Icon', url: 'https://placehold.co/150x150/000000/FFFFFF/png?text=B' },
  { id: 'ivr-green', name: 'IVR Badge', url: 'https://placehold.co/150x150/008000/FFFFFF/png?text=IVR' },
  { id: 'avatar-1', name: 'Avatar Graphic', url: 'https://placehold.co/150x150/00FFFF/000000/png?text=Avatar' },
  { id: 'tech-white', name: 'TechCorp White', url: 'https://placehold.co/150x150/333333/FFFFFF/png?text=TC' },
];

export const ASPECT_RATIOS = Object.values(AspectRatio);
export const STYLES = Object.values(ImageStyle);
export const VIDEO_STYLES = Object.values(VideoStyle);
export const VIDEO_RESOLUTIONS = Object.values(VideoResolution);
export const OVERLAY_ANIMATIONS = Object.values(OverlayAnimation);
export const LOGO_POSITIONS = Object.values(LogoPosition);

export const SAMPLE_PROMPTS = [
  "A futuristic city skyline at sunset with flying cars",
  "A calm zen garden with rocks and raked sand",
  "A professional workspace with a laptop and coffee",
  "Abstract geometric shapes in blue and gold"
];

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'story-viral',
    name: 'Viral Story',
    description: 'High energy vertical video for TikTok/Reels',
    category: 'Social',
    config: {
      mediaType: MediaType.VIDEO,
      prompt: 'Fast paced urban lifestyle montage, neon lights, dynamic movement, 4k',
      aspectRatio: AspectRatio.PORTRAIT,
      style: ImageStyle.NONE,
      videoStyle: VideoStyle.ACTION,
      overlayText: 'WAIT FOR IT...',
      overlayAnimation: OverlayAnimation.PULSE
    }
  },
  {
    id: 'prod-showcase',
    name: 'Product Showcase',
    description: 'Clean, studio-lit square image for feeds',
    category: 'Business',
    config: {
      mediaType: MediaType.IMAGE,
      prompt: 'Minimalist podium product display, soft studio lighting, pastel background, high fidelity',
      aspectRatio: AspectRatio.SQUARE,
      style: ImageStyle.D3_RENDER,
      videoStyle: VideoStyle.NONE,
      overlayText: 'NEW ARRIVAL',
      overlayAnimation: OverlayAnimation.FADE_IN
    }
  },
  {
    id: 'corp-update',
    name: 'Corporate Update',
    description: 'Professional landscape video for LinkedIn',
    category: 'Business',
    config: {
      mediaType: MediaType.VIDEO,
      prompt: 'Abstract data visualization, connecting nodes, blue and white corporate color scheme, clean',
      aspectRatio: AspectRatio.LANDSCAPE,
      style: ImageStyle.NONE,
      videoStyle: VideoStyle.CINEMATIC,
      overlayText: 'Q3 UPDATE',
      overlayAnimation: OverlayAnimation.TYPEWRITER
    }
  },
  {
    id: 'cyber-bg',
    name: 'Cyber Aesthetic',
    description: 'Futuristic background image',
    category: 'Creative',
    config: {
      mediaType: MediaType.IMAGE,
      prompt: 'Cyberpunk street scene, rain, neon signs, reflections, cinematic lighting',
      aspectRatio: AspectRatio.PORTRAIT,
      style: ImageStyle.CYBERPUNK,
      videoStyle: VideoStyle.NONE,
      overlayText: '',
      overlayAnimation: OverlayAnimation.NONE
    }
  },
  {
    id: 'nature-calm',
    name: 'Nature Zen',
    description: 'Calm nature video for wellness',
    category: 'Social',
    config: {
      mediaType: MediaType.VIDEO,
      prompt: 'Misty forest morning, sunlight through trees, gentle movement, realistic',
      aspectRatio: AspectRatio.PORTRAIT,
      style: ImageStyle.NONE,
      videoStyle: VideoStyle.SLOW_MOTION,
      overlayText: 'Breathe.',
      overlayAnimation: OverlayAnimation.FADE_IN
    }
  }
];

export const MOCK_AGENT_TASKS: AgentTask[] = [
  {
    id: 'task-1',
    agentName: AgentType.VIRAL_TRENDS,
    title: 'Trending Audio Visualizer',
    description: 'A trending audio clip is gaining traction. Create a dynamic visualizer.',
    priority: 'HIGH',
    timestamp: Date.now() - 1000 * 60 * 30, // 30 mins ago
    targetPlatform: SocialPlatform.TIKTOK,
    suggestedConfig: {
      mediaType: MediaType.VIDEO,
      prompt: 'Neon sound waves pulsating to the beat, dark background, energetic, abstract',
      aspectRatio: AspectRatio.PORTRAIT,
      style: ImageStyle.NONE,
      videoStyle: VideoStyle.ACTION,
      overlayText: 'SOUND ON 🔊'
    }
  },
  {
    id: 'task-2',
    agentName: AgentType.NEWS_CRAWLER,
    title: 'Daily Tech Recap',
    description: 'Summary graphic for today\'s top 3 tech stories.',
    priority: 'MEDIUM',
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    targetPlatform: SocialPlatform.LINKEDIN,
    suggestedConfig: {
      mediaType: MediaType.IMAGE,
      prompt: 'Modern isometric tech illustration, server racks and cloud computing symbols, blue and white palette',
      aspectRatio: AspectRatio.LANDSCAPE,
      style: ImageStyle.FLAT_DESIGN,
      videoStyle: VideoStyle.NONE,
      overlayText: 'DAILY INSIGHTS'
    }
  },
  {
    id: 'task-3',
    agentName: AgentType.EVENT_SCHEDULER,
    title: 'Webinar Countdown',
    description: 'Promo material for "The Future of AI" webinar next Tuesday.',
    priority: 'LOW',
    timestamp: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
    targetPlatform: SocialPlatform.INSTAGRAM,
    suggestedConfig: {
      mediaType: MediaType.VIDEO,
      prompt: 'Clock ticking, futuristic interface, countdown elements, smooth transition',
      aspectRatio: AspectRatio.SQUARE,
      style: ImageStyle.NONE,
      videoStyle: VideoStyle.TIMELAPSE,
      overlayText: '3 DAYS LEFT'
    }
  }
];
