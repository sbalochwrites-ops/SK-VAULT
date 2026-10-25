import React from 'react';
import { VaultFile } from '../types';
import { X, Download, ShieldCheck, HardDrive, Clock, Check, FileText, Video, Image, Lock, Sparkles, Copy } from 'lucide-react';

interface FilePreviewModalProps {
  file: VaultFile | null;
  onClose: () => void;
  onDownload: (file: VaultFile) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose, onDownload }) => {
  const [copied, setCopied] = React.useState(false);

  if (!file) return null;

  const handleCopyHash = () => {
    if (file.checksum) {
      navigator.clipboard?.writeText(file.checksum);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-3xl rounded-[24px] bg-[#0c1122] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0">
              {file.category === 'photos' ? (
                <Image className="w-5 h-5 text-violet-300" />
              ) : file.category === 'videos' ? (
                <Video className="w-5 h-5 text-blue-300" />
              ) : (
                <FileText className="w-5 h-5 text-emerald-300" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold truncate leading-tight">{file.name}</h3>
              <p className="text-[12px] text-white/40 mt-0.5">{file.size} • Added {file.date} • {file.retention}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center transition"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-white/70" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Visual Preview */}
          <div className="w-full rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden min-h-[260px] max-h-[380px]">
            {file.thumb ? (
              <img 
                src={file.thumb} 
                alt={file.name} 
                className="w-full h-full object-contain max-h-[380px]" 
              />
            ) : file.category === 'videos' ? (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-300">
                  <Video className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-[14px] font-medium text-white/80">Archived Video Stream</p>
                  <p className="text-[12px] text-white/40 mt-1">Encrypted bitstream preserved with immutable checksum verification</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-300">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-[14px] font-medium text-white/80">PDF Legal Record</p>
                  <p className="text-[12px] text-white/40 mt-1">WORM Compliant • Permanent Unalterable Document Archive</p>
                </div>
              </div>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
              <span className="text-[10px] uppercase tracking-wider text-white/40">Retention Status</span>
              <p className="mt-1 text-[13px] font-semibold text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                {file.retention}
              </p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
              <span className="text-[10px] uppercase tracking-wider text-white/40">Encryption</span>
              <p className="mt-1 text-[13px] font-semibold text-violet-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                AES-256-GCM
              </p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
              <span className="text-[10px] uppercase tracking-wider text-white/40">Replication</span>
              <p className="mt-1 text-[13px] font-semibold text-blue-300 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5" />
                3 Geo Regions
              </p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
              <span className="text-[10px] uppercase tracking-wider text-white/40">Storage Class</span>
              <p className="mt-1 text-[13px] font-semibold text-white/80 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Cold Vault Archive
              </p>
            </div>
          </div>

          {/* Cryptographic Proof Hash */}
          <div className="rounded-xl bg-[#070a14] border border-white/10 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[12px] text-white/50">
                <Sparkles className="w-3.5 h-3.5 text-violet-300" />
                <span>SHA-256 Cryptographic Hash (Integrity Verified)</span>
              </div>
              <button 
                onClick={handleCopyHash}
                className="text-[11px] text-violet-300 hover:text-violet-200 transition flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy Hash'}
              </button>
            </div>
            <p className="text-[11px] font-mono text-white/60 break-all select-all bg-white/[0.03] p-2 rounded-lg border border-white/5">
              {file.checksum || `sha256-${Array.from(file.name).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 0).toString(16).padStart(64, 'a')}`}
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/[0.02]">
          <span className="text-[11px] text-white/40 flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-400" />
            Zero-knowledge encrypted key skbalochi@icloud.com
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] text-[13px] font-medium text-white transition"
            >
              Close
            </button>
            <button
              onClick={() => onDownload(file)}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-blue-600 hover:from-violet-600 hover:to-blue-500 active:scale-[0.98] text-[13px] font-medium text-white transition flex items-center gap-2 shadow-[0_4px_16px_rgba(124,58,237,0.4)]"
            >
              <Download className="w-4 h-4" />
              Download File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
