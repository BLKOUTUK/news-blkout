
import React, { useRef } from 'react';
import { AspectRatio, ImageStyle, LogoAsset, MediaType, InputSource, VideoStyle, OverlayAnimation, AIProvider, VideoResolution } from '../types';
import { ASPECT_RATIOS, STYLES, VIDEO_STYLES, OVERLAY_ANIMATIONS, LOGO_ASSETS, SAMPLE_PROMPTS, VIDEO_RESOLUTIONS } from '../constants';
import { Upload, Wand2, LayoutTemplate, Palette, Image as ImageIcon, CheckCircle2, Link, Film, Type, Cpu, Plus, MonitorPlay, X } from 'lucide-react';

interface ControlsProps {
  prompt: string;
  setPrompt: (p: string) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (ar: AspectRatio) => void;
  style: ImageStyle;
  setStyle: (s: ImageStyle) => void;
  videoStyle: VideoStyle;
  setVideoStyle: (s: VideoStyle) => void;
  videoResolution: VideoResolution;
  setVideoResolution: (r: VideoResolution) => void;
  
  selectedLogo: LogoAsset | null;
  setSelectedLogo: (l: LogoAsset | null) => void;
  customLogos: LogoAsset[];
  onLogoUpload: (file: File) => void;

  mediaType: MediaType;
  setMediaType: (m: MediaType) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  
  // Provider
  provider: AIProvider;
  setProvider: (p: AIProvider) => void;

  // Input Handling
  inputSource: InputSource;
  setInputSource: (s: InputSource) => void;
  uploadedImage: File | null;
  setUploadedImage: (f: File | null) => void;
  imageUrl: string;
  setImageUrl: (s: string) => void;

  // Overlay
  overlayText: string;
  setOverlayText: (s: string) => void;
  overlayAnimation: OverlayAnimation;
  setOverlayAnimation: (oa: OverlayAnimation) => void;
  
