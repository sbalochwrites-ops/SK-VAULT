import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Check, 
  Clock, 
  CloudUpload, 
  Cloud, 
  Download, 
  Ellipsis, 
  Eye, 
  FileText, 
  Files, 
  Fingerprint, 
  Grid3x3, 
  HardDrive, 
  Image, 
  List, 
  Lock, 
  LogOut, 
  Search, 
  ShieldCheck, 
  Sparkles, 
  Video, 
  Zap,
  CheckSquare,
  Square,
  MinusSquare,
  Trash2,
  Globe2,
  Database
} from 'lucide-react';
import { INITIAL_FILES } from './data/initialFiles';
import { VaultFile, FileCategory, RetentionColor, UploadingItem } from './types';
import { FilePreviewModal } from './components/FilePreviewModal';
import { StorageDoughnutChart } from './components/StorageDoughnutChart';
import { FloatingActionBar } from './components/FloatingActionBar';
import { BulkDeleteModal } from './components/BulkDeleteModal';
import { GoogleWorkspaceModal } from './components/GoogleWorkspaceModal';
import { VaultMapModal } from './components/VaultMapModal';
import { 
  subscribeToVaultFiles, 
  saveVaultFile, 
  deleteVaultFileFromFirestore, 
  deleteBatchVaultFilesFromFirestore 
} from './services/firestoreService';

const RETENTION_CLASSES: Record<RetentionColor, string> = {
  forever: "bg-[#a5f26b]/15 text-[#a5f26b] border-[#a5f26b]/20",
  long: "bg-[#8b5cf6]/15 text-[#a78bfa] border-[#8b5cf6]/20",
  medium: "bg-[#38bdf8]/15 text-[#7dd3fc] border-[#38bdf8]/20",
  short: "bg-[#f59e0b]/15 text-[#fcd34d] border-[#f59e0b]/20",
};

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("skbalochi@icloud.com");
  const [passphrase, setPassphrase] = useState<string>("vault-secure-2048");
  const [showPassphrase, setShowPassphrase] = useState<boolean>(false);

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>("date");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>("grid");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadQueue, setUploadQueue] = useState<UploadingItem[]>([]);
  const [files, setFiles] = useState<VaultFile[]>(INITIAL_FILES);
  
  // Selection state
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDownloadingBulk, setIsDownloadingBulk] = useState<boolean>(false);
  const [previewFile, setPreviewFile] = useState<VaultFile | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals & Integration state
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState<boolean>(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState<boolean>(false);
  const [firestoreStatus, setFirestoreStatus] = useState<'syncing' | 'synced' | 'local'>('syncing');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.style.background = "#070a14";

    // Real-time Firestore sync
    const unsubscribe = subscribeToVaultFiles(
      (loadedFiles) => {
        if (loadedFiles && loadedFiles.length > 0) {
          setFiles(loadedFiles);
        }
        setFirestoreStatus('synced');
      },
      (err) => {
        console.warn('Using local fallback for vault files:', err);
        setFirestoreStatus('local');
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Filtered and sorted files
  const filteredFiles = useMemo(() => {
    let result = [...files];
    if (activeCategory !== "all") {
      result = result.filter((file) => file.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((file) => file.name.toLowerCase().includes(q));
    }
    if (sortBy === "date") {
      result.sort((a, b) => b.timestamp - a.timestamp);
    } else if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "size") {
      result.sort((a, b) => b.sizeBytes - a.sizeBytes);
    }
    return result;
  }, [files, activeCategory, searchQuery, sortBy]);

  // Selected file objects
  const selectedFiles = useMemo(() => {
    return files.filter((f) => selectedFileIds.has(f.id));
  }, [files, selectedFileIds]);

  // Check if all filtered files are selected
  const isAllFilteredSelected = useMemo(() => {
    if (filteredFiles.length === 0) return false;
    return filteredFiles.every((f) => selectedFileIds.has(f.id));
  }, [filteredFiles, selectedFileIds]);

  const hasPartialFilteredSelection = useMemo(() => {
    if (filteredFiles.length === 0) return false;
    const someSelected = filteredFiles.some((f) => selectedFileIds.has(f.id));
    return someSelected && !isAllFilteredSelected;
  }, [filteredFiles, selectedFileIds, isAllFilteredSelected]);

  // Dynamic counts and storage usage
  const counts = useMemo(() => {
    const totalBytes = files.reduce((acc, f) => acc + f.sizeBytes, 0);
    const gbUsed = (totalBytes / (1024 * 1024 * 1024)).toFixed(1);
    const capacityGb = 100;
    const percentUsed = ((Number(gbUsed) / capacityGb) * 100).toFixed(1);

    return {
      all: files.length,
      photos: files.filter((f) => f.category === "photos").length,
      videos: files.filter((f) => f.category === "videos").length,
      docs: files.filter((f) => f.category === "documents").length,
      gbUsed,
      percentUsed,
      availableGb: (capacityGb - Number(gbUsed)).toFixed(1),
    };
  }, [files]);

  // Toggle single file selection
  const toggleFileSelection = (fileId: string) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  // Toggle select all filtered files
  const toggleSelectAllFiltered = () => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (isAllFilteredSelected) {
        // Deselect all currently filtered
        filteredFiles.forEach((f) => next.delete(f.id));
      } else {
        // Select all currently filtered
        filteredFiles.forEach((f) => next.add(f.id));
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedFileIds(new Set());
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Bulk download handler
  const handleBulkDownload = () => {
    if (selectedFiles.length === 0) return;
    setIsDownloadingBulk(true);

    selectedFiles.forEach((file, index) => {
      setTimeout(() => {
        const dummyContent = `SK-VAULT PRESERVED OBJECT\n\nName: ${file.name}\nSize: ${file.size}\nRetention: ${file.retention}\nEncryption: AES-256-GCM\nDate: ${file.date}\nChecksum: ${file.checksum || 'sha256-verified'}\nReplication: 3-Region Active\nOwner: skbalochi@icloud.com\n`;
        const blob = new Blob([dummyContent], { type: file.mimeType || 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (index === selectedFiles.length - 1) {
          setIsDownloadingBulk(false);
          showToast(`Downloaded ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`);
        }
      }, index * 200);
    });
  };

  // Bulk delete execution
  const handleConfirmBulkDelete = () => {
    const count = selectedFiles.length;
    const idsToDelete = Array.from(selectedFileIds);
    setFiles((prev) => prev.filter((f) => !selectedFileIds.has(f.id)));
    clearSelection();
    setIsDeleteModalOpen(false);
    deleteBatchVaultFilesFromFirestore(idsToDelete).catch((err) => {
      console.warn('Firestore delete error, handled gracefully:', err);
    });
    showToast(`Permanently deleted ${count} item${count > 1 ? 's' : ''} from vault`);
  };

  // Google Workspace file import
  const handleImportWorkspaceFile = (newFile: VaultFile) => {
    setFiles((prev) => [newFile, ...prev]);
    saveVaultFile(newFile).catch((err) => {
      console.warn('Firestore save error, handled gracefully:', err);
    });
    showToast(`Preserved "${newFile.name}" to SK Vault`);
  };

  // Handle uploading files with realistic progress simulation and adding to vault
  const handleUpload = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const newUploads: UploadingItem[] = Array.from(fileList).map((file, idx) => ({
      id: `${Date.now()}-${idx}-${file.name}`,
      name: file.name,
      progress: 0,
      status: 'encrypting'
    }));

    setUploadQueue((prev) => [...prev, ...newUploads]);

    Array.from(fileList).forEach((file, idx) => {
      const uploadId = newUploads[idx].id;
      let currentProgress = 0;
      
      const interval = setInterval(() => {
        currentProgress += Math.random() * 18 + 4;
        
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
          
          let category: FileCategory = 'documents';
          let iconType: 'photo' | 'video' | 'doc' = 'doc';
          if (file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name)) {
            category = 'photos';
            iconType = 'photo';
          } else if (file.type.startsWith('video/') || /\.(mp4|mov|mkv|webm|avi)$/i.test(file.name)) {
            category = 'videos';
            iconType = 'video';
          }

          let sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
          if (file.size > 1024 * 1024 * 1024) {
            sizeStr = `${(file.size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
          } else if (file.size < 1024 * 1024) {
            sizeStr = `${Math.max(1, Math.round(file.size / 1024))} KB`;
          }

          let thumbUrl: string | null = null;
          if (category === 'photos') {
            try {
              thumbUrl = URL.createObjectURL(file);
            } catch {
              thumbUrl = null;
            }
          }

          const newVaultFile: VaultFile = {
            id: `vault-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            size: sizeStr,
            sizeBytes: file.size || 15000000,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
            timestamp: Date.now(),
            category,
            retention: 'Kept Forever',
            retentionColor: 'forever',
            thumb: thumbUrl,
            icon: iconType,
            checksum: `sha256-${Array.from(file.name).reduce((acc, c) => (acc * 33 + c.charCodeAt(0)) >>> 0, 5381).toString(16).padStart(64, 'e')}`,
            mimeType: file.type || 'application/octet-stream'
          };

          setFiles((prev) => [newVaultFile, ...prev]);
          saveVaultFile(newVaultFile).catch((err) => {
            console.warn('Firestore upload persistence notice:', err);
          });

          setTimeout(() => {
            setUploadQueue((prev) => prev.filter((item) => item.id !== uploadId));
          }, 800);
        }

        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === uploadId
              ? {
                  ...item,
                  progress: Math.min(100, Math.round(currentProgress)),
                  status: currentProgress < 40 ? 'encrypting' : currentProgress < 80 ? 'uploading' : 'replicating'
                }
              : item
          )
        );
      }, 160);
    });
  };

  // Single file download
  const handleDownload = (file: VaultFile) => {
    const dummyContent = `SK-VAULT PRESERVED OBJECT\n\nName: ${file.name}\nSize: ${file.size}\nRetention: ${file.retention}\nEncryption: AES-256-GCM\nDate: ${file.date}\nChecksum: ${file.checksum || 'sha256-verified'}\nReplication: 3-Region Active\nOwner: skbalochi@icloud.com\n`;
    const blob = new Blob([dummyContent], { type: file.mimeType || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${file.name}`);
  };

  // Screen 1: Vault Unlock Screen
  if (!isUnlocked) {
    return (
      <div className="min-h-screen w-full bg-[#070a14] text-white flex flex-col lg:flex-row overflow-hidden relative selection:bg-violet-500/30">
        {/* Ambient atmospheric gradients */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-gradient-to-br from-violet-600/30 via-blue-600/20 to-transparent rounded-full blur-[90px]" />
          <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-gradient-to-tl from-blue-500/25 via-cyan-500/15 to-transparent rounded-full blur-[80px]" />
          <div className="absolute top-[40%] left-[35%] w-[30%] h-[30%] bg-violet-500/10 rounded-full blur-[60px]" />
        </div>

        {/* Left Hero Section */}
        <div className="relative z-10 flex-1 flex flex-col justify-between p-8 lg:p-12 lg:pr-0">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.4)]">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold tracking-tight leading-none">SK VAULT</p>
                <p className="text-[10px] tracking-[0.2em] text-white/50 font-medium mt-0.5">LONG TERM STORAGE</p>
              </div>
              <div className="ml-3 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[10px] tracking-widest font-medium">
                PROTOTYPE
              </div>
            </div>

            <div className="mt-16 lg:mt-24 max-w-[520px]">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[11px] tracking-wide">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-violet-200">AES-256 Encrypted • Zero-Knowledge • Kept Forever</span>
              </div>
              <h1 className="mt-6 text-[42px] lg:text-[56px] font-[700] leading-[0.95] tracking-[-0.03em]">
                Your life,
                <br />
                <span className="bg-gradient-to-r from-violet-300 via-blue-300 to-cyan-200 bg-clip-text text-transparent">
                  preserved forever.
                </span>
              </h1>
              <p className="mt-5 text-[15px] leading-[1.6] text-white/55 max-w-[44ch]">
                SK Vault is the cold-storage repository for photos, videos, and critical documents. Designed for decades, not days. Built for skbalochi.
              </p>

              <div className="mt-8 grid grid-cols-3 gap-3 max-w-[440px]">
                {[
                  { k: "Retention", v: "Forever" },
                  { k: "Encryption", v: "AES-256-GCM" },
                  { k: "Backups", v: "3 Regions" }
                ].map((item) => (
                  <div key={item.k} className="rounded-2xl bg-white/[0.04] border border-white/[0.07] backdrop-blur-xl p-3.5">
                    <p className="text-[10px] tracking-widest text-white/40 uppercase">{item.k}</p>
                    <p className="mt-1 text-[13px] font-semibold">{item.v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-6 text-[11px] text-white/30">
            <span>© 2025 SKBALOCHI1-ICLOUD-COM</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>Repository: skbalochi</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="flex items-center gap-1.5">
              <Lock className="w-3 h-3" /> Locked Vault
            </span>
          </div>
        </div>

        {/* Right Unlock Form */}
        <div className="relative z-10 flex-1 flex items-center justify-center p-5 lg:p-12">
          <div className="w-full max-w-[420px]">
            <div className="rounded-[28px] bg-gradient-to-b from-white/[0.09] to-white/[0.03] border border-white/[0.10] backdrop-blur-[24px] shadow-[0_20px_80px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] overflow-hidden">
              <div className="p-8 pb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-[22px] font-semibold tracking-tight">Secure Long Storage</h2>
                    <p className="mt-1.5 text-[13px] text-white/50 leading-[1.5]">
                      Enter vault credentials to unlock your permanent archive.
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center">
                    <Fingerprint className="w-4 h-4 text-violet-300" />
                  </div>
                </div>

                <div className="mt-7 space-y-4">
                  <div>
                    <label className="text-[11px] tracking-widest uppercase text-white/40 font-medium">
                      Vault ID / Email
                    </label>
                    <div className="mt-2 relative group">
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-[48px] rounded-xl bg-[#0d1223] border border-white/10 px-4 text-[14px] outline-none focus:border-violet-500/50 focus:ring-[4px] focus:ring-violet-500/10 transition-all placeholder:text-white/20"
                        placeholder="you@icloud.com"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] tracking-widest uppercase text-white/40 font-medium">
                        Passphrase
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassphrase(!showPassphrase)}
                        className="text-[11px] text-violet-300 hover:text-violet-200 transition"
                      >
                        {showPassphrase ? "Hide" : "Show"}
                      </button>
                    </div>
                    <div className="mt-2 relative">
                      <input
                        type={showPassphrase ? "text" : "password"}
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        className="w-full h-[48px] rounded-xl bg-[#0d1223] border border-white/10 px-4 pr-12 text-[14px] outline-none focus:border-violet-500/50 focus:ring-[4px] focus:ring-violet-500/10 transition placeholder:text-white/20"
                        placeholder="••••••••••••"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center pointer-events-none">
                        <Lock className="w-3.5 h-3.5 text-white/40" />
                      </div>
                    </div>
                  </div>

                  <p className="mt-2 text-[11px] text-white/35 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-violet-300" />
                    Demo login — no real auth, local prototype
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsUnlocked(true)}
                  className="mt-6 w-full h-[50px] rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 hover:from-violet-500 hover:to-blue-500 active:scale-[0.98] transition-all font-medium text-[14px] tracking-wide shadow-[0_10px_30px_rgba(124,58,237,0.35)] flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Unlock Vault
                  <div className="ml-1 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                    ↗
                  </div>
                </button>

                <div className="grid grid-cols-2 gap-2.5 pt-5">
                  <div className="rounded-xl bg-white/[0.04] border border-white/5 p-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center">
                      <Check className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="leading-tight">
                      <p className="text-[11px] text-white/60">End-to-end</p>
                      <p className="text-[12px] font-medium">Encrypted</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] border border-white/5 p-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center">
                      <Cloud className="w-4 h-4 text-blue-300" />
                    </div>
                    <div className="leading-tight">
                      <p className="text-[11px] text-white/60">Last backup</p>
                      <p className="text-[12px] font-medium">2 min ago</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-8 py-4 bg-[#080b18]/60 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] text-white/40">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                  <span>Vault node: us-west-1 • eu-central-1 • ap-se-1</span>
                </div>
                <div className="text-[10px] tracking-widest text-white/20">
                  SK VAULT v1.0
                </div>
              </div>
            </div>

            <p className="mt-4 text-center text-[11px] text-white/25 lg:hidden">
              © 2025 SKBALOCHI1-ICLOUD-COM • skbalochi repo
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Screen 2: Authenticated Vault Storage Dashboard
  return (
    <div className="min-h-screen bg-[#070a14] text-white antialiased selection:bg-violet-500/30">
      {/* Background radial atmosphere */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(124,58,237,0.18),transparent),radial-gradient(800px_400px_at_80%_0%,rgba(59,130,246,0.14),transparent)]" />
      </div>

      <div className="relative flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-[300px] shrink-0 flex-col sticky top-0 h-screen p-4 pr-0">
          <div className="flex-1 rounded-[22px] bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/[0.08] backdrop-blur-xl overflow-hidden flex flex-col shadow-[0_16px_60px_rgba(0,0,0,0.4)]">
            {/* Logo and Storage Overview with Recharts Doughnut */}
            <div className="p-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.35)]">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold leading-none">SK VAULT</p>
                  <p className="text-[10px] tracking-widest text-white/40 mt-1">LONG TERM STORAGE</p>
                </div>
              </div>

              {/* Storage breakdown card with Recharts Doughnut */}
              <div className="mt-5 rounded-2xl bg-[#0c1122] border border-white/5 p-3.5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] tracking-widest uppercase text-white/40">Storage Breakdown</p>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                    Healthy
                  </span>
                </div>

                {/* Interactive Doughnut Chart */}
                <StorageDoughnutChart files={files} capacityGb={100} />

                <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-white/35">
                  <span className="flex items-center gap-1.5">
                    <HardDrive className="w-3 h-3" /> {counts.availableGb} GB free
                  </span>
                  <span>100 GB Total</span>
                </div>
              </div>
            </div>

            {/* Navigation Categories */}
            <nav className="p-3 space-y-1 overflow-auto">
              {[
                { id: "all", label: "All Files", icon: Files, count: counts.all },
                { id: "photos", label: "Photos", icon: Image, count: counts.photos },
                { id: "videos", label: "Videos", icon: Video, count: counts.videos },
                { id: "documents", label: "Documents", icon: FileText, count: counts.docs },
              ].map((item) => {
                const isSelected = activeCategory === item.id;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveCategory(item.id)}
                    className={`w-full flex items-center justify-between rounded-xl px-3.5 py-3 text-[13px] transition ${
                      isSelected
                        ? "bg-white/[0.07] border border-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                        : "text-white/50 hover:text-white/80 hover:bg-white/[0.03] border border-transparent"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <IconComponent className={`w-4 h-4 ${isSelected ? "text-violet-300" : "text-white/40"}`} />
                      {item.label}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${isSelected ? "bg-white/10 text-white/70" : "bg-white/[0.06] text-white/30"}`}>
                      {item.count}
                    </span>
                  </button>
                );
              })}

              <div className="pt-4 mt-2 border-t border-white/5 space-y-1">
                <p className="px-3.5 text-[10px] tracking-widest uppercase text-white/25 mb-2">Integrations & Cloud</p>
                <div className="space-y-1.5 mb-3">
                  <button
                    onClick={() => setIsWorkspaceModalOpen(true)}
                    className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/25 text-blue-300 text-xs font-medium transition"
                  >
                    <span className="flex items-center gap-2">
                      <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                      Google Workspace
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-200">11 APIs</span>
                  </button>

                  <button
                    onClick={() => setIsMapModalOpen(true)}
                    className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/25 text-purple-300 text-xs font-medium transition"
                  >
                    <span className="flex items-center gap-2">
                      <Globe2 className="w-3.5 h-3.5 text-purple-400" />
                      Global Topology Map
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-200">5 Nodes</span>
                  </button>
                </div>

                <p className="px-3.5 text-[10px] tracking-widest uppercase text-white/25 mb-2">Vault & Cloud Status</p>
                <div className="rounded-xl bg-[#0c1122] border border-white/5 p-3 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-2 text-white/60">
                      <Lock className="w-3.5 h-3.5 text-violet-400" /> AES-256 GCM
                    </span>
                    <span className="text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Sealed
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-2 text-white/60">
                      <Database className="w-3.5 h-3.5 text-amber-400" /> Firestore DB
                    </span>
                    <span className={`text-[10px] font-medium flex items-center gap-1 ${firestoreStatus === 'synced' ? 'text-emerald-300' : 'text-amber-300'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${firestoreStatus === 'synced' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                      {firestoreStatus === 'synced' ? 'Realtime' : 'Local Fallback'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-2 text-white/60">
                      <Globe2 className="w-3.5 h-3.5 text-sky-400" /> Cloud SQL Region
                    </span>
                    <span className="text-white/60 text-[10px] font-mono">asia-se1</span>
                  </div>
                </div>
              </div>
            </nav>

            {/* Profile / Logout */}
            <div className="mt-auto p-3 border-t border-white/5">
              <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/5 px-3 py-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-[11px] font-bold">
                  SK
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium truncate">{email}</p>
                  <p className="text-[10px] text-white/40">Owner • skbalochi</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUnlocked(false)}
                  title="Lock Vault"
                  className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.10] flex items-center justify-center transition"
                >
                  <LogOut className="w-3.5 h-3.5 text-white/60" />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {/* Top Bar Header */}
          <div className="sticky top-0 z-20 backdrop-blur-[18px] bg-[#070a14]/70 border-b border-white/5">
            <div className="px-4 lg:px-8 py-4 flex items-center gap-3">
              <div className="flex-1 flex items-center gap-3 min-w-0">
                <div className="hidden lg:flex items-center gap-2 text-[11px]">
                  <span className="px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-white/50">
                    Repository: skbalochi
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Vault
                  </span>
                </div>
                <div className="flex-1 lg:max-w-[420px] relative ml-auto lg:ml-6">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search files, IMG_, VID_, PDFs…"
                    className="w-full h-[40px] rounded-full bg-white/[0.06] border border-white/10 pl-10 pr-4 text-[13px] outline-none focus:border-violet-500/30 focus:bg-white/[0.08] placeholder:text-white/25 transition"
                  />
                </div>
              </div>

              {/* Desktop Filters: Sort & View Mode */}
              <div className="hidden lg:flex items-center gap-2">
                <div className="h-[36px] rounded-full bg-white/[0.06] border border-white/10 flex p-1">
                  {(['date', 'name', 'size'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setSortBy(mode)}
                      className={`px-3 rounded-full text-[12px] capitalize transition ${
                        sortBy === mode
                          ? "bg-white text-black font-medium"
                          : "text-white/50 hover:text-white/80"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <div className="h-[36px] rounded-full bg-white/[0.06] border border-white/10 flex p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`w-8 h-7 rounded-full flex items-center justify-center transition ${
                      viewMode === "grid" ? "bg-white text-black" : "text-white/50"
                    }`}
                    title="Grid view"
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`w-8 h-7 rounded-full flex items-center justify-center transition ${
                      viewMode === "list" ? "bg-white text-black" : "text-white/50"
                    }`}
                    title="List view"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                <div className="w-px h-5 bg-white/10 mx-1" />

                <button
                  onClick={() => setIsWorkspaceModalOpen(true)}
                  className="h-[36px] px-3.5 rounded-full bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 text-[12px] font-medium flex items-center gap-1.5 transition shadow-sm"
                  title="Google Workspace & Drive"
                >
                  <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                  <span>Google Workspace</span>
                </button>

                <button
                  onClick={() => setIsMapModalOpen(true)}
                  className="h-[36px] px-3.5 rounded-full bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-300 text-[12px] font-medium flex items-center gap-1.5 transition shadow-sm"
                  title="Global Replication & Geotags"
                >
                  <Globe2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Storage Map</span>
                </button>
              </div>
            </div>
          </div>

          {/* Dashboard Body */}
          <div className="px-4 lg:px-8 py-6 space-y-6 pb-[120px] lg:pb-12">
            {/* Top Stat Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "All Files", value: `${counts.all} files`, sub: `${counts.gbUsed} GB used`, icon: Files, grad: "from-violet-500 to-blue-600" },
                { label: "Photos", value: `${counts.photos} photos`, sub: "Kept forever • 58 MB", icon: Image, grad: "from-fuchsia-500 to-violet-500" },
                { label: "Videos", value: `${counts.videos} videos`, sub: "4.4 GB • 25yr avg", icon: Video, grad: "from-blue-500 to-cyan-500" },
                { label: "Documents", value: `${counts.docs} docs`, sub: "Legal • Forever", icon: FileText, grad: "from-emerald-500 to-teal-500" },
              ].map((item) => {
                const IconComp = item.icon;
                return (
                  <div 
                    key={item.label}
                    className="rounded-[18px] bg-gradient-to-b from-white/[0.07] to-white/[0.03] border border-white/[0.08] backdrop-blur-xl p-4 relative overflow-hidden group"
                  >
                    <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full bg-gradient-to-br ${item.grad} opacity-20 blur-[12px] group-hover:opacity-30 transition`} />
                    <div className="flex items-start justify-between">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.grad} flex items-center justify-center shadow-[0_6px_20px_rgba(0,0,0,0.3)]`}>
                        <IconComp className="w-4 h-4 text-white" />
                      </div>
                      <Ellipsis className="w-4 h-4 text-white/20" />
                    </div>
                    <p className="mt-3 text-[11px] tracking-widest uppercase text-white/40">{item.label}</p>
                    <p className="mt-1 text-[15px] font-semibold tracking-tight">{item.value}</p>
                    <p className="mt-1 text-[11px] text-white/45">{item.sub}</p>
                  </div>
                );
              })}
            </div>

            {/* Dropzone & Vault Sealed Status Row */}
            <div className="grid lg:grid-cols-[1.4fr_0.6fr] gap-3">
              {/* Dropzone Container */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleUpload(e.dataTransfer.files);
                }}
                className={`rounded-[20px] border backdrop-blur-xl p-4 lg:p-5 transition-all ${
                  isDragging
                    ? "bg-violet-500/10 border-violet-400/40 shadow-[0_0_40px_rgba(139,92,246,0.25)]"
                    : "bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.06]"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-[0_10px_30px_rgba(124,58,237,0.3)] shrink-0">
                      <CloudUpload className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold">Drop files for permanent storage</p>
                      <p className="text-[12px] text-white/45 mt-0.5">
                        Photos, videos, documents • Encrypted at rest • Retention lock optional
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleUpload(e.target.files)}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-[40px] px-5 rounded-full bg-white text-black text-[13px] font-medium hover:bg-white/90 active:scale-[0.98] transition flex items-center gap-2 shrink-0"
                    >
                      <CloudUpload className="w-4 h-4" /> Select files
                    </button>
                    <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-white/30 px-3 py-2 rounded-full bg-white/[0.05] border border-white/10">
                      <Lock className="w-3 h-3" /> AES-256 • 3× replicated
                    </div>
                  </div>
                </div>

                {/* Upload Queue Indicator */}
                {uploadQueue.length > 0 && (
                  <div className="mt-4 grid gap-2">
                    {uploadQueue.map((item) => (
                      <div key={item.id} className="rounded-xl bg-[#0d1223] border border-white/10 p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0">
                          <CloudUpload className="w-4 h-4 text-violet-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between text-[12px]">
                            <p className="truncate font-medium">{item.name}</p>
                            <span className="text-[11px] text-violet-300 font-mono">{item.progress}%</span>
                          </div>
                          <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-200"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-white/40 mt-1">
                            <span className="capitalize">{item.status || 'encrypting'}</span>
                            <span>AES-256-GCM chunking</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vault Sealed Badge Box */}
              <div className="rounded-[20px] bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-500 p-[1px] shadow-[0_12px_40px_rgba(124,58,237,0.25)]">
                <div className="rounded-[19px] bg-[#0d1122] p-4 h-full flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4 text-emerald-300" />
                      </div>
                      <p className="text-[12px] font-semibold">Vault Sealed</p>
                    </div>
                    <span className="text-[10px] tracking-widest px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 font-medium">
                      LOCKED • 256-BIT
                    </span>
                  </div>

                  <div className="mt-4 space-y-2.5 text-[11px]">
                    <div className="flex justify-between text-white/50">
                      <span>Last backup</span>
                      <span className="text-white">2 min ago • us-west-1</span>
                    </div>
                    <div className="flex justify-between text-white/50">
                      <span>Integrity check</span>
                      <span className="text-emerald-300 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Passed
                      </span>
                    </div>
                    <div className="flex justify-between text-white/50">
                      <span>Retention policy</span>
                      <span className="text-white">WORM + Legal Hold</span>
                    </div>
                  </div>

                  <div className="mt-4 h-px bg-white/10" />
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-white/40">
                    <Eye className="w-3.5 h-3.5" /> Zero-knowledge • Only you hold the key
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Tabs & Header Toolbar with Select All */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/[0.05] border border-white/10">
                  {[
                    { id: "all", label: "All Files" },
                    { id: "photos", label: "Photos" },
                    { id: "videos", label: "Videos" },
                    { id: "documents", label: "Documents" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-4 h-[32px] rounded-full text-[12px] font-medium transition ${
                        activeCategory === cat.id
                          ? "bg-white text-black shadow"
                          : "text-white/50 hover:text-white/80"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <span className="text-[12px] text-white/35 px-2">
                  {filteredFiles.length} items • {activeCategory === "all" ? "Permanent archive" : `${activeCategory} archive`}
                </span>
              </div>

              {/* Selection & Toolbar controls */}
              <div className="flex items-center gap-2">
                {/* Select All / Deselect All Button */}
                {filteredFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleSelectAllFiltered}
                    className={`h-[32px] px-3 rounded-full text-[12px] font-medium transition flex items-center gap-1.5 border ${
                      isAllFilteredSelected
                        ? "bg-violet-500/20 text-violet-200 border-violet-500/30"
                        : "bg-white/[0.05] text-white/70 hover:text-white border-white/10"
                    }`}
                  >
                    {isAllFilteredSelected ? (
                      <>
                        <CheckSquare className="w-3.5 h-3.5 text-violet-300" />
                        <span>Deselect All</span>
                      </>
                    ) : hasPartialFilteredSelection ? (
                      <>
                        <MinusSquare className="w-3.5 h-3.5 text-violet-300" />
                        <span>Select All ({filteredFiles.length})</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-3.5 h-3.5 text-white/40" />
                        <span>Select All</span>
                      </>
                    )}
                  </button>
                )}

                {/* Mobile View Mode switch */}
                <div className="lg:hidden flex items-center gap-1.5 p-1 rounded-full bg-white/[0.05] border border-white/10">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`w-8 h-7 rounded-full flex items-center justify-center ${viewMode === "grid" ? "bg-white text-black" : "text-white/50"}`}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`w-8 h-7 rounded-full flex items-center justify-center ${viewMode === "list" ? "bg-white text-black" : "text-white/50"}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Files Rendering: Grid vs List */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredFiles.map((file) => {
                  const isSelected = selectedFileIds.has(file.id);

                  return (
                    <div
                      key={file.id}
                      onClick={() => setPreviewFile(file)}
                      className={`group rounded-[18px] backdrop-blur-xl overflow-hidden transition-all cursor-pointer relative ${
                        isSelected
                          ? "bg-violet-600/[0.12] border-2 border-violet-500 shadow-[0_0_25px_rgba(139,92,246,0.25)]"
                          : "bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/[0.08] hover:border-white/[0.14] hover:bg-white/[0.07]"
                      }`}
                    >
                      <div className="relative aspect-[16/10] bg-[#0c1122] overflow-hidden">
                        {file.thumb ? (
                          <img
                            src={file.thumb}
                            alt={file.name}
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-700"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[radial-gradient(400px_200px_at_30%_20%,rgba(139,92,246,0.18),transparent)]">
                            <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center">
                              {file.category === 'videos' ? (
                                <Video className="w-6 h-6 text-white/70" />
                              ) : (
                                <FileText className="w-6 h-6 text-white/70" />
                              )}
                            </div>
                          </div>
                        )}

                        {/* Top-Left: Checkbox & Retention Badge */}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-2 z-10">
                          {/* Selection Checkbox */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFileSelection(file.id);
                            }}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                              isSelected
                                ? "bg-violet-600 text-white shadow-[0_0_10px_rgba(139,92,246,0.5)] border border-violet-400"
                                : "bg-black/50 backdrop-blur-md border border-white/20 text-transparent opacity-80 group-hover:opacity-100 hover:border-white/40"
                            }`}
                            title={isSelected ? "Deselect" : "Select file"}
                          >
                            <Check className={`w-3.5 h-3.5 ${isSelected ? 'opacity-100 stroke-[3]' : 'opacity-0'}`} />
                          </button>

                          {/* Retention Badge */}
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wide border backdrop-blur-md ${RETENTION_CLASSES[file.retentionColor]}`}>
                            {file.retention}
                          </span>
                        </div>

                        {/* Top-Right: Quick Action Overlay Buttons */}
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewFile(file);
                            }}
                            title="Preview"
                            className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-black/60"
                          >
                            <Eye className="w-3.5 h-3.5 text-white/80" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(file);
                            }}
                            title="Download"
                            className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-black/60"
                          >
                            <Download className="w-3.5 h-3.5 text-white/80" />
                          </button>
                        </div>

                        <div className="absolute bottom-0 inset-x-0 h-[50%] bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

                        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between">
                          <span className="text-[11px] px-2 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/15 text-white/90 flex items-center gap-1">
                            {file.category === "photos" ? (
                              <Image className="w-3 h-3" />
                            ) : file.category === "videos" ? (
                              <Video className="w-3 h-3" />
                            ) : (
                              <FileText className="w-3 h-3" />
                            )}
                            {file.category}
                          </span>
                          <span className="text-[11px] px-2 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white/70">
                            {file.size}
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5">
                        <p className="text-[13px] font-medium leading-[1.3] truncate" title={file.name}>
                          {file.name}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-white/40">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {file.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Encrypted
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* List Table View with Selection Column */
              <div className="rounded-[18px] bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl overflow-hidden divide-y divide-white/5">
                <div className="hidden lg:grid grid-cols-[auto_1.6fr_0.5fr_0.6fr_0.5fr_0.3fr] gap-4 px-5 py-3 text-[10px] tracking-widest uppercase text-white/30 items-center">
                  <div className="w-6 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={toggleSelectAllFiltered}
                      className="w-5 h-5 rounded-md border border-white/20 bg-white/[0.05] hover:border-white/40 flex items-center justify-center transition"
                      title={isAllFilteredSelected ? "Deselect all" : "Select all"}
                    >
                      {isAllFilteredSelected ? (
                        <Check className="w-3.5 h-3.5 text-violet-400 stroke-[3]" />
                      ) : hasPartialFilteredSelection ? (
                        <div className="w-2.5 h-0.5 bg-violet-400 rounded-sm" />
                      ) : null}
                    </button>
                  </div>
                  <span>Name</span>
                  <span>Retention</span>
                  <span>Date Added</span>
                  <span>Size</span>
                  <span className="text-right">Actions</span>
                </div>

                {filteredFiles.map((file) => {
                  const isSelected = selectedFileIds.has(file.id);

                  return (
                    <div
                      key={file.id}
                      onClick={() => setPreviewFile(file)}
                      className={`grid grid-cols-[auto_1fr_auto] lg:grid-cols-[auto_1.6fr_0.5fr_0.6fr_0.5fr_0.3fr] gap-3 lg:gap-4 px-4 lg:px-5 py-3.5 items-center transition group cursor-pointer ${
                        isSelected
                          ? "bg-violet-600/[0.12] hover:bg-violet-600/[0.16]"
                          : "hover:bg-white/[0.03]"
                      }`}
                    >
                      {/* Checkbox column */}
                      <div className="w-6 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFileSelection(file.id);
                          }}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition ${
                            isSelected
                              ? "bg-violet-600 text-white border border-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                              : "border border-white/20 bg-white/[0.05] hover:border-white/40 text-transparent"
                          }`}
                          title={isSelected ? "Deselect" : "Select"}
                        >
                          <Check className={`w-3.5 h-3.5 ${isSelected ? 'opacity-100 stroke-[3]' : 'opacity-0'}`} />
                        </button>
                      </div>

                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                          {file.thumb ? (
                            <img src={file.thumb} className="w-full h-full object-cover" alt="" />
                          ) : file.category === "photos" ? (
                            <Image className="w-5 h-5 text-violet-300" />
                          ) : file.category === "videos" ? (
                            <Video className="w-5 h-5 text-blue-300" />
                          ) : (
                            <FileText className="w-5 h-5 text-emerald-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium truncate">{file.name}</p>
                          <p className="text-[11px] text-white/40 lg:hidden mt-0.5">
                            {file.size} • {file.date} • {file.retention}
                          </p>
                        </div>
                      </div>

                      <div className="hidden lg:block">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] border ${RETENTION_CLASSES[file.retentionColor]}`}>
                          {file.retention}
                        </span>
                      </div>

                      <div className="hidden lg:block text-[12px] text-white/50">{file.date}</div>
                      <div className="hidden lg:block text-[12px] text-white/60">{file.size}</div>

                      <div className="flex items-center gap-1 justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewFile(file);
                          }}
                          title="Preview"
                          className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.10] border border-white/5 flex items-center justify-center transition"
                        >
                          <Eye className="w-4 h-4 text-white/60" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(file);
                          }}
                          title="Download"
                          className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.10] border border-white/5 flex items-center justify-center transition"
                        >
                          <Download className="w-4 h-4 text-white/60" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {filteredFiles.length === 0 && (
              <div className="rounded-[20px] bg-white/[0.03] border border-white/10 border-dashed p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-white/[0.06] mx-auto flex items-center justify-center">
                  <Search className="w-5 h-5 text-white/30" />
                </div>
                <p className="mt-4 text-[14px] font-medium">No files found</p>
                <p className="mt-1 text-[12px] text-white/40">Try a different search or category</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Floating Bottom Action Bar for Bulk Selection */}
      <FloatingActionBar
        selectedFiles={selectedFiles}
        onClearSelection={clearSelection}
        onBulkDownload={handleBulkDownload}
        onRequestBulkDelete={() => setIsDeleteModalOpen(true)}
        isDownloading={isDownloadingBulk}
      />

      {/* Bulk Delete Confirmation Modal */}
      <BulkDeleteModal
        isOpen={isDeleteModalOpen}
        selectedFiles={selectedFiles}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirmDelete={handleConfirmBulkDelete}
      />

      {/* File Detail / Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={handleDownload}
      />

      {/* Google Workspace Modal (Drive, Sheets, Docs, Slides, Gmail, Calendar, Tasks, Classroom, etc.) */}
      <GoogleWorkspaceModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        onImportFile={handleImportWorkspaceFile}
      />

      {/* Google Maps Vault Storage Topology & Asset Geolocation Modal */}
      <VaultMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        files={files}
        onSelectFilePreview={(f) => setPreviewFile(f)}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 rounded-xl bg-[#0c1122]/95 border border-white/15 px-4 py-2.5 text-[13px] text-white shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 p-3 pointer-events-none">
        <div className="pointer-events-auto mx-auto max-w-[520px] rounded-[20px] bg-[#0e1326]/90 backdrop-blur-[20px] border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.5)] p-1.5 flex items-center justify-between">
          {[
            { id: "all", label: "All", icon: Files },
            { id: "photos", label: "Photos", icon: Image },
            { id: "videos", label: "Videos", icon: Video },
            { id: "documents", label: "Docs", icon: FileText },
          ].map((item) => {
            const isSelected = activeCategory === item.id;
            const IconComp = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveCategory(item.id)}
                className={`flex-1 h-[44px] rounded-[14px] flex flex-col items-center justify-center gap-0.5 transition ${
                  isSelected ? "bg-white text-black" : "text-white/50"
                }`}
              >
                <IconComp className="w-4 h-4" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
          <div className="w-px h-8 bg-white/10 mx-1" />
          <button
            type="button"
            onClick={() => setIsUnlocked(false)}
            title="Lock Vault"
            className="w-[44px] h-[44px] rounded-[14px] bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/60 hover:text-white"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Top Status Pill */}
      <div className="lg:hidden fixed top-3 left-3 right-3 z-20 pointer-events-none">
        <div className="mx-auto max-w-[520px] flex justify-center">
          <div className="pointer-events-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0e1326]/80 backdrop-blur-xl border border-white/10 text-[11px]">
            <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full" 
                style={{ width: `${Math.max(2, Number(counts.percentUsed))}%` }}
              />
            </div>
            <span className="text-white/60">{counts.gbUsed} GB / 100 GB</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-emerald-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Locked
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
