import React, { useState, useEffect } from 'react';
import { AssetLibrary } from './components/AssetLibrary';
import { Controls } from './components/Controls';
import { PreviewArea } from './components/PreviewArea';
import { GeneratedAsset, MediaType, AspectRatio, ImageStyle, VideoStyle, LogoAsset, InputSource, OverlayAnimation, AIProvider, VideoResolution, ProjectTemplate, AgentTask, LogoPosition } from './types';
import { generateImageAsset, generateVideoAsset, checkProviderApiKey, promptProviderApiKey, blobToBase64, urlToBase64 } from './services/generation';
import { fetchAgentTasks, pushToAutomation } from './services/integration';
import { AlertTriangle, PanelLeft, PanelRight, Wifi, ArrowLeft, ExternalLink } from 'lucide-react';
import { PROJECT_TEMPLATES } from './constants';

export default function App() {
  // State
  const [provider, setProvider] = useState<AIProvider>(AIProvider.GOOGLE);
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [style, setStyle] = useState<ImageStyle>(ImageStyle.NONE);
  const [videoStyle, setVideoStyle] = useState<VideoStyle>(VideoStyle.NONE);
  const [videoResolution, setVideoResolution] = useState<VideoResolution>(VideoResolution.HD_720P);
  const [mediaType, setMediaType] = useState<MediaType>(MediaType.IMAGE);
  const [selectedLogo, setSelectedLogo] = useState<LogoAsset | null>(null);
  const [customLogos, setCustomLogos] = useState<LogoAsset[]>([]);
  
  // Logo Configuration
  const [logoPosition, setLogoPosition] = useState<LogoPosition>(LogoPosition.BOTTOM_RIGHT);
  const [logoOpacity, setLogoOpacity] = useState<number>(0.8);
  
  // Inputs
  const [inputSource, setInputSource] = useState<InputSource>('UPLOAD');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');

  // Overlays
  const [overlayText, setOverlayText] = useState<string>('');
  const [overlayAnimation, setOverlayAnimation] = useState<OverlayAnimation>(OverlayAnimation.NONE);
  
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
  const [currentAsset, setCurrentAsset] = useState<GeneratedAsset | null>(null);
  
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Integration State
  const [agentTasks, setAgentTasks] = useState<AgentTask[]>([]);
  const [currentTask, setCurrentTask] = useState<AgentTask | null>(null);
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(true); // Mock connection status

  // UI State for Responsive Layout
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(false);

  // Initial check for Google key and Agent Tasks
  useEffect(() => {
    checkProviderApiKey(AIProvider.GOOGLE).then(setHasApiKey);
    
    // Simulate fetching tasks from the blkoutuk ecosystem
    fetchAgentTasks().then(tasks => {
        setAgentTasks(tasks);
    }).catch(e => {
        console.error("Failed to fetch agent tasks", e);
        setIsConnected(false);
    });
  }, []);

  const handleApiKeyRequest = async () => {
    try {
        await promptProviderApiKey(provider);
        const has = await checkProviderApiKey(provider);
        setHasApiKey(has);
    } catch (e) {
        console.error("API Key selection failed", e);
    }
  }

  const handleApplyTemplate = (template: ProjectTemplate) => {
    setMediaType(template.config.mediaType);
    setPrompt(template.config.prompt);
    setAspectRatio(template.config.aspectRatio);
    
    if (template.config.mediaType === MediaType.IMAGE) {
        setStyle(template.config.style);
    } else {
        setVideoStyle(template.config.videoStyle);
    }
    
    setOverlayText(template.config.overlayText);
    setOverlayAnimation(template.config.overlayAnimation);
    
    setUploadedImage(null);
    setImageUrl('');

    setIsLibraryOpen(false);
    setCurrentTask(null); // Clear task if template is manually selected
  };

  const handleSelectAgentTask = (task: AgentTask) => {
      setCurrentTask(task);
      setMediaType(task.suggestedConfig.mediaType);
      setPrompt(task.suggestedConfig.prompt);
      setAspectRatio(task.suggestedConfig.aspectRatio);
      setStyle(task.suggestedConfig.style);
      setVideoStyle(task.suggestedConfig.videoStyle);
      setOverlayText(task.suggestedConfig.overlayText);
      setOverlayAnimation(OverlayAnimation.NONE); // Default to none unless specified in future

      if (task.suggestedConfig.referenceImageUrl) {
          setInputSource('URL');
          setImageUrl(task.suggestedConfig.referenceImageUrl);
      } else {
          setUploadedImage(null);
          setImageUrl('');
      }

      setIsLibraryOpen(false);
  };

  const handleLogoUpload = (file: File) => {
    const newLogo: LogoAsset = {
        id: `custom-${Date.now()}`,
        name: file.name,
        url: URL.createObjectURL(file) 
    };
    setCustomLogos(prev => [...prev, newLogo]);
    setSelectedLogo(newLogo);
  };

  const toggleFavorite = (id: string) => {
    setGeneratedAssets(prev => prev.map(asset => {
        if (asset.id === id) {
            const updated = { ...asset, isFavorite: !asset.isFavorite };
            if (currentAsset?.id === id) setCurrentAsset(updated);
            return updated;
        }
        return asset;
    }));
  };

  const addTag = (id: string, tag: string) => {
    setGeneratedAssets(prev => prev.map(asset => {
        if (asset.id === id) {
            const currentTags = asset.tags || [];
            if (!currentTags.includes(tag)) {
                const updated = { ...asset, tags: [...currentTags, tag] };
                if (currentAsset?.id === id) setCurrentAsset(updated);
                return updated;
            }
        }
        return asset;
    }));
  };

  const removeTag = (id: string, tag: string) => {
    setGeneratedAssets(prev => prev.map(asset => {
        if (asset.id === id) {
            const updated = { ...asset, tags: (asset.tags || []).filter(t => t !== tag) };
            if (currentAsset?.id === id) setCurrentAsset(updated);
            return updated;
        }
        return asset;
    }));
  };

  const handleGenerate = async () => {
    const isKeyValid = await checkProviderApiKey(provider);
    if (!isKeyValid) {
        await handleApiKeyRequest();
        if (!await checkProviderApiKey(provider)) return;
    }

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      let finalPrompt = prompt;
      if (mediaType === MediaType.IMAGE && style !== ImageStyle.NONE) {
        finalPrompt += `, style: ${style}`;
      }
      
      let referenceImageBase64: string | undefined = undefined;
      
      if (inputSource === 'UPLOAD' && uploadedImage) {
         referenceImageBase64 = await blobToBase64(uploadedImage);
      } else if (inputSource === 'URL' && imageUrl.trim()) {
         referenceImageBase64 = await urlToBase64(imageUrl);
      }

      let url: string;
      if (mediaType === MediaType.IMAGE) {
        url = await generateImageAsset(provider, finalPrompt, aspectRatio, referenceImageBase64);
      } else {
        url = await generateVideoAsset(provider, finalPrompt, aspectRatio, videoStyle, videoResolution, referenceImageBase64);
      }

      const newAsset: GeneratedAsset = {
        id: Date.now().toString(),
        type: mediaType,
        url: url,
        prompt: finalPrompt,
        timestamp: Date.now(),
        aspectRatio: aspectRatio,
        provider: provider,
        resolution: mediaType === MediaType.VIDEO ? videoResolution : undefined,
        isFavorite: false,
        tags: currentTask ? [`Task: ${currentTask.title}`, currentTask.agentName] : []
      };

      setGeneratedAssets(prev => [newAsset, ...prev]);
      setCurrentAsset(newAsset);

    } catch (error: any) {
      console.error("Generation error:", error);
      const msg = error?.message || String(error);
      if (msg.includes("Requested entity was not found")) {
          setHasApiKey(false); 
          setErrorMsg("API Key invalid or expired. Please select a project again.");
      } else {
          setErrorMsg(msg || "An unexpected error occurred.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePushToAutomation = async () => {
      if (!currentAsset || !currentTask) {
          // If no active task, maybe just push to general library? For now, we simulate success
          setIsPushing(true);
          await new Promise(r => setTimeout(r, 1000));
          setIsPushing(false);
          return;
      }

      setIsPushing(true);
      try {
          await pushToAutomation(currentAsset, currentTask.targetPlatform);
          // Remove task from list or mark done? 
          // For now, let's keep it but remove the "Current Task" highlight
          setAgentTasks(prev => prev.filter(t => t.id !== currentTask.id));
          setCurrentTask(null);
      } catch (e) {
          console.error("Failed to push", e);
          setErrorMsg("Failed to push asset to automation pipeline.");
      } finally {
          setIsPushing(false);
      }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-200 font-sans overflow-hidden flex-col md:flex-row">
      
      {/* Mobile Header */}
      <div className="md:hidden h-14 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-4 shrink-0 z-30">
        <button onClick={() => setIsLibraryOpen(!isLibraryOpen)} className="p-2 text-slate-400 hover:text-white">
            <PanelLeft size={20} />
        </button>
        <span className="font-bold text-sm bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent truncate">SocialSync Generation</span>
        <button onClick={() => setIsControlsOpen(!isControlsOpen)} className="p-2 text-slate-400 hover:text-white">
            <PanelRight size={20} />
        </button>
      </div>

      {/* Left Sidebar: Assets & Templates & Agents */}
      <div className={`
        fixed inset-y-0 left-0 z-40 bg-slate-900 
        transform transition-transform duration-300 ease-in-out 
        md:relative md:translate-x-0 md:z-0
        ${isLibraryOpen ? 'translate-x-0' : '-translate-x-full'}
        border-r border-slate-700 shadow-2xl md:shadow-none flex flex-col h-full
      `}>
          <AssetLibrary 
            assets={generatedAssets} 
            templates={PROJECT_TEMPLATES}
            agentTasks={agentTasks}
            onSelect={(asset) => { setCurrentAsset(asset); setIsLibraryOpen(false); }}
            onToggleFavorite={toggleFavorite}
            onAddTag={addTag}
            onRemoveTag={removeTag}
            onApplyTemplate={handleApplyTemplate}
            onSelectAgentTask={handleSelectAgentTask}
            onClose={() => setIsLibraryOpen(false)}
          />
      </div>

      {/* Mobile Overlay Backdrop */}
      {(isLibraryOpen || isControlsOpen) && (
        <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
            onClick={() => { setIsLibraryOpen(false); setIsControlsOpen(false); }}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* Top Header / Context Bar */}
        <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 text-[10px] uppercase tracking-wider font-semibold text-slate-500 shrink-0">
            <div className="flex items-center gap-4">
                {/* Back to Admin Link */}
                <a 
                    href="https://comms-blkout.vercel.app/admin" 
                    className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors border-r border-slate-700 pr-4"
                >
                    <ArrowLeft size={12} />
                    <span className="hidden sm:inline">Admin Dashboard</span>
                    <span className="sm:hidden">Admin</span>
                </a>

                {/* System Status */}
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                    <span className="hidden sm:inline">blkoutuk/comms-blkout</span>
                    <Wifi size={12} className="ml-1 opacity-50"/>
                </div>
            </div>

            {/* Page Title / Context */}
            <div className="flex items-center gap-4">
                {currentTask ? (
                    <div className="flex items-center gap-2 text-green-400 bg-green-900/10 px-2 py-0.5 rounded border border-green-900/30">
                        <span className="truncate max-w-[150px]">Task: {currentTask.title}</span>
                    </div>
                ) : (
                    <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
                         <span>SocialSync Content Generation</span>
                    </div>
                )}
            </div>
        </div>

        {/* Top notification for API Key (Only if needed for provider) */}
        {!hasApiKey && provider === AIProvider.GOOGLE && (
            <div className="bg-amber-600/20 border-b border-amber-600/50 p-2 text-center text-xs text-amber-200 flex items-center justify-center gap-2 cursor-pointer hover:bg-amber-600/30 transition-colors shrink-0" onClick={handleApiKeyRequest}>
                <AlertTriangle size={14} />
                <span>Paid API Key required for Veo & Pro models. Click here to select project.</span>
            </div>
        )}
         {errorMsg && (
            <div className="bg-red-600/20 border-b border-red-600/50 p-2 text-center text-xs text-red-200 flex items-center justify-center gap-2 shrink-0">
                <AlertTriangle size={14} />
                <span>{errorMsg}</span>
            </div>
        )}

        <div className="flex-1 flex overflow-hidden relative">
             <PreviewArea 
                currentUrl={currentAsset?.url || null}
                currentType={currentAsset?.type || MediaType.IMAGE}
                currentAspectRatio={currentAsset?.aspectRatio || aspectRatio}
                logo={selectedLogo}
                logoPosition={logoPosition}
                setLogoPosition={setLogoPosition}
                logoOpacity={logoOpacity}
                setLogoOpacity={setLogoOpacity}
                isGenerating={isGenerating}
                overlayText={overlayText}
                overlayAnimation={overlayAnimation}
                currentResolution={currentAsset?.resolution}
                onPushToAutomation={handlePushToAutomation}
                isPushing={isPushing}
             />
             
             {/* Right Sidebar: Controls */}
             <div className={`
                fixed inset-y-0 right-0 z-40 bg-slate-900 
                transform transition-transform duration-300 ease-in-out 
                md:relative md:translate-x-0 md:z-0
                ${isControlsOpen ? 'translate-x-0' : 'translate-x-full'}
                border-l border-slate-700 shadow-2xl md:shadow-none h-full flex flex-col
             `}>
                <Controls 
                    provider={provider}
                    setProvider={setProvider}
                    prompt={prompt}
                    setPrompt={setPrompt}
                    aspectRatio={aspectRatio}
                    setAspectRatio={setAspectRatio}
                    style={style}
                    setStyle={setStyle}
                    videoStyle={videoStyle}
                    setVideoStyle={setVideoStyle}
                    videoResolution={videoResolution}
                    setVideoResolution={setVideoResolution}
                    selectedLogo={selectedLogo}
                    setSelectedLogo={setSelectedLogo}
                    customLogos={customLogos}
                    onLogoUpload={handleLogoUpload}
                    mediaType={mediaType}
                    setMediaType={setMediaType}
                    onGenerate={handleGenerate}
                    isGenerating={isGenerating}
                    
                    inputSource={inputSource}
                    setInputSource={setInputSource}
                    uploadedImage={uploadedImage}
                    setUploadedImage={setUploadedImage}
                    imageUrl={imageUrl}
                    setImageUrl={setImageUrl}
                    
                    overlayText={overlayText}
                    setOverlayText={setOverlayText}
                    overlayAnimation={overlayAnimation}
                    setOverlayAnimation={setOverlayAnimation}

                    onClose={() => setIsControlsOpen(false)}
                />
             </div>
        </div>
      </div>
    </div>
  );
}