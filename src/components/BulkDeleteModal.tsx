import React from 'react';
import { VaultFile } from '../types';
import { Trash2, AlertTriangle, X, ShieldAlert, HardDrive } from 'lucide-react';

interface BulkDeleteModalProps {
  isOpen: boolean;
  selectedFiles: VaultFile[];
  onClose: () => void;
  onConfirmDelete: () => void;
}

export const BulkDeleteModal: React.FC<BulkDeleteModalProps> = ({
  isOpen,
  selectedFiles,
  onClose,
  onConfirmDelete,
}) => {
  if (!isOpen || selectedFiles.length === 0) return null;

  const totalBytesFreed = selectedFiles.reduce((acc, f) => acc + f.sizeBytes, 0);
  const formattedStorageFreed =
    totalBytesFreed >= 1024 * 1024 * 1024
      ? `${(totalBytesFreed / (1024 * 1024 * 1024)).toFixed(2)} GB`
      : `${(totalBytesFreed / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-lg rounded-[24px] bg-[#0c1122] border border-rose-500/20 shadow-[0_24px_80px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-rose-500/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-white leading-tight">Confirm Bulk Vault Deletion</h3>
              <p className="text-[12px] text-white/50 mt-0.5">Permanent cold storage removal</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center transition text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Warning Banner */}
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3.5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-[12px] leading-relaxed text-rose-200/90">
              You are about to permanently delete <strong className="text-white font-semibold">{selectedFiles.length} item{selectedFiles.length > 1 ? 's' : ''}</strong> from SK Vault. AES-256 replica nodes in all 3 geo-regions will be purged. This action cannot be undone.
            </div>
          </div>

          {/* Storage Summary Card */}
          <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4 grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-white/40">Files Selected</span>
              <p className="mt-1 text-[18px] font-bold text-white font-mono">{selectedFiles.length}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-white/40">Storage Freed</span>
              <p className="mt-1 text-[18px] font-bold text-emerald-400 font-mono flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-emerald-400/70" />
                {formattedStorageFreed}
              </p>
            </div>
          </div>

          {/* File Target List */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-white/40 mb-2">
              <span>Items to be deleted ({selectedFiles.length}):</span>
              <span>All 3 regions</span>
            </div>
            <div className="max-h-[160px] overflow-y-auto space-y-1.5 rounded-xl bg-[#070a14] p-2.5 border border-white/5">
              {selectedFiles.map((f) => (
                <div key={f.id} className="flex items-center justify-between text-[12px] p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className="truncate max-w-[280px] text-white/80 font-medium">{f.name}</span>
                  <span className="text-[11px] text-white/40 font-mono shrink-0 ml-2">{f.size}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-white/[0.02]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] text-[13px] font-medium text-white transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirmDelete}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-[0.98] text-[13px] font-medium text-white transition flex items-center gap-2 shadow-[0_4px_16px_rgba(225,29,72,0.4)]"
          >
            <Trash2 className="w-4 h-4" />
            Permanently Delete {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
};
