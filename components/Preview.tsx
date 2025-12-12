import React, { useEffect, useState } from 'react';
import { ProjectState } from '../types';

interface PreviewProps {
  projectState: ProjectState;
  refreshTrigger: number;
}

const Preview: React.FC<PreviewProps> = ({ projectState, refreshTrigger }) => {
  const [srcDoc, setSrcDoc] = useState('');

  useEffect(() => {
    // Construct the full HTML document with styles and scripts injected
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>${projectState.css}</style>
        </head>
        <body>
          ${projectState.html}
          <script>
            // Wrap in try-catch to prevent iframe crash from stopping future reloads
            try {
              ${projectState.js}
            } catch (err) {
              console.error("Game Runtime Error:", err);
              document.body.innerHTML += '<div style="color:red; background:black; padding:10px; position:fixed; top:0; left:0; width:100%;">Runtime Error: ' + err.message + '</div>';
            }
          </script>
        </body>
      </html>
    `;
    setSrcDoc(fullHtml);
  }, [projectState, refreshTrigger]); // Only update when code changes or user hits Run

  return (
    <div className="w-full h-full bg-black rounded-lg overflow-hidden border-2 border-slate-700 shadow-xl flex flex-col">
       <div className="bg-slate-800 px-3 py-1 text-xs text-slate-400 font-bold border-b border-slate-700 flex justify-between items-center">
        <span>PREVIEW OUTPUT</span>
        <span className="text-[10px] text-slate-500">Interactive Canvas</span>
      </div>
      <iframe
        title="Game Preview"
        srcDoc={srcDoc}
        className="w-full flex-1 bg-white"
        sandbox="allow-scripts allow-same-origin allow-modals" 
        style={{ border: 'none' }}
      />
    </div>
  );
};

export default Preview;
