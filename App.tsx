import React, { useState, useEffect, useRef } from 'react';
import { Play, MessageSquare, Download, Save, Layers, Menu, X, Sparkles, Terminal, FilePlus, FolderOpen, Trash2, HardDrive, Share2, Upload, Cloud, History, RotateCcw, FileCode, Code, Settings } from 'lucide-react';
import { ProjectState, ChatMessage, TabOption, Template, SavedProject, ProjectMetadata } from './types';
import { TEMPLATES, BLANK_CODE } from './constants';
import CodeEditor from './components/CodeEditor';
import Preview from './components/Preview';
import { modifyGameCode } from './services/geminiService';
import * as StorageService from './services/storageService';

type MobileTab = 'code' | 'preview' | 'ai';

const App: React.FC = () => {
  // --- Global App State ---
  const [currentProject, setCurrentProject] = useState<SavedProject | null>(null);
  const [projectsList, setProjectsList] = useState<ProjectMetadata[]>([]);
  
  // --- UI State ---
  const [activeTab, setActiveTab] = useState<TabOption>(TabOption.JS);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hello! I am Elmo Engine. I can build, debug, and refine your game code. Try asking me to "Add a score system" or "Make the player faster".', timestamp: Date.now() }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  
  // Layout State
  // Desktop: Left (Projects) - Center (Code) - Right (Preview/AI)
  const [showProjectsPanel, setShowProjectsPanel] = useState(true); 
  const [mobileTab, setMobileTab] = useState<MobileTab>('code');
  
  // Modals
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // New Project Form
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState(TEMPLATES[0].id);

  // Drive Integration State
  const [isDriveConnected, setIsDriveConnected] = useState(false);

  // --- Initialization & Auto-save ---

  useEffect(() => {
    // Initial Load
    const list = StorageService.getProjects();
    setProjectsList(list);

    // Check mock drive connection
    if (localStorage.getItem('gameforge_drive_connected') === 'true') {
        setIsDriveConnected(true);
    }

    const lastId = localStorage.getItem('gameforge_last_project_id');
    if (lastId) {
      const loaded = StorageService.loadProject(lastId);
      if (loaded) {
        setCurrentProject(loaded);
        return;
      }
    }

    if (list.length > 0) {
      const first = StorageService.loadProject(list[0].id);
      if (first) setCurrentProject(first);
    } else {
        // Init default project
        setCurrentProject({
            metadata: {
                id: crypto.randomUUID(),
                name: 'My First Game',
                description: 'A new adventure',
                createdAt: Date.now(),
                lastModified: Date.now(),
                templateId: 'coin-collector',
                version: 1
            },
            content: TEMPLATES[0].code,
            history: []
        });
    }
  }, []);

  // Auto-save logic
  useEffect(() => {
    if (!currentProject) return;

    const timer = setTimeout(() => {
        StorageService.saveProject(currentProject);
        setProjectsList(StorageService.getProjects());
        localStorage.setItem('gameforge_last_project_id', currentProject.metadata.id);
    }, 5000); 

    return () => clearTimeout(timer);
  }, [currentProject]);

  // --- Handlers ---

  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
        alert("Please enter a project name");
        return;
    }

    const template = TEMPLATES.find(t => t.id === selectedTemplateId) || TEMPLATES[0];
    const code = selectedTemplateId === 'blank' ? BLANK_CODE : template.code;
    
    const newProject: SavedProject = {
        metadata: {
            id: crypto.randomUUID(),
            name: newProjectName,
            description: selectedTemplateId === 'blank' ? 'Empty Project' : template.description,
            createdAt: Date.now(),
            lastModified: Date.now(),
            templateId: selectedTemplateId,
            version: 1
        },
        content: code,
        history: []
    };

    StorageService.saveProject(newProject);
    setCurrentProject(newProject);
    setProjectsList(StorageService.getProjects());
    localStorage.setItem('gameforge_last_project_id', newProject.metadata.id);
    
    setShowNewProjectModal(false);
    setNewProjectName('');
    setChatHistory([{ role: 'model', text: `Created new project "${newProjectName}". Ready to code!`, timestamp: Date.now() }]);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleOpenProject = (id: string) => {
      const proj = StorageService.loadProject(id);
      if (proj) {
          setCurrentProject(proj);
          localStorage.setItem('gameforge_last_project_id', proj.metadata.id);
          setRefreshTrigger(prev => prev + 1);
          setChatHistory([{ role: 'model', text: `Loaded project "${proj.metadata.name}".`, timestamp: Date.now() }]);
      }
  };

  const handleDeleteProject = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (window.confirm("Are you sure you want to delete this project?")) {
          StorageService.deleteProject(id);
          const updatedList = StorageService.getProjects();
          setProjectsList(updatedList);
          
          if (currentProject?.metadata.id === id) {
              if (updatedList.length > 0) handleOpenProject(updatedList[0].id);
              else setCurrentProject(null);
          }
      }
  };

  const handleRun = () => {
    setRefreshTrigger(prev => prev + 1);
    if (window.innerWidth < 768) setMobileTab('preview');
  };

  const handleAIRequest = async () => {
    if (!userInput.trim() || isProcessingAI || !currentProject) return;

    const userMsg: ChatMessage = { role: 'user', text: userInput, timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);
    setUserInput('');
    setIsProcessingAI(true);

    try {
      // Create Backup before AI modification
      const backedUpProject = StorageService.createBackup(currentProject, `Before: ${userMsg.text.substring(0, 20)}...`);
      setCurrentProject(backedUpProject);

      const result = await modifyGameCode(backedUpProject.content, userMsg.text);
      
      const updatedProject = {
          ...backedUpProject,
          content: result.newCode,
          metadata: { ...backedUpProject.metadata, lastModified: Date.now(), version: (backedUpProject.metadata.version || 1) + 1 }
      };

      setCurrentProject(updatedProject);
      StorageService.saveProject(updatedProject); // Save strictly after AI change

      setRefreshTrigger(prev => prev + 1);
      setChatHistory(prev => [...prev, { 
        role: 'model', 
        text: result.explanation, 
        timestamp: Date.now() 
      }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { 
        role: 'model', 
        text: "I encountered an error modifying the code. No changes were applied.", 
        timestamp: Date.now() 
      }]);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const updateCode = (type: 'html' | 'css' | 'js', value: string) => {
      if (!currentProject) return;
      setCurrentProject({
          ...currentProject,
          content: { ...currentProject.content, [type]: value },
          metadata: { ...currentProject.metadata, lastModified: Date.now() }
      });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          StorageService.importProjectFromJson(file).then(proj => {
              proj.metadata.id = crypto.randomUUID();
              proj.metadata.name = proj.metadata.name + " (Imported)";
              StorageService.saveProject(proj);
              setProjectsList(StorageService.getProjects());
              setCurrentProject(proj);
          }).catch(err => alert("Failed to import: " + err.message));
      }
  };

  const handleRestore = (index: number) => {
      if (!currentProject) return;
      const restored = StorageService.restoreBackup(currentProject, index);
      if (restored) {
          setCurrentProject(restored);
          StorageService.saveProject(restored);
          setRefreshTrigger(prev => prev + 1);
          setShowHistoryModal(false);
          setChatHistory(prev => [...prev, { role: 'model', text: "Restored previous version.", timestamp: Date.now() }]);
      }
  };

  // --- Render Sections ---

  const renderNewProjectModal = () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2"><FilePlus className="w-5 h-5"/> New Project</h2>
                  <button onClick={() => setShowNewProjectModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-white"/></button>
              </div>
              <div className="p-6 space-y-6">
                  <div>
                      <label className="block text-xs uppercase font-bold text-slate-500 mb-2">Project Name</label>
                      <input 
                        type="text" 
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="e.g., Cyberpunk Runner 2077"
                        autoFocus
                      />
                  </div>
                  <div>
                      <label className="block text-xs uppercase font-bold text-slate-500 mb-2">Select Template</label>
                      <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                          {TEMPLATES.map(t => (
                              <button
                                key={t.id}
                                onClick={() => setSelectedTemplateId(t.id)}
                                className={`p-3 rounded-lg border text-left transition-all ${
                                    selectedTemplateId === t.id 
                                    ? 'border-indigo-500 bg-indigo-500/10 text-white' 
                                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-700'
                                }`}
                              >
                                  <div className="font-bold text-sm">{t.name}</div>
                                  <div className="text-[10px] opacity-70 mt-1 line-clamp-2">{t.description}</div>
                              </button>
                          ))}
                          <button
                            onClick={() => setSelectedTemplateId('blank')}
                            className={`p-3 rounded-lg border text-left transition-all ${
                                selectedTemplateId === 'blank' 
                                ? 'border-indigo-500 bg-indigo-500/10 text-white' 
                                : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-700'
                            }`}
                          >
                              <div className="font-bold text-sm">Blank Project</div>
                              <div className="text-[10px] opacity-70 mt-1">Start from scratch</div>
                          </button>
                      </div>
                  </div>
              </div>
              <div className="p-4 border-t border-slate-700 bg-slate-800 flex justify-end gap-3">
                  <button 
                    onClick={() => setShowNewProjectModal(false)}
                    className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                      Cancel
                  </button>
                  <button 
                    onClick={handleCreateProject}
                    className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-500/20"
                  >
                      Create Project
                  </button>
              </div>
          </div>
      </div>
  );

  const renderHistoryModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><History className="w-5 h-5"/> Version History</h2>
                <button onClick={() => setShowHistoryModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-white"/></button>
            </div>
            <div className="p-2 max-h-[60vh] overflow-y-auto">
                {(!currentProject?.history || currentProject.history.length === 0) && (
                    <div className="text-center p-8 text-slate-500">No history available yet. Make some changes!</div>
                )}
                {currentProject?.history?.map((h, idx) => (
                    <div key={h.timestamp} className="p-3 border-b border-slate-800 hover:bg-slate-800/50 flex justify-between items-center group">
                        <div>
                            <div className="text-xs text-slate-500">{new Date(h.timestamp).toLocaleString()}</div>
                            <div className="text-sm text-slate-300 font-medium">{h.note || "Auto-save"}</div>
                        </div>
                        <button 
                          onClick={() => handleRestore(idx)}
                          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            Restore
                        </button>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );

  const renderDriveModal = () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-6 text-center">
              <Cloud className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Google Drive Integration</h2>
              <p className="text-slate-400 text-sm mb-6">
                  Save your projects directly to Google Drive to access them from anywhere.
                  <br/><br/>
                  <span className="text-xs bg-yellow-900/30 text-yellow-500 px-2 py-1 rounded border border-yellow-800">Note: This requires a Google Cloud API Key & Client ID.</span>
              </p>
              
              {!isDriveConnected ? (
                  <button 
                    onClick={() => {
                        localStorage.setItem('gameforge_drive_connected', 'true');
                        setIsDriveConnected(true);
                        alert("Simulated Connection Successful! In a real deployment, this would open the Google OAuth popup.");
                    }}
                    className="w-full py-3 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                  >
                      <img src="https://www.google.com/favicon.ico" alt="G" className="w-4 h-4"/> Connect Google Drive
                  </button>
              ) : (
                  <div className="space-y-3">
                       <button className="w-full py-3 bg-slate-800 border border-slate-600 text-white rounded-lg hover:bg-slate-700 flex items-center justify-center gap-2">
                          <Upload className="w-4 h-4"/> Save Current Project to Drive
                       </button>
                       <button className="w-full py-3 bg-slate-800 border border-slate-600 text-white rounded-lg hover:bg-slate-700 flex items-center justify-center gap-2">
                          <FolderOpen className="w-4 h-4"/> Open from Drive
                       </button>
                       <button 
                         onClick={() => {
                             localStorage.removeItem('gameforge_drive_connected');
                             setIsDriveConnected(false);
                         }}
                         className="text-red-400 text-sm hover:underline mt-4 block"
                       >
                           Disconnect
                       </button>
                  </div>
              )}
              
              <button onClick={() => setShowDriveModal(false)} className="mt-6 text-slate-500 hover:text-white text-sm">Close</button>
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans fixed inset-0">
      
      {showNewProjectModal && renderNewProjectModal()}
      {showHistoryModal && renderHistoryModal()}
      {showDriveModal && renderDriveModal()}

      {/* --- Top Bar --- */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 md:px-4 shrink-0 z-20 shadow-lg">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowProjectsPanel(!showProjectsPanel)}
            className={`p-2 rounded-md transition-colors ${showProjectsPanel ? 'text-indigo-400 bg-slate-800' : 'text-slate-400 hover:text-white'}`}
            title="Toggle Projects Panel"
          >
            <Layers className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg hidden sm:block shadow-indigo-500/20 shadow-md">
              <Terminal className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
                <h1 className="text-sm md:text-base font-bold text-slate-100 leading-tight">
                {currentProject?.metadata.name || "Elmo Engine"}
                </h1>
                <span className="text-[10px] text-slate-500 hidden sm:inline-block">v{currentProject?.metadata.version || 1}.0 • {isDriveConnected ? 'Cloud Synced' : 'Local Storage'}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 md:gap-2">
             <button onClick={() => setShowNewProjectModal(true)} className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors" title="New Project">
                 <FilePlus className="w-4 h-4" />
             </button>
             <button onClick={() => setShowDriveModal(true)} className={`p-2 rounded transition-colors ${isDriveConnected ? 'text-green-400 hover:bg-slate-800' : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800'}`} title="Google Drive">
                 <Cloud className="w-4 h-4" />
             </button>
             
             <div className="h-6 w-px bg-slate-800 mx-1 hidden md:block"></div>
             
             <button onClick={() => setShowHistoryModal(true)} className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors hidden md:block" title="History">
                 <History className="w-4 h-4" />
             </button>
             
             <div className="relative group hidden md:block">
                 <button className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors" title="Export">
                    <Download className="w-4 h-4" />
                 </button>
                 <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 hidden group-hover:block z-50">
                     <button onClick={() => currentProject && StorageService.exportProjectToZip(currentProject)} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                        <FolderOpen className="w-4 h-4"/> Export ZIP
                     </button>
                     <button onClick={() => currentProject && StorageService.exportProjectToHTML(currentProject)} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                        <FileCode className="w-4 h-4"/> Export HTML
                     </button>
                 </div>
             </div>
        
          <button 
            onClick={handleRun}
            className="ml-2 flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white px-4 py-1.5 rounded-md font-bold text-xs md:text-sm shadow-lg shadow-green-900/20 active:scale-95 transition-all"
          >
            <Play className="w-3 h-3 md:w-4 md:h-4 fill-current" />
            <span className="hidden xs:inline">RUN</span>
          </button>
        </div>
      </header>

      {/* --- Main Workspace --- */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left: Projects Panel */}
        <div className={`
          ${showProjectsPanel ? 'w-64' : 'w-0'} 
          bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out flex flex-col shrink-0 overflow-hidden absolute md:relative z-30 h-full shadow-2xl md:shadow-none
        `}>
           <div className="flex-1 overflow-y-auto">
               <div className="p-3">
                   <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">Local Projects</h3>
                   <div className="space-y-1">
                       {projectsList.map(p => (
                           <div 
                            key={p.id}
                            onClick={() => { handleOpenProject(p.id); if(window.innerWidth < 768) setShowProjectsPanel(false); }}
                            className={`group px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between transition-all ${
                                currentProject?.metadata.id === p.id 
                                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' 
                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                            }`}
                           >
                               <div className="truncate">
                                   <div className="font-medium text-sm truncate">{p.name}</div>
                                   <div className="text-[10px] opacity-60">{new Date(p.lastModified).toLocaleDateString()}</div>
                               </div>
                               <button 
                                onClick={(e) => handleDeleteProject(e, p.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                               >
                                   <Trash2 className="w-3 h-3" />
                               </button>
                           </div>
                       ))}
                       {projectsList.length === 0 && <div className="text-center text-xs text-slate-600 py-4">No projects yet</div>}
                   </div>
               </div>
               
               <div className="p-3 border-t border-slate-800">
                   <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">Actions</h3>
                    <label className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-700 mb-2">
                       <Upload className="w-3 h-3"/> Import JSON
                       <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                   </label>
               </div>
           </div>
        </div>

        {/* Center: Editors */}
        <div className={`
          ${mobileTab === 'code' ? 'flex' : 'hidden'} 
          md:flex flex-1 flex-col min-w-0 bg-[#1e1e1e] relative z-0
        `}>
           {/* Editor Tabs */}
          <div className="flex bg-slate-900 border-b border-slate-800">
            {Object.values(TabOption).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs md:text-sm font-medium border-t-2 transition-colors flex items-center gap-2 ${
                  activeTab === tab 
                    ? 'border-indigo-500 text-slate-200 bg-[#1e1e1e]' 
                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                }`}
              >
                {tab === TabOption.HTML && <Code className="w-3 h-3"/>}
                {tab === TabOption.CSS && <Sparkles className="w-3 h-3"/>}
                {tab === TabOption.JS && <Terminal className="w-3 h-3"/>}
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 relative">
             {currentProject && (
                 <>
                    <div className={`absolute inset-0 ${activeTab === TabOption.HTML ? 'z-10' : 'z-0 hidden'}`}>
                    <CodeEditor language="HTML" code={currentProject.content.html} onChange={(v) => updateCode('html', v)} />
                    </div>
                    <div className={`absolute inset-0 ${activeTab === TabOption.CSS ? 'z-10' : 'z-0 hidden'}`}>
                    <CodeEditor language="CSS" code={currentProject.content.css} onChange={(v) => updateCode('css', v)} />
                    </div>
                    <div className={`absolute inset-0 ${activeTab === TabOption.JS ? 'z-10' : 'z-0 hidden'}`}>
                    <CodeEditor language="JavaScript" code={currentProject.content.js} onChange={(v) => updateCode('js', v)} />
                    </div>
                 </>
             )}
          </div>
        </div>

        {/* Right: Preview & AI */}
        <div className={`
          ${mobileTab === 'preview' || mobileTab === 'ai' ? 'flex' : 'hidden'} 
          md:flex flex-col w-full md:w-[450px] shrink-0 bg-slate-900 border-l border-slate-800
        `}>
           
           {/* Top: Preview */}
           <div className={`
             ${mobileTab === 'preview' ? 'flex-1' : 'hidden'}
             md:flex md:h-[50%] flex-col relative border-b border-slate-800
           `}>
             <div className="bg-slate-950 px-3 py-1.5 border-b border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-bold tracking-wider">
                <span className="flex items-center gap-1.5"><Play className="w-3 h-3"/> PREVIEW</span>
                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/10 text-green-500 rounded border border-green-500/20">
                    <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse"/> LIVE
                </span>
             </div>
             <div className="flex-1 bg-black relative">
                {currentProject && <Preview projectState={currentProject.content} refreshTrigger={refreshTrigger} />}
             </div>
           </div>

           {/* Bottom: AI */}
           <div className={`
              ${mobileTab === 'ai' ? 'flex-1' : 'hidden'}
              md:flex md:flex-1 flex-col bg-slate-900 relative
           `}>
              <div className="px-3 py-2 bg-slate-800 border-y border-slate-700 flex justify-between items-center shrink-0 shadow-sm">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs md:text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Assistant</span>
                </div>
                <button onClick={() => setChatHistory([])} className="p-1 hover:bg-slate-700 rounded text-slate-500" title="Clear Chat">
                    <Trash2 className="w-3.5 h-3.5"/>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-slate-900/50">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-br-sm' 
                        : 'bg-slate-800 text-slate-300 rounded-bl-sm border border-slate-700'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isProcessingAI && (
                   <div className="flex justify-start">
                      <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-none flex gap-1 items-center border border-slate-700">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                      </div>
                   </div>
                )}
              </div>

              <div className="p-3 bg-slate-800 shrink-0">
                <div className="relative">
                  <input
                    type="text"
                    className="w-full bg-slate-900 text-white rounded-lg pl-3 pr-10 py-2.5 text-sm border border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-500 transition-all"
                    placeholder="Ask AI to change something..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAIRequest()}
                    disabled={isProcessingAI}
                  />
                  <button 
                    onClick={handleAIRequest}
                    disabled={isProcessingAI || !userInput.trim()}
                    className="absolute right-1.5 top-1.5 p-1.5 bg-indigo-600 rounded-md hover:bg-indigo-500 disabled:opacity-50 transition-all hover:scale-105"
                  >
                    <MessageSquare className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
           </div>
        </div>

      </div>

      {/* --- Mobile Bottom Nav --- */}
      <div className="md:hidden h-14 bg-slate-900 border-t border-slate-800 flex items-center justify-around shrink-0 z-50 shadow-2xl">
        <button 
          onClick={() => setMobileTab('code')}
          className={`flex flex-col items-center justify-center h-full w-full transition-colors ${mobileTab === 'code' ? 'text-indigo-400 bg-slate-800/50' : 'text-slate-500'}`}
        >
          <Terminal className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium">Code</span>
        </button>
        <button 
          onClick={() => setMobileTab('preview')}
          className={`flex flex-col items-center justify-center h-full w-full transition-colors ${mobileTab === 'preview' ? 'text-indigo-400 bg-slate-800/50' : 'text-slate-500'}`}
        >
          <Play className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium">Play</span>
        </button>
        <button 
          onClick={() => setMobileTab('ai')}
          className={`flex flex-col items-center justify-center h-full w-full transition-colors ${mobileTab === 'ai' ? 'text-indigo-400 bg-slate-800/50' : 'text-slate-500'}`}
        >
          <Sparkles className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium">AI</span>
        </button>
      </div>

    </div>
  );
};

export default App;