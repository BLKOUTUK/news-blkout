
import React, { useState } from 'react';
import { GeneratedAsset, MediaType, ProjectTemplate, AgentTask } from '../types';
import { Image, Video, Clock, Star, Tag, Search, Plus, X, Filter, LayoutTemplate, History, ArrowRight, Bot, ChevronDown, ChevronUp, Zap, Target } from 'lucide-react';

interface AssetLibraryProps {
  assets: GeneratedAsset[];
  templates: ProjectTemplate[];
  agentTasks: AgentTask[];
  onSelect: (asset: GeneratedAsset) => void;
  onToggleFavorite: (id: string) => void;
  onAddTag: (id: string, tag: string) => void;
  onRemoveTag: (id: string, tag: string) => void;
  onApplyTemplate: (template: ProjectTemplate) => void;
  onSelectAgentTask: (task: AgentTask) => void;
  onClose?: () => void;
}

export const AssetLibrary: React.FC<AssetLibraryProps> = ({ 
  assets, 
  templates,
  agentTasks,
  onSelect, 
  onToggleFavorite, 
  onAddTag, 
  onRemoveTag,
  onApplyTemplate,
  onSelectAgentTask,
  onClose
}) => {
  const [mainTab, setMainTab] = useState<'AGENTS' | 'TEMPLATES' | 'LIBRARY'>('AGENTS');
  const [view, setView] = useState<'ALL' | 'FAV'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [tagInputActive, setTagInputActive] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Filter Logic
  const filteredAssets = assets.filter(asset => {
    const matchesView = view === 'ALL' || (view === 'FAV' && asset.isFavorite);
    const matchesSearch = asset.prompt.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          asset.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesView && matchesSearch;
  });

  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    template.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTasks = agentTasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.agentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddTagSubmit = (e: React.FormEvent, assetId: string) => {
    e.preventDefault();
    if (newTag.trim()) {
      onAddTag(assetId, newTag.trim());
      setNewTag('');
      setTagInputActive(null);
    }
  };

  const toggleExpandTask = (e: React.MouseEvent, taskId: string) => {
      e.stopPropagation();
      setExpandedTaskId(prev => prev === taskId ? null : taskId);
  };

  const handleLoadTask = (e: React.MouseEvent, task: AgentTask) => {
      e.stopPropagation();
      onSelectAgentTask(task);
  };

  const getPriorityColor = (p: string) => {
      switch(p) {
          case 'HIGH': return 'text-red-400 border-red-900 bg-red-900/20';
          case 'MEDIUM': return 'text-amber-400 border-amber-900 bg-amber-900/20';
          default: return 'text-blue-400 border-blue-900 bg-blue-900/20';
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 w-[85vw] md:w-80 border-r border-slate-700 overflow-hidden">
      {/* Mobile Header for Close */}
      <div className="md:hidden flex items-center justify-between p-3 border-b border-slate-700 bg-slate-800">
          <span className="font-semibold text-slate-200 text-sm">Dashboard</span>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
              <X size={18} />
          </button>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex border-b border-slate-700 shrink-0">
        <button 
            onClick={() => setMainTab('AGENTS')}
            className={`flex-1 py-3 text-[10px] md:text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${mainTab === 'AGENTS' ? 'bg-slate-800 text-green-400 border-b-2 border-green-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
        >
            <Bot size={14} /> Inbox {agentTasks.length > 0 && <span className="bg-green-600 text-white text-[9px] px-1 rounded-full">{agentTasks.length}</span>}
        </button>
        <button 
            onClick={() => setMainTab('TEMPLATES')}
            className={`flex-1 py-3 text-[10px] md:text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${mainTab === 'TEMPLATES' ? 'bg-slate-800 text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
        >
            <LayoutTemplate size={14} /> Presets
        </button>
        <button 
            onClick={() => setMainTab('LIBRARY')}
            className={`flex-1 py-3 text-[10px] md:text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${mainTab === 'LIBRARY' ? 'bg-slate-800 text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
        >
            <History size={14} /> Library
        </button>
      </div>

      {/* Header & Controls */}
      <div className="p-4 border-b border-slate-700 bg-slate-900 space-y-3 z-10 shrink-0">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-slate-500" />
          <input 
            type="text" 
            placeholder={
                mainTab === 'AGENTS' ? "Filter inbox..." : 
                mainTab === 'TEMPLATES' ? "Find templates..." : "Search assets..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-slate-500"
          />
        </div>

        {/* Sub-Filters (Only for Library) */}
        {mainTab === 'LIBRARY' && (
            <div className="flex bg-slate-800 p-1 rounded-md">
            <button 
                onClick={() => setView('ALL')}
                className={`flex-1 text-[10px] font-medium py-1.5 rounded transition-colors ${view === 'ALL' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
                All Assets
            </button>
            <button 
                onClick={() => setView('FAV')}
                className={`flex-1 text-[10px] font-medium py-1.5 rounded transition-colors flex items-center justify-center gap-1 ${view === 'FAV' ? 'bg-amber-600/80 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
                <Star size={10} fill={view === 'FAV' ? "currentColor" : "none"}/> Favorites
            </button>
            </div>
        )}
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
        
        {/* AGENTS INBOX VIEW */}
        {mainTab === 'AGENTS' && (
             filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-slate-500 text-xs text-center mt-10 opacity-60">
                    <Bot size={24} className="mb-2" />
                    <p>No pending tasks.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredTasks.map(task => {
                        const isExpanded = expandedTaskId === task.id;
                        return (
                            <div 
                                key={task.id}
                                className={`bg-slate-800 border rounded-lg transition-all cursor-pointer overflow-hidden ${isExpanded ? 'border-green-500/50 shadow-lg shadow-green-900/10' : 'border-slate-700 hover:border-slate-600'}`}
                                onClick={(e) => toggleExpandTask(e, task.id)}
                            >
                                {/* Header Summary */}
                                <div className="p-3">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded border ${getPriorityColor(task.priority)} font-bold`}>
                                                {task.priority}
                                            </span>
                                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                                <Clock size={10}/> {new Date(task.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                        {isExpanded ? <ChevronUp size={14} className="text-slate-500"/> : <ChevronDown size={14} className="text-slate-500"/>}
                                    </div>
                                    
                                    <div className="flex items-start gap-2">
                                        <div className="pt-0.5">
                                             <Bot size={14} className="text-green-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-semibold text-white leading-tight">{task.title}</h3>
                                            {!isExpanded && (
                                                 <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{task.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="px-3 pb-3 border-t border-slate-700/50 pt-3 bg-slate-800/50 animation-fade-in">
                                        <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                                            {task.description}
                                        </p>

                                        {/* Attributes Grid */}
                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            <div className="bg-slate-900 rounded p-2 border border-slate-700/50">
                                                <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-1">Platform</span>
                                                <div className="flex items-center gap-1.5 text-xs text-white">
                                                    <Target size={12} className="text-blue-400"/>
                                                    {task.targetPlatform}
                                                </div>
                                            </div>
                                            <div className="bg-slate-900 rounded p-2 border border-slate-700/50">
                                                <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-1">Media Type</span>
                                                <div className="flex items-center gap-1.5 text-xs text-white">
                                                    {task.suggestedConfig.mediaType === MediaType.VIDEO ? <Video size={12} className="text-purple-400"/> : <Image size={12} className="text-blue-400"/>}
                                                    {task.suggestedConfig.mediaType}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Suggested Prompt Preview */}
                                        <div className="mb-4">
                                            <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-1">Suggested Prompt</span>
                                            <div className="bg-slate-900 p-2 rounded text-[10px] text-slate-400 italic border border-slate-700/50 border-l-2 border-l-green-500">
                                                "{task.suggestedConfig.prompt}"
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <button 
                                            onClick={(e) => handleLoadTask(e, task)}
                                            className="w-full py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-xs font-semibold rounded flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 transition-all"
                                        >
                                            <Zap size={14} />
                                            Load Configuration
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )
        )}

        {/* LIBRARY VIEW */}
        {mainTab === 'LIBRARY' && (
             filteredAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-slate-500 text-xs text-center mt-10 opacity-60">
                    <Filter size={24} className="mb-2" />
                    <p>No assets found.</p>
                </div>
            ) : (
                filteredAssets.map((asset) => (
                    <div 
                    key={asset.id} 
                    className="group relative rounded-lg overflow-hidden border border-slate-700 bg-slate-800 hover:border-blue-500/50 transition-all flex flex-col"
                    >
                    {/* Media Preview */}
                    <div 
                        className="aspect-video w-full bg-black relative cursor-pointer"
                        onClick={() => onSelect(asset)}
                    >
                        {asset.type === MediaType.IMAGE ? (
                        <img src={asset.url} alt="Thumbnail" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        ) : (
                        <video src={asset.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        )}
                        
                        <div className="absolute top-2 right-2 bg-black/60 p-1 rounded backdrop-blur-sm">
                        {asset.type === MediaType.IMAGE ? <Image size={10} className="text-white" /> : <Video size={10} className="text-white" />}
                        </div>

                        <button 
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(asset.id); }}
                        className="absolute top-2 left-2 p-1.5 rounded-full bg-black/40 hover:bg-black/80 backdrop-blur-sm transition-colors"
                        >
                        <Star size={12} className={asset.isFavorite ? "text-amber-400 fill-amber-400" : "text-slate-300"} />
                        </button>
                    </div>

                    {/* Info */}
                    <div className="p-3 space-y-2">
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed" title={asset.prompt}>{asset.prompt}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>{new Date(asset.timestamp).toLocaleDateString()}</span>
                        <span>{asset.aspectRatio}</span>
                        </div>
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                        {asset.tags?.map(tag => (
                            <span key={tag} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-700/50 text-[9px] text-slate-300 border border-slate-700">
                            {tag}
                            <button onClick={(e) => { e.stopPropagation(); onRemoveTag(asset.id, tag); }} className="hover:text-red-400"><X size={8} /></button>
                            </span>
                        ))}
                        {tagInputActive === asset.id ? (
                            <form onSubmit={(e) => handleAddTagSubmit(e, asset.id)} className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <input autoFocus type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} onBlur={() => setTagInputActive(null)} className="w-16 bg-slate-700 border border-slate-600 rounded px-1 py-0.5 text-[9px] text-white focus:outline-none focus:border-blue-500" placeholder="Tag..."/>
                            </form>
                        ) : (
                            <button onClick={(e) => { e.stopPropagation(); setTagInputActive(asset.id); setNewTag(''); }} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-dashed border-slate-600 text-[9px] text-slate-500 hover:text-blue-400 hover:border-blue-400 transition-colors"><Plus size={8} /> Tag</button>
                        )}
                        </div>
                    </div>
                    </div>
                ))
            )
        )}

        {/* TEMPLATES VIEW */}
        {mainTab === 'TEMPLATES' && (
            <div className="space-y-3">
                {filteredTemplates.map(template => (
                    <div 
                        key={template.id}
                        className="bg-slate-800 border border-slate-700 rounded-lg p-3 hover:border-purple-500/50 hover:bg-slate-700/50 transition-all cursor-pointer group"
                        onClick={() => onApplyTemplate(template)}
                    >
                        <div className="flex items-start justify-between mb-2">
                             <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-md flex items-center justify-center ${template.config.mediaType === MediaType.VIDEO ? 'bg-purple-900/50 text-purple-400' : 'bg-blue-900/50 text-blue-400'}`}>
                                    {template.config.mediaType === MediaType.VIDEO ? <Video size={16} /> : <Image size={16} />}
                                </div>
                                <div>
                                    <h3 className="text-xs font-semibold text-white">{template.name}</h3>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wide">{template.category}</span>
                                </div>
                             </div>
                             <button className="text-slate-500 group-hover:text-purple-400 transition-colors">
                                 <ArrowRight size={14} />
                             </button>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">
                            {template.description}
                        </p>
                        <div className="mt-2 pt-2 border-t border-slate-700/50 flex flex-wrap gap-2 text-[9px] text-slate-500">
                            <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">{template.config.aspectRatio}</span>
                            {template.config.overlayAnimation !== 'No Animation' && <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">Anim: {template.config.overlayAnimation}</span>}
                        </div>
                    </div>
                ))}
            </div>
        )}

      </div>
    </div>
  );
};
