import React from 'react';

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  language: string;
  readOnly?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, language, readOnly = false }) => {
  return (
    <div className="flex flex-col h-full w-full bg-slate-900 border border-slate-700 md:rounded-md overflow-hidden">
      <div className="bg-slate-800 px-3 py-2 md:px-4 md:py-1 text-xs text-slate-400 font-mono uppercase border-b border-slate-700 flex justify-between items-center shrink-0">
        <span>{language}</span>
        {readOnly && <span className="text-yellow-500">Read-only</span>}
      </div>
      <textarea
        className="flex-1 w-full h-full bg-[#0f172a] text-slate-200 font-mono text-xs md:text-sm p-3 md:p-4 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
        value={code}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        readOnly={readOnly}
      />
    </div>
  );
};

export default CodeEditor;