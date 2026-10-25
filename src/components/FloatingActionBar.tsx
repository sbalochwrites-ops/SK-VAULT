import React from 'react';
import { Download, Trash2, X, CheckSquare, Sparkles } from 'lucide-react';
import { VaultFile } from '../types';

interface FloatingActionBarProps {
  selectedFiles: VaultFile[];
  onClearSelection: () => void;
  onBulkDownload: () => void;
  onRequestBulkDelete: () => void;
  isDownloading?: boolean;
}

export const FloatingActionBar: React.FC<FloatingActionBarProps> = ({
  selectedFiles,
  onClearSelection,
  onBulkDownload,
  onRequestBulkDelete,
  isDownloading = false,
}) => {
  if (selectedFiles.length === 0) return null;

  const totalBytes = selectedFiles.reduce((acc, f) => acc + f.sizeBytes, 0);
  const formattedSize =
    totalBytes >= 1024 * 1024 * 1024
      ? `${(totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
      : `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[92vw] w-auto animate-slideUp">
      <div className="rounded-[20px] bg-[#0c1122]/95 backdrop-blur-[24px] border border-white/15 p-2 px-3 lg:px-4 shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_30px_rgba(139,92,246,0.25)] flex items-center gap-2 lg:gap-3 text-white">
        {/* Selection Count Badge */}
        <div className="flex items-center gap-2 pl-1 pr-2 border-r border-white/10">
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div className="leading-tight">
            <p className="text-[12px] font-semibold text-white whitespace-nowrap">
              {selectedFiles.length} <span className="text-white/60 font-normal">selected</span>
            </p>
            <p className="text-[10px] text-white/40 font-mono">{formattedSize}</p>
          </div>
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex items-center gap-1.5 lg:gap-2">
          {/* Download Button */}
          <button
            type="button"
            onClick={onBulkDownload}
            disabled={isDownloading}
            className="h-[36px] px-3.5 rounded-xl bg-gradient-to-r from-violet-500 to-blue-600 hover:from-violet-600 hover:to-blue-500 active:scale-[0.98] text-[12px] font-medium transition flex items-center gap-2 shadow-[0_4px_14px_rgba(124,58,237,0.35)] disabled:opacity-50"
            title="Download selected files"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">
              {isDownloading ? 'Archiving...' : `Download (${selectedFiles.length})`}
            </span>
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={onRequestBulkDelete}
            className="h-[36px] px-3.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 active:scale-[0.98] text-[12px] font-medium transition flex items-center gap-2 whitespace-nowrap"
            title="Delete selected files"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>

        {/* Clear selection button */}
        <button
          type="button"
          onClick={onClearSelection}
          className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center transition text-white/50 hover:text-white ml-1 shrink-0"
          title="Clear selection"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
