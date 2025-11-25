
import React, { useState } from 'react';
import { AspectRatio, ExportFormat, LogoAsset, MediaType, OverlayAnimation, LogoPosition } from '../types';
import { Download, Share2, Maximize2, X, FileVideo, Send, Check, Settings2, Grid3X3 } from 'lucide-react';

interface PreviewAreaProps {
  currentUrl: string | null;
  currentType: MediaType;
  currentAspectRatio: AspectRatio;
  logo: LogoAsset | null;
  logoPosition: LogoPosition;
  setLogoPosition: (p: LogoPosition) => void;
  logoOpacity: number;
  setLogoOpacity: (o: number) => void;
  isGenerating: boolean;
  overlayText: string;
  overlayAnimation: OverlayAnimation;
  currentResolution?: string;
  onPushToAutomation: () => void;
  isPushing: boolean;
}

export const PreviewArea: React.FC<PreviewAreaProps> = ({ 
  currentUrl, currentType, currentAspectRatio, logo, 
  logoPosition, setLogoPosition, logoOpacity, setLogoOpacity,
  isGenerating,
  overlayText, overlayAnimation, currentResolution,
  onPushToAutomation, isPushing
}) => {
  const [showExport, setShowExport] = useState(false);
  const [showLogoSettings, setShowLogoSettings] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>(ExportFormat.MP4);
  const [filename, setFilename] = useState('social-sync-export');
  const [pushSuccess, setPushSuccess] = useState(false);

  // Calculate aspect ratio for inline styles
  const getAspectRatioStyle = () => {
    const [w, h] = currentAspectRatio.split(':').map(Number);
    return { aspectRatio: `${w}/${h}` };
  };

  const getLogoPositionClass = (pos: LogoPosition) => {
    switch (pos) {
      case LogoPosition.TOP_LEFT: return 'top-6 left-6';
      case LogoPosition.TOP_RIGHT: return 'top-6 right-6';
      case LogoPosition.BOTTOM_LEFT: return 'bottom-6 left-6';
      case LogoPosition.BOTTOM_RIGHT: return 'bottom-6 right-6';
      case LogoPosition.CENTER: return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
      default: return 'bottom-6 right-6';
    }
  };

  const getAnimationClass = (anim: OverlayAnimation) => {
      switch (anim) {
          case OverlayAnimation.FADE_IN: return 'animate-[fadeIn_1.5s_ease-out_forwards]';
          case OverlayAnimation.SLIDE_UP: return 'animate-[slideUp_1s_ease-out_forwards]';
          case OverlayAnimation.TYPEWRITER: return 'animate-[typing_3s_steps(40,end)] overflow-hidden border-r-2 border-white whitespace-nowrap w-fit mx-auto px-1';
          case OverlayAnimation.BOUNCE: return 'animate-[bounceIn_0.8s_cubic-bezier(0.215,0.61,0.355,1)_forwards]';
          case OverlayAnimation.ZOOM_IN: return 'animate-[zoomIn_0.8s_ease-out_forwards]';
          case OverlayAnimation.ZOOM_OUT: return 'animate-[zoomOut_0.8s_ease-out_forwards]';
          case OverlayAnimation.PULSE: return 'animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]';
          default: return '';
      }
  };

  const handleDownload = async () => {
      if (!currentUrl) return;
      
      try {
          const response = await fetch(currentUrl);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `${filename}.${exportFormat}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          setShowExport(false);
      } catch (e) {
          console.error("Download failed", e);
      }
  };

  const handleAutomationClick = async () => {
      onPushToAutomation();
      setPushSuccess(true);
      setTimeout(() => setPushSuccess(false), 3000);
  };

  return (
    <div className="flex-1 bg-slate-950 flex flex-col relative overflow-hidden">
        {/* CSS for custom animations */}
        <style dangerouslySetInnerHTML={{__html: `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            @keyframes typing { from { width: 0 } to { width: 100% } }
            @keyframes bounceIn {
                0% { opacity: 0; transform: scale(0.3); }
                50% { opacity: 1; transform: scale(1.05); }
                70% { transform: scale(0.9); }
                100% { transform: scale(1); }
            }
            @keyframes zoomIn { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
            @keyframes zoomOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.5); } }
        `}} />

        {/* Toolbar */}
      <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/50 backdrop-blur z-10">
        <div className="text-sm font-medium text-slate-300 flex items-center gap-3">
           Canvas View <span className="text-slate-600">|</span> 
           {currentResolution && <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">{currentResolution}</span>}
        </div>
        <div className="flex gap-3">
            {/* Automation Button */}
            <button 
                onClick={handleAutomationClick}
                disabled={!currentUrl || isPushing}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    pushSuccess 
                    ? 'bg-green-500 text-white' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
            >
                {isPushing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                ) : pushSuccess ? (
                    <> <Check size={14} /> Sent to Queue </>
                ) : (
                    <> <Send size={14} /> Push to Automation </>
                )}
            </button>

            <div className="h-6 w-px bg-slate-700 my-auto mx-1" />

            {/* Logo Settings */}
            {logo && (
                <div className="relative">
                    <button
                        onClick={() => setShowLogoSettings(!showLogoSettings)}
                        className={`p-2 rounded-full transition-colors flex items-center gap-2 ${showLogoSettings ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
                        title="Logo Settings"
                    >
                        <Settings2 size={18} />
                    </button>

                     {showLogoSettings && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-4 z-50">
                             <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                                <h3 className="text-xs font-semibold text-white flex items-center gap-2">
                                    <Grid3X3 size={14}/> Logo Overlay
                                </h3>
                                <button onClick={() => setShowLogoSettings(false)} className="text-slate-500 hover:text-white">
                                    <X size={14} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Position Selector */}
                                <div>
                                    <label className="text-[10px] text-slate-400 block mb-2 uppercase tracking-wide">Position</label>
                                    <div className="grid grid-cols-3 gap-1 bg-slate-800 p-1 rounded">
                                        <button 
                                            onClick={() => setLogoPosition(LogoPosition.TOP_LEFT)} 
                                            className={`h-8 rounded flex items-center justify-center hover:bg-slate-700 ${logoPosition === LogoPosition.TOP_LEFT ? 'bg-blue-600/50 border border-blue-500 text-white' : 'text-slate-500'}`}
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-current"/>
                                        </button>
                                        <div className="h-8 rounded border border-transparent flex items-center justify-center"></div>
                                        <button 
                                            onClick={() => setLogoPosition(LogoPosition.TOP_RIGHT)} 
                                            className={`h-8 rounded flex items-center justify-center hover:bg-slate-700 ${logoPosition === LogoPosition.TOP_RIGHT ? 'bg-blue-600/50 border border-blue-500 text-white' : 'text-slate-500'}`}
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-current"/>
                                        </button>
                                        
                                        <div className="h-8 rounded border border-transparent flex items-center justify-center"></div>
                                        <button 
                                            onClick={() => setLogoPosition(LogoPosition.CENTER)} 
                                            className={`h-8 rounded flex items-center justify-center hover:bg-slate-700 ${logoPosition === LogoPosition.CENTER ? 'bg-blue-600/50 border border-blue-500 text-white' : 'text-slate-500'}`}
                                        >
                                            <div className="w-2 h-2 rounded-sm bg-current"/>
                                        </button>
                                        <div className="h-8 rounded border border-transparent flex items-center justify-center"></div>
                                        
                                        <button 
                                            onClick={() => setLogoPosition(LogoPosition.BOTTOM_LEFT)} 
                                            className={`h-8 rounded flex items-center justify-center hover:bg-slate-700 ${logoPosition === LogoPosition.BOTTOM_LEFT ? 'bg-blue-600/50 border border-blue-500 text-white' : 'text-slate-500'}`}
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-current"/>
                                        </button>
                                        <div className="h-8 rounded border border-transparent flex items-center justify-center"></div>
                                        <button 
                                            onClick={() => setLogoPosition(LogoPosition.BOTTOM_RIGHT)} 
                                            className={`h-8 rounded flex items-center justify-center hover:bg-slate-700 ${logoPosition === LogoPosition.BOTTOM_RIGHT ? 'bg-blue-600/50 border border-blue-500 text-white' : 'text-slate-500'}`}
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-current"/>
                                        </button>
                                    </div>
                                </div>

                                {/* Opacity Slider */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                         <label className="text-[10px] text-slate-400 uppercase tracking-wide">Opacity</label>
                                         <span className="text-[10px] text-white">{Math.round(logoOpacity * 100)}%</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0.1" 
                                        max="1" 
                                        step="0.05"
                                        value={logoOpacity}
                                        onChange={(e) => setLogoOpacity(parseFloat(e.target.value))}
                                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Export Button */}
            <div className="relative">
                <button 
                    onClick={() => currentUrl && setShowExport(!showExport)}
                    className={`p-2 rounded-full transition-colors flex items-center gap-2 ${showExport ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
                    title="Download"
                    disabled={!currentUrl}
                >
                    <Download size={18} />
                </button>
                
                {/* Export Popup */}
                {showExport && (
                    <div className="absolute top-full right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-4 z-50">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                <FileVideo size={16}/> Export Settings
                            </h3>
                            <button onClick={() => setShowExport(false)} className="text-slate-500 hover:text-white">
                                <X size={14} />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">Filename</label>
                                <input 
                                    type="text" 
                                    value={filename}
                                    onChange={(e) => setFilename(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">Format</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.values(ExportFormat).map(fmt => (
                                        <button 
                                            key={fmt}
                                            onClick={() => setExportFormat(fmt)}
                                            className={`text-xs py-1.5 rounded border ${exportFormat === fmt ? 'bg-blue-600/20 border-blue-600 text-blue-400' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                        >
                                            {fmt.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={handleDownload}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 rounded transition-colors"
                            >
                                Download File
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            <button className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors" title="Share">
                <Share2 size={18} />
            </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
        {currentUrl ? (
           <div 
             className="relative shadow-2xl rounded-sm overflow-hidden bg-black max-h-full max-w-full transition-all duration-500 group"
             style={{ ...getAspectRatioStyle(), width: 'auto', height: 'auto', maxHeight: '100%', maxWidth: '100%' }}
           >
              {currentType === MediaType.IMAGE ? (
                  <img src={currentUrl} alt="Generated" className="w-full h-full object-cover" />
              ) : (
                  <video src={currentUrl} controls autoPlay loop className="w-full h-full object-cover" />
              )}
              
              {/* Logo Overlay */}
              {logo && (
                  <div 
                    className={`absolute w-[15%] pointer-events-none mix-blend-screen transition-all duration-300 ${getLogoPositionClass(logoPosition)}`}
                    style={{ opacity: logoOpacity }}
                  >
                      <img src={logo.url} alt="Logo" className="w-full h-auto drop-shadow-lg" />
                  </div>
              )}

              {/* Text Overlay */}
              {overlayText && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-8 overflow-hidden">
                      <div className={`text-white font-bold text-4xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-center ${getAnimationClass(overlayAnimation)}`}>
                          {overlayText}
                      </div>
                  </div>
              )}
           </div>
        ) : (
            <div className="text-center space-y-4 opacity-30">
                <div className={`w-24 h-24 rounded-full border-4 border-slate-700 border-dashed mx-auto flex items-center justify-center ${isGenerating ? 'animate-pulse' : ''}`}>
                    <div className="w-16 h-16 bg-slate-800 rounded-full" />
                </div>
                <p className="text-slate-400 font-light text-lg">
                    {isGenerating ? "AI is dreaming..." : "Ready to create"}
                </p>
            </div>
        )}
      </div>
      
      {/* Loading Overlay */}
      {isGenerating && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-20 flex items-center justify-center flex-col gap-4">
              <div className="text-white font-light text-xl tracking-widest animate-pulse">GENERATING</div>
              <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 w-1/2 animate-[shimmer_1.5s_infinite_linear] relative left-0" />
              </div>
          </div>
      )}
    </div>
  );
};
