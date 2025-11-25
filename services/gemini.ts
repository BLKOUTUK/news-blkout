
import { GoogleGenAI } from "@google/genai";
import { AspectRatio, VideoResolution, VideoStyle } from "../types";

// Helper to check for API Key selection (required for Veo/Pro models)
export const checkApiKey = async (): Promise<boolean> => {
  if (typeof window !== 'undefined' && (window as any).aistudio) {
    return await (window as any).aistudio.hasSelectedApiKey();
  }
  return !!process.env.API_KEY;
};

export const promptForApiKey = async (): Promise<void> => {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
        await (window as any).aistudio.openSelectKey();
    } else {
        alert("API Key selection not supported in this environment.");
    }
}

// Helper to convert Blob to Base64
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        if (typeof reader.result === 'string') {
            // Remove data:image/xxx;base64, prefix
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        } else {
            reject(new Error("Failed to convert blob to base64"));
        }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const urlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
    const blob = await response.blob();
    return await blobToBase64(blob);
  } catch (error) {
    console.error("URL processing failed:", error);
    throw new Error("Could not process image URL. The server may have blocked the request (CORS). Please try downloading the image and uploading it as a file.");
  }
};

export const generateImage = async (
  prompt: string,
  aspectRatio: AspectRatio,
  referenceImageBase64?: string
): Promise<string> => {
  // Always instantiate fresh to pick up selected key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const modelName = 'gemini-3-pro-image-preview'; // Nano Banana Pro / Banana 2 equivalent
  
  const parts: any[] = [];
  
  if (referenceImageBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/png', // Assuming PNG for simplicity, could detect
        data: referenceImageBase64
      }
    });
  }
  
  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: "1K" // Or 2K/4K if needed
        }
      }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Image generation failed:", error);
    throw error;
  }
};

export const generateVideo = async (
  prompt: string,
  aspectRatio: AspectRatio,
  videoStyle: VideoStyle,
  resolution: VideoResolution,
  referenceImageBase64?: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = 'veo-3.1-fast-generate-preview'; // Or 'veo-3.1-generate-preview'

  // Map 1:1 to something closest supported by Veo if strict 1:1 isn't supported. 
  // Veo supports 16:9 or 9:16 primarily, but the docs say "aspectRatio can be 16:9 or 9:16".
  // If user selected something else, we default to 16:9 for landscape/square-ish, 9:16 for portrait.
  let videoAR = '16:9';
  if (aspectRatio === AspectRatio.PORTRAIT || aspectRatio === AspectRatio.STANDARD_PORTRAIT) {
    videoAR = '9:16';
  }

  // Enhance prompt with style
  let fullPrompt = prompt;
  if (videoStyle && videoStyle !== VideoStyle.NONE) {
      if (videoStyle === VideoStyle.GLITCH) {
          fullPrompt = `${prompt}. Visual style: Heavy digital glitch, datamoshing, chromatic aberration, screen tearing, artifacts, signal noise. Futuristic and dynamic.`;
      } else {
          fullPrompt = `${prompt}. Visual style: ${videoStyle}. High quality, detailed motion.`;
      }
  }

  try {
    let operation;

    // Use passed resolution (720p or 1080p)
    const resConfig = resolution as '720p' | '1080p';

    if (referenceImageBase64) {
        // Image to Video
        operation = await ai.models.generateVideos({
            model: modelName,
            prompt: fullPrompt, // Prompt is optional but good for context
            image: {
                imageBytes: referenceImageBase64,
                mimeType: 'image/png'
            },
            config: {
                numberOfVideos: 1,
                resolution: resConfig,
                aspectRatio: videoAR as any
            }
        });
    } else {
        // Text to Video
        operation = await ai.models.generateVideos({
            model: modelName,
            prompt: fullPrompt,
            config: {
                numberOfVideos: 1,
                resolution: resConfig,
                aspectRatio: videoAR as any
            }
        });
    }

    // Poll
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
        operation = await ai.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed to return a URI");

    // Fetch the actual bytes using the key
    const videoRes = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const videoBlob = await videoRes.blob();
    return URL.createObjectURL(videoBlob);

  } catch (error) {
    console.error("Video generation failed:", error);
    throw error;
  }
};