  onClose?: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  prompt, setPrompt, aspectRatio, setAspectRatio, style, setStyle, videoStyle, setVideoStyle,
  videoResolution, setVideoResolution,
  selectedLogo, setSelectedLogo, customLogos, onLogoUpload,
  mediaType, setMediaType, onGenerate, isGenerating,
  provider, setProvider,
  inputSource, setInputSource, uploadedImage, setUploadedImage, imageUrl, setImageUrl,
  overlayText, setOverlayText, overlayAnimation, setOverlayAnimation,
  onClose
}) => {
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedImage(e.target.files[0]);
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        onLogoUpload(e.target.files[0]);
    }
  };

  const allLogos = [...LOGO_ASSETS, ...customLogos];

  return (
    <div className="w-full md:w-80 bg-slate-900 border-l border-slate-700 flex flex-col h-full overflow-y-auto">
        {/* Mobile Header for Close */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 shrink-0 sticky top-0 bg-slate-900 z-20">
            <span className="font-semibold text-slate-200">Settings</span>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
                <X size={20} />
            </button>
        </div>

      <div className="p-5 space-y-8 flex-1">
        
        {/* Provider Selector */}
        <div className="space-y-2">
            <label className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <Cpu size={14}/> AI Model Provider
            </label>
            <select 
                value={provider}
                onChange={(e) => setProvider(e.target.value as AIProvider)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
                {Object.values(AIProvider).map((p) => (
                    <option key={p} value={p}>{p}</option>
                ))}
            </select>
        </div>

        {/* Mode Selector */}
        <div className="bg-slate-800 p-1 rounded-lg flex">
          <button 
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mediaType === MediaType.IMAGE ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setMediaType(MediaType.IMAGE)}
          >
            Image
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mediaType === MediaType.VIDEO ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setMediaType(MediaType.VIDEO)}
          >
            Video
          </button>
        </div>

        {/* Prompt Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Prompt</label>
          <textarea 
            className="w-full h-24 bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none placeholder-slate-500"
            placeholder={mediaType === MediaType.IMAGE ? "Describe your image..." : "Describe the video animation..."}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {SAMPLE_PROMPTS.map((p, i) => (
               <button key={i} onClick={() => setPrompt(p)} className="whitespace-nowrap px-2 py-1 bg-slate-800 text-xs text-slate-400 rounded hover:bg-slate-700 hover:text-white transition-colors">
                 Idea {i+1}
               </button>
            ))}
          </div>
        </div>

        {/* Reference Image Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reference Source</label>
            <div className="flex bg-slate-800 rounded p-0.5">
               <button 
                 onClick={() => setInputSource('UPLOAD')}
                 className={`px-2 py-0.5 text-[10px] rounded ${inputSource === 'UPLOAD' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}
               >
                 Upload
               </button>
               <button 
                 onClick={() => setInputSource('URL')}
                 className={`px-2 py-0.5 text-[10px] rounded ${inputSource === 'URL' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}
               >
                 URL
               </button>
            </div>
          </div>
          
          {inputSource === 'UPLOAD' ? (
             <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${uploadedImage ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-500 bg-slate-800/50'}`}
             >
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                <div className="flex flex-col items-center gap-2">
                    {uploadedImage ? (
                        <div className="flex items-center gap-2 text-blue-400">
                            <CheckCircle2 size={20} />
                            <span className="text-sm truncate max-w-[150px]">{uploadedImage.name}</span>
                        </div>
                    ) : (
                        <>
                            <Upload size={20} className="text-slate-400" />
                            <span className="text-xs text-slate-400">Click to upload image</span>
                        </>
                    )}
                </div>
                {uploadedImage && <button onClick={(e) => { e.stopPropagation(); setUploadedImage(null); }} className="text-xs text-red-400 underline mt-2">Remove</button>}
             </div>
          ) : (
             <div className="space-y-2">
                 <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg p-2">
                    <Link size={16} className="text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="bg-transparent text-sm text-white w-full focus:outline-none placeholder-slate-600"
                    />
                 </div>
                 <p className="text-[10px] text-slate-500">Ensure the URL is publicly accessible.</p>
             </div>
          )}
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <LayoutTemplate size={14}/> Aspect Ratio
          </label>
          <div className="grid grid-cols-3 gap-2">
            {ASPECT_RATIOS.map((ar) => (
              <button
                key={ar}
                onClick={() => setAspectRatio(ar)}
                className={`py-2 text-xs rounded border ${aspectRatio === ar ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
              >
                {ar}
              </button>
            ))}
          </div>
        </div>

        {/* Styles Section */}
        <div className="space-y-2">
            {mediaType === MediaType.IMAGE ? (
                <>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Palette size={14}/> Image Style
                    </label>
                    <select 
                        value={style}
                        onChange={(e) => setStyle(e.target.value as ImageStyle)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                        {STYLES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </>
            ) : (
                <>
                    <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                             <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Film size={14}/> Style
                            </label>
                            <select 
                                value={videoStyle}
                                onChange={(e) => setVideoStyle(e.target.value as VideoStyle)}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                            >
                                {VIDEO_STYLES.map((s) => (
                                <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-24 space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <MonitorPlay size={14}/> Quality
                            </label>
                            <select 
                                value={videoResolution}
                                onChange={(e) => setVideoResolution(e.target.value as VideoResolution)}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                            >
                                {VIDEO_RESOLUTIONS.map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </>
            )}
        </div>

        {/* Logo Integration (Library) */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <ImageIcon size={14}/> Logo Library
          </label>
          <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
            {/* None Selection */}
            <button 
                onClick={() => setSelectedLogo(null)}
                className={`aspect-square rounded border flex items-center justify-center text-[10px] ${selectedLogo === null ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
            >
                None
            </button>
            
            {/* Asset List */}
            {allLogos.map((logo) => (
              <button
                key={logo.id}
                onClick={() => setSelectedLogo(logo)}
                className={`aspect-square rounded border overflow-hidden relative group/logo ${selectedLogo?.id === logo.id ? 'ring-2 ring-blue-500 border-transparent' : 'border-slate-700 opacity-70 hover:opacity-100'}`}
                title={logo.name}
              >
                <img src={logo.url} alt={logo.name} className="w-full h-full object-cover bg-white/5" />
                <div className="absolute inset-x-0 bottom-0 bg-black/60 text-[8px] text-white p-0.5 truncate opacity-0 group-hover/logo:opacity-100 transition-opacity">
                    {logo.name}
                </div>
              </button>
            ))}

            {/* Upload Button */}
            <div 
                onClick={() => logoInputRef.current?.click()}
                className="aspect-square rounded border border-slate-700 border-dashed flex flex-col items-center justify-center text-slate-500 hover:text-white hover:border-slate-500 cursor-pointer bg-slate-800/50 transition-colors"
                title="Upload Logo"
            >
                 <Plus size={16} />
                 <span className="text-[9px] mt-1">Upload</span>
                 <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoFileChange} />
            </div>

          </div>
        </div>
        
        {/* Overlay Text & Effects */}
        <div className="space-y-2 border-t border-slate-800 pt-4">
             <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Type size={14}/> Text Overlay
             </label>
             <input 
                type="text"
                value={overlayText}
                onChange={(e) => setOverlayText(e.target.value)}
                placeholder="Enter caption..."
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 mb-2"
             />
             <select 
                value={overlayAnimation}
                onChange={(e) => setOverlayAnimation(e.target.value as OverlayAnimation)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none"
             >
                {OVERLAY_ANIMATIONS.map((oa) => (
                    <option key={oa} value={oa}>{oa}</option>
                ))}
             </select>
        </div>

      </div>

      <div className="p-5 mt-auto border-t border-slate-700 bg-slate-900 sticky bottom-0 shrink-0">
        <button
          onClick={() => {
              onGenerate();
              if (window.innerWidth < 768 && onClose) {
                  onClose(); // Auto close on mobile generate
              }
          }}
          disabled={isGenerating || !prompt}
          className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-semibold shadow-lg transition-all ${
            isGenerating 
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
              : mediaType === MediaType.IMAGE 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25' 
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-500/25'
          }`}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
              Generating...
            </>
          ) : (
            <>
              <Wand2 size={18} />
              Generate {mediaType === MediaType.IMAGE ? 'Image' : 'Video'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
