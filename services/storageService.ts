import { SavedProject, ProjectState, ProjectMetadata } from '../types';
import JSZip from 'jszip';

const STORAGE_KEY = 'gameforge_projects';

// --- Local Storage ---

export const getProjects = (): ProjectMetadata[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const projects: SavedProject[] = JSON.parse(raw);
    return projects.map(p => p.metadata).sort((a, b) => b.lastModified - a.lastModified);
  } catch (e) {
    console.error("Failed to list projects", e);
    return [];
  }
};

export const loadProject = (id: string): SavedProject | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const projects: SavedProject[] = JSON.parse(raw);
    return projects.find(p => p.metadata.id === id) || null;
  } catch (e) {
    console.error("Failed to load project", e);
    return null;
  }
};

export const saveProject = (project: SavedProject): void => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let projects: SavedProject[] = raw ? JSON.parse(raw) : [];
    
    const index = projects.findIndex(p => p.metadata.id === project.metadata.id);
    project.metadata.lastModified = Date.now();
    project.metadata.version = (project.metadata.version || 0) + 1;

    if (index >= 0) {
      // Merge history to ensure we don't lose it if the passed project object is partial (though it shouldn't be)
      projects[index] = project;
    } else {
      projects.push(project);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error("Failed to save project", e);
    alert("Storage quota exceeded! Please delete some old projects.");
  }
};

export const createBackup = (project: SavedProject, note: string = 'Auto-backup'): SavedProject => {
  // Add current state to history
  const historyItem = {
    timestamp: Date.now(),
    content: { ...project.content },
    note
  };
  
  // Keep only last 10 versions
  const newHistory = [historyItem, ...(project.history || [])].slice(0, 10);
  
  const updatedProject = {
    ...project,
    history: newHistory
  };
  
  saveProject(updatedProject);
  return updatedProject;
};

export const restoreBackup = (project: SavedProject, historyIndex: number): SavedProject | null => {
    if (!project.history || !project.history[historyIndex]) return null;
    
    const backup = project.history[historyIndex];
    // Create a new backup of the *current* state before restoring, just in case
    const safeProject = createBackup(project, 'Pre-restore backup');

    return {
        ...safeProject,
        content: { ...backup.content },
        metadata: { ...safeProject.metadata, lastModified: Date.now() }
    };
};

export const deleteProject = (id: string): void => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    let projects: SavedProject[] = JSON.parse(raw);
    projects = projects.filter(p => p.metadata.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error("Failed to delete project", e);
  }
};

// --- Export / Import ---

export const exportProjectToZip = async (project: SavedProject) => {
  const zip = new JSZip();
  const folder = zip.folder(project.metadata.name.replace(/\s+/g, '_')) || zip;

  folder.file("index.html", `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${project.metadata.name}</title>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    ${project.content.html}
    <script src="game.js"></script>
  </body>
</html>`);
  
  folder.file("style.css", project.content.css);
  folder.file("game.js", project.content.js);
  folder.file("gameforge_project.json", JSON.stringify(project, null, 2));

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.metadata.name.replace(/\s+/g, '_')}.zip`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportProjectToHTML = (project: SavedProject) => {
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${project.metadata.name}</title>
  <style>
    ${project.content.css}
  </style>
</head>
<body>
  ${project.content.html}
  <script>
    ${project.content.js}
  </script>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.metadata.name.replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
};

export const importProjectFromJson = async (file: File): Promise<SavedProject> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const data = JSON.parse(text);
                if (data.metadata && data.content) {
                    resolve(data as SavedProject);
                } else {
                    reject(new Error("Invalid project file format"));
                }
            } catch (err) {
                reject(err);
            }
        };
        reader.readAsText(file);
    });
};
