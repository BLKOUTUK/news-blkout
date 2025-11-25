
import { AIProvider, AspectRatio, VideoResolution, VideoStyle } from '../types';
import * as GeminiService from './gemini';

// Re-export helpers from the concrete implementation
export { blobToBase64, urlToBase64 } from './gemini';

export const generateImageAsset = async (
  provider: AIProvider,
  prompt: string,
  aspectRatio: AspectRatio,
  referenceImageBase64?: string
): Promise<string> => {
  console.log(`[Generation Service] Generating image via ${provider}`);
  
  switch (provider) {
    case AIProvider.GOOGLE:
      return GeminiService.generateImage(prompt, aspectRatio, referenceImageBase64);
    
    case AIProvider.OPENAI:
    case AIProvider.STABILITY:
        // Mock implementation to demonstrate flexibility
        await new Promise(r => setTimeout(r, 2000));
        // Return a reliable placeholder based on the prompt/provider
        const seed = prompt.length + Date.now();
        return `https://picsum.photos/seed/${seed}/1024/1024`;
        
    default:
        throw new Error(`Provider ${provider} not implemented`);
  }
}

export const generateVideoAsset = async (
    provider: AIProvider,
    prompt: string,
    aspectRatio: AspectRatio,
    videoStyle: VideoStyle,
    resolution: VideoResolution,
    referenceImageBase64?: string
): Promise<string> => {
    console.log(`[Generation Service] Generating video via ${provider} at ${resolution}`);

    switch (provider) {
        case AIProvider.GOOGLE:
            return GeminiService.generateVideo(prompt, aspectRatio, videoStyle, resolution, referenceImageBase64);
        
        case AIProvider.OPENAI:
        case AIProvider.STABILITY:
             // Mock implementation
            await new Promise(r => setTimeout(r, 3000));
            // Return a sample video to simulate generation
            return "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
            
        default:
            throw new Error(`Provider ${provider} not implemented`);
    }
}

export const checkProviderApiKey = async (provider: AIProvider): Promise<boolean> => {
     if (provider === AIProvider.GOOGLE) {
         return GeminiService.checkApiKey();
     }
     // For other providers (simulated), we assume they are configured or use a backend proxy
     return true; 
}

export const promptProviderApiKey = async (provider: AIProvider): Promise<void> => {
    if (provider === AIProvider.GOOGLE) {
        return GeminiService.promptForApiKey();
    }
    alert(`Configuration for ${provider} is not required in this demo mode.`);
}
