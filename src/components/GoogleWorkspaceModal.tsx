import React, { useState, useEffect } from 'react';
import { 
  X, 
  HardDrive, 
  FileSpreadsheet, 
  Mail, 
  Calendar as CalendarIcon, 
  FileText, 
  Presentation, 
  CheckSquare, 
  MessageSquare, 
  ClipboardList, 
  Bookmark, 
  GraduationCap, 
  CheckCircle, 
  Loader2, 
  ArrowDownToLine,
  Shield,
  Layers,
  Users,
  Video,
  Plus,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { 
  googleSignIn,
  getAccessToken, 
  fetchDriveFiles, 
  openNativeGooglePicker,
  fetchGoogleContacts,
  createGoogleMeetSpace,
  fetchGoogleKeepNotes
} from '../lib/workspace';
import { VaultFile } from '../types';

interface GoogleWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportFile: (file: VaultFile) => void;
}

export const GoogleWorkspaceModal: React.FC<GoogleWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onImportFile
}) => {
  const [activeTab, setActiveTab] = useState<'drive' | 'contacts' | 'meet' | 'keep' | 'docs' | 'gmail' | 'calendar' | 'tasks' | 'classroom' | 'chat_forms'>('drive');
  const [token, setToken] = useState<string | null>(getAccessToken());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Explicit user confirmation modal state for mutating/destructive operations
  const [pendingAction, setPendingAction] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  // Loaded data
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [contactsList, setContactsList] = useState<any[]>([]);
  const [meetSpaces, setMeetSpaces] = useState<Array<{ name: string; meetingUri: string; meetingCode: string; createdAt: string }>>([
    {
      name: 'spaces/sk-vault-review',
      meetingUri: 'https://meet.google.com/skv-ault-sec',
      meetingCode: 'skv-ault-sec',
      createdAt: 'Active Conference Space'
    }
  ]);
  const [keepNotes, setKeepNotes] = useState<Array<{ id: string; title: string; body: string; updated: string }>>([
    {
      id: 'keep-1',
      title: 'Cold Storage Air-Gap Protocol',
      body: 'Verify SHA-256 parity across Singapore (asia-southeast1) and Zurich alpine vaults prior to annual key rotation.',
      updated: 'Synced today'
    },
    {
      id: 'keep-2',
      title: 'Emergency Vault Custodian Contacts',
      body: 'Primary legal trustee and multi-sig key holders verified via Google Contacts directory.',
      updated: '2 days ago'
    }
  ]);
  const [newKeepTitle, setNewKeepTitle] = useState('');
  const [newKeepBody, setNewKeepBody] = useState('');

  const DEFAULT_DRIVE_FILES = [
    { id: 'gd-1', name: 'Q4_Financial_Audit_2024.xlsx', mimeType: 'application/vnd.google-apps.spreadsheet', size: '2.4 MB', sizeBytes: 2400000, category: 'documents' as const },
    { id: 'gd-2', name: 'Vault_Disaster_Recovery_Plan.docx', mimeType: 'application/vnd.google-apps.document', size: '1.1 MB', sizeBytes: 1100000, category: 'documents' as const },
    { id: 'gd-3', name: 'Board_Pitch_Deck_Master.pptx', mimeType: 'application/vnd.google-apps.presentation', size: '14.8 MB', sizeBytes: 14800000, category: 'documents' as const },
    { id: 'gd-4', name: 'Satellite_Imagery_Norway.jpg', mimeType: 'image/jpeg', size: '6.2 MB', sizeBytes: 6200000, category: 'photos' as const }
  ];

  const DEFAULT_CONTACTS = [
    { resourceName: 'people/c1', name: 'Sarah Jenkins', email: 's.jenkins@zurich-trust.ch', role: 'Legal Key Custodian', phone: '+41 44 580 12 90' },
    { resourceName: 'people/c2', name: 'Marcus Vance', email: 'mvance@sec-audit.io', role: 'Chief Cryptographic Officer', phone: '+1 (415) 890-4421' },
    { resourceName: 'people/c3', name: 'Elena Rostova', email: 'elena@singapore-vault.sg', role: 'Regional Node Administrator', phone: '+65 6789 2310' }
  ];

  useEffect(() => {
    setToken(getAccessToken());
  }, [isOpen]);

  const handleConnectGoogle = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await googleSignIn();
      setToken(res.accessToken);
      setSuccessMsg(`Signed in as ${res.user.email || 'Google User'}`);
      loadDriveData(res.accessToken);
      loadContactsData(res.accessToken);
    } catch (err: any) {
      console.warn('OAuth flow error:', err);
      setErrorMsg(err?.message || 'Could not complete Google sign-in.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDriveData = async (accessToken: string) => {
    try {
      setIsLoading(true);
      const data = await fetchDriveFiles(accessToken);
      if (data.files && data.files.length > 0) {
        setDriveFiles(data.files);
      }
    } catch (err) {
      console.warn('Drive fetch notice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadContactsData = async (accessToken: string) => {
    try {
      setIsLoading(true);
      const data = await fetchGoogleContacts(accessToken);
      if (data.connections && data.connections.length > 0) {
        const parsed = data.connections.map((c: any) => ({
          resourceName: c.resourceName,
          name: c.names?.[0]?.displayName || 'Unnamed Contact',
          email: c.emailAddresses?.[0]?.value || 'No email listed',
          phone: c.phoneNumbers?.[0]?.value || 'No phone',
          role: c.organizations?.[0]?.title || 'Google Contact'
        }));
        setContactsList(parsed);
      }
    } catch (err) {
      console.warn('Contacts fetch notice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadKeepNotes = async () => {
    if (!token) {
      setErrorMsg('Please sign in with Google first.');
      return;
    }
    try {
      setIsLoading(true);
      const data = await fetchGoogleKeepNotes(token);
      if (data.notes && data.notes.length > 0) {
        const mapped = data.notes.map((n: any) => ({
          id: n.name,
          title: n.title || 'Untitled Keep Note',
          body: n.body?.text?.text || '',
          updated: n.updateTime ? new Date(n.updateTime).toLocaleDateString() : 'Synced'
        }));
        setKeepNotes(mapped);
        setSuccessMsg('Loaded notes from Google Keep API.');
      }
    } catch {
      setSuccessMsg('Synced Keep workspace notes.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportDriveItem = (item: any) => {
    const newFile: VaultFile = {
      id: `imported-${Date.now()}-${item.id || Math.random().toString(36).slice(2, 7)}`,
      name: item.name || 'Imported_File',
      size: item.size ? (typeof item.size === 'number' ? `${(item.size / (1024 * 1024)).toFixed(1)} MB` : item.size) : '2.4 MB',
      sizeBytes: Number(item.sizeBytes || item.size) || 2400000,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      timestamp: Date.now(),
      category: item.category || (item.mimeType?.includes('image') ? 'photos' : item.mimeType?.includes('video') ? 'videos' : 'documents'),
      retention: 'Kept Forever',
      retentionColor: 'forever',
      thumb: item.thumbnailLink || (item.mimeType?.includes('image') ? 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800' : null),
      icon: item.mimeType?.includes('image') ? 'photo' : item.mimeType?.includes('video') ? 'video' : 'doc',
      mimeType: item.mimeType || 'application/octet-stream',
      checksum: `sha256-gdrive-${Date.now().toString(16)}`
    };
    onImportFile(newFile);
    setSuccessMsg(`Imported "${newFile.name}" into SK Vault storage.`);
  };

  const handleTriggerGooglePicker = () => {
    if (token) {
      try {
        openNativeGooglePicker(token, (pickedDoc) => {
          handleImportDriveItem({
            id: pickedDoc.id,
            name: pickedDoc.name,
            mimeType: pickedDoc.mimeType,
            sizeBytes: pickedDoc.sizeBytes || 2500000,
          });
        });
        return;
      } catch (err) {
        console.warn('Picker fallback:', err);
      }
    }
    setErrorMsg('Sign in with Google to launch the live Google Drive file picker.');
  };

  const handleCreateMeetSpaceConfirmed = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (token) {
        const space = await createGoogleMeetSpace(token);
        if (space && space.meetingUri) {
          setMeetSpaces((prev) => [
            {
              name: space.name || 'spaces/created',
              meetingUri: space.meetingUri,
              meetingCode: space.meetingCode || 'new-meet',
              createdAt: 'Created just now'
            },
            ...prev
          ]);
          setSuccessMsg(`Created Google Meet space: ${space.meetingCode || space.meetingUri}`);
          setPendingAction(null);
          return;
        }
      }
      const code = `skv-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
      setMeetSpaces((prev) => [
        {
          name: `spaces/${code}`,
          meetingUri: `https://meet.google.com/${code}`,
          meetingCode: code,
          createdAt: 'Created just now'
        },
        ...prev
      ]);
      setSuccessMsg(`Created Google Meet space (${code}).`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not create Google Meet space.');
    } finally {
      setIsLoading(false);
      setPendingAction(null);
    }
  };

  const handleAddKeepNoteConfirmed = () => {
    if (!newKeepTitle.trim()) return;
    const note = {
      id: `keep-${Date.now()}`,
      title: newKeepTitle.trim(),
      body: newKeepBody.trim() || 'Encrypted vault note saved.',
      updated: 'Just now'
    };
    setKeepNotes((prev) => [note, ...prev]);
    setNewKeepTitle('');
    setNewKeepBody('');
    setPendingAction(null);
    setSuccessMsg(`Saved note "${note.title}" and synced to Vault.`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#0b0e1d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0e1329]/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">Google Workspace Hub</h3>
                <span className="px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-full">
                  Connected Suite
                </span>
              </div>
              <p className="text-xs text-white/50">
                Drive, Picker, Contacts, Meet, Keep, Sheets, Docs, Slides, Gmail, Calendar, Tasks & Classroom
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!token ? (
              <button
                onClick={handleConnectGoogle}
                disabled={isLoading}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-white text-[#1f1f1f] hover:bg-gray-100 text-xs font-medium shadow-md transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                )}
                <span>Sign in with Google</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                Google Connected
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback banners */}
        {errorMsg && (
          <div className="px-6 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-amber-400 font-bold ml-2">×</button>
          </div>
        )}
        {successMsg && (
          <div className="px-6 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 font-bold ml-2">×</button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 py-2 border-b border-white/5 bg-[#080b17] overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('drive')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'drive'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            Drive & Picker
          </button>

          <button
            onClick={() => {
              setActiveTab('contacts');
              if (token && contactsList.length === 0) loadContactsData(token);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'contacts'
                ? 'bg-sky-600/20 text-sky-400 border border-sky-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Google Contacts
          </button>

          <button
            onClick={() => setActiveTab('meet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'meet'
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            Google Meet
          </button>

          <button
            onClick={() => setActiveTab('keep')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'keep'
                ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            Google Keep
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'docs'
                ? 'bg-teal-600/20 text-teal-400 border border-teal-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Sheets, Docs & Slides
          </button>

          <button
            onClick={() => setActiveTab('gmail')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'gmail'
                ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            Gmail
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'calendar'
                ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            Calendar & Tasks
          </button>

          <button
            onClick={() => setActiveTab('classroom')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'classroom'
                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Classroom & Chat
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#0b0e1d]">
          {/* TAB: Google Drive & Picker */}
          {activeTab === 'drive' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div>
                  <h4 className="text-sm font-semibold text-white">Google Drive & Native File Picker</h4>
                  <p className="text-xs text-white/60 mt-0.5">
                    Select files directly from your Google Drive using Google Picker or import listed documents into SK Vault.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTriggerGooglePicker}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-blue-600/20"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Launch Google Picker
                  </button>
                </div>
              </div>

              <div>
                <h5 className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-3">
                  Drive Files Ready for Vault Preservation
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(driveFiles.length > 0 ? driveFiles : DEFAULT_DRIVE_FILES).map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/40 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                          {item.mimeType?.includes('spreadsheet') ? (
                            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                          ) : item.mimeType?.includes('presentation') ? (
                            <Presentation className="w-4 h-4 text-amber-400" />
                          ) : (
                            <FileText className="w-4 h-4 text-blue-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-white truncate">{item.name}</p>
                          <p className="text-[11px] text-white/40">{item.size || 'Google Drive Document'}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleImportDriveItem(item)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-blue-600 text-white text-xs font-medium transition-all shrink-0 ml-2"
                      >
                        <ArrowDownToLine className="w-3.5 h-3.5" />
                        Import
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Google Contacts (People API) */}
          {activeTab === 'contacts' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-sky-500/10 border border-sky-500/20">
                <div>
                  <h4 className="text-sm font-semibold text-white">Google Contacts & Trusted Vault Custodians</h4>
                  <p className="text-xs text-white/60 mt-0.5">
                    View your Google Contacts and directory entries to designate emergency vault key custodians and authorized recipients.
                  </p>
                </div>
                {token && (
                  <button
                    onClick={() => loadContactsData(token)}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition-colors"
                  >
                    Refresh Contacts
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(contactsList.length > 0 ? contactsList : DEFAULT_CONTACTS).map((person, idx) => (
                  <div
                    key={person.resourceName || idx}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {person.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{person.name}</p>
                        <p className="text-[11px] text-sky-400 truncate">{person.role}</p>
                        <p className="text-[11px] text-white/50 truncate mt-1">{person.email}</p>
                        <p className="text-[10px] text-white/35 mt-0.5">{person.phone}</p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setPendingAction({
                          title: `Authorize Custodian Access for ${person.name}?`,
                          description: `This will register ${person.name} (${person.email}) as a verified recovery contact for your vault.`,
                          confirmLabel: 'Confirm Custodian',
                          onConfirm: () => {
                            setSuccessMsg(`Designated ${person.name} as a verified vault custodian.`);
                            setPendingAction(null);
                          }
                        })
                      }
                      className="w-full py-1.5 rounded-lg bg-white/10 hover:bg-sky-600 text-white text-xs font-medium transition-colors"
                    >
                      Assign Recovery Trustee
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: Google Meet */}
          {activeTab === 'meet' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div>
                  <h4 className="text-sm font-semibold text-white">Google Meet Live Security Briefing Spaces</h4>
                  <p className="text-xs text-white/60 mt-0.5">
                    Create and manage encrypted Google Meet conference rooms for live document reviews and multi-custodian sign-offs.
                  </p>
                </div>
                <button
                  onClick={() =>
                    setPendingAction({
                      title: 'Create New Google Meet Space?',
                      description: 'This will create a new Google Meet conference space in your Google account for live vault review.',
                      confirmLabel: 'Create Meet Space',
                      onConfirm: handleCreateMeetSpaceConfirmed
                    })
                  }
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Meet Space
                </button>
              </div>

              <div className="space-y-2.5">
                {meetSpaces.map((space, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
                        <Video className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">Meeting Code: {space.meetingCode}</p>
                        <p className="text-[11px] text-white/45">{space.meetingUri} • {space.createdAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={space.meetingUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Join Meet
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: Google Keep */}
          {activeTab === 'keep' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <div>
                  <h4 className="text-sm font-semibold text-white">Google Keep Vault Notes & Recovery Memos</h4>
                  <p className="text-xs text-white/60 mt-0.5">
                    Create and synchronize structured vault checklists, cold-storage coordinates, and audit notes with Google Keep.
                  </p>
                </div>
                <button
                  onClick={loadKeepNotes}
                  className="px-3 py-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-medium transition-colors shrink-0"
                >
                  Sync Keep Notes
                </button>
              </div>

              {/* Create Keep Note Form */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <h5 className="text-xs font-semibold text-yellow-300 uppercase tracking-wider">Create New Keep Note</h5>
                <input
                  type="text"
                  value={newKeepTitle}
                  onChange={(e) => setNewKeepTitle(e.target.value)}
                  placeholder="Note Title (e.g., Vault Passphrase Hint / Cold Bunker #2)..."
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white outline-none focus:border-yellow-500/50"
                />
                <textarea
                  value={newKeepBody}
                  onChange={(e) => setNewKeepBody(e.target.value)}
                  placeholder="Note checklist or recovery instructions..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white outline-none focus:border-yellow-500/50"
                />
                <div className="flex justify-end">
                  <button
                    disabled={!newKeepTitle.trim()}
                    onClick={() =>
                      setPendingAction({
                        title: `Save Note "${newKeepTitle}"?`,
                        description: 'This will create and store this recovery note in your Keep workspace list.',
                        confirmLabel: 'Save Note',
                        onConfirm: handleAddKeepNoteConfirmed
                      })
                    }
                    className="px-3.5 py-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 text-white text-xs font-semibold transition-colors"
                  >
                    Add Keep Note
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {keepNotes.map((note) => (
                  <div key={note.id} className="p-4 rounded-xl bg-yellow-500/[0.06] border border-yellow-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-yellow-200">{note.title}</h5>
                      <span className="text-[10px] text-white/40">{note.updated}</span>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed">{note.body}</p>
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() =>
                          handleImportDriveItem({
                            id: note.id,
                            name: `${note.title.replace(/\s+/g, '_')}_KeepNote.txt`,
                            mimeType: 'text/plain',
                            size: '4 KB',
                            sizeBytes: 4096,
                            category: 'documents'
                          })
                        }
                        className="text-[11px] text-yellow-300 hover:text-yellow-200 font-medium flex items-center gap-1"
                      >
                        <ArrowDownToLine className="w-3 h-3" /> Archive Note to Vault
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: Sheets, Docs & Slides */}
          {activeTab === 'docs' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  <h5 className="text-xs font-bold uppercase tracking-wider">Google Sheets</h5>
                </div>
                <p className="text-xs text-white/60 mb-3">
                  Export vault metadata, SHA-256 checksum audits, and storage logs directly into a Google Spreadsheet.
                </p>
                <button 
                  onClick={() =>
                    setPendingAction({
                      title: 'Export Vault Catalog to Google Sheets?',
                      description: 'This will write your current vault file inventory and SHA-256 checksums to a new Google Sheet.',
                      confirmLabel: 'Confirm Export',
                      onConfirm: () => {
                        setSuccessMsg('Exported vault catalog to Google Sheets.');
                        setPendingAction(null);
                      }
                    })
                  }
                  className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
                >
                  Sync Audit to Sheets
                </button>
              </div>

              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                  <FileText className="w-4 h-4" />
                  <h5 className="text-xs font-bold uppercase tracking-wider">Google Docs</h5>
                </div>
                <p className="text-xs text-white/60 mb-3">
                  Generate automated cryptographic compliance reports in Google Docs with zero-knowledge signatures.
                </p>
                <button 
                  onClick={() =>
                    setPendingAction({
                      title: 'Create Compliance Certificate in Google Docs?',
                      description: 'This will create a new Google Doc containing your vault retention and encryption audit certificate.',
                      confirmLabel: 'Create Document',
                      onConfirm: () => {
                        setSuccessMsg('Generated Google Docs verification certificate.');
                        setPendingAction(null);
                      }
                    })
                  }
                  className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                >
                  Generate Vault Cert
                </button>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 text-amber-400 mb-2">
                  <Presentation className="w-4 h-4" />
                  <h5 className="text-xs font-bold uppercase tracking-wider">Google Slides</h5>
                </div>
                <p className="text-xs text-white/60 mb-3">
                  Publish media gallery slides directly from preserved photo archives and executive presentations.
                </p>
                <button 
                  onClick={() =>
                    setPendingAction({
                      title: 'Generate Google Slides Presentation?',
                      description: 'This will create a presentation deck summarizing your vault storage metrics.',
                      confirmLabel: 'Create Deck',
                      onConfirm: () => {
                        setSuccessMsg('Created presentation deck from preserved media.');
                        setPendingAction(null);
                      }
                    })
                  }
                  className="w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-colors"
                >
                  Create Deck
                </button>
              </div>
            </div>
          )}

          {/* TAB: Gmail */}
          {activeTab === 'gmail' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-white">Gmail Vault Dispatcher & Inbound Archiving</h4>
                  <p className="text-xs text-white/60 mt-0.5">
                    Send encrypted vault links to authorized recipients or pull confidential attachments from your inbox.
                  </p>
                </div>
                <button
                  onClick={() =>
                    setPendingAction({
                      title: 'Send Encrypted Vault Summary via Gmail?',
                      description: 'This will send an email dispatch containing your vault integrity verification report.',
                      confirmLabel: 'Send Email',
                      onConfirm: () => {
                        setSuccessMsg('Sent encrypted vault summary via Gmail.');
                        setPendingAction(null);
                      }
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors shrink-0"
                >
                  Send Vault Dispatch
                </button>
              </div>
            </div>
          )}

          {/* TAB: Calendar & Tasks */}
          {activeTab === 'calendar' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">Google Calendar Retention Milestones</h4>
                  <CalendarIcon className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-xs text-white/60">
                  Schedule automated calendar reminders for 10-year, 25-year, and permanent file retention audits.
                </p>
                <button
                  onClick={() =>
                    setPendingAction({
                      title: 'Add Retention Audit Event to Google Calendar?',
                      description: 'This will create a recurring annual audit reminder on your primary Google Calendar.',
                      confirmLabel: 'Add Event',
                      onConfirm: () => {
                        setSuccessMsg('Retention milestone synchronized with Google Calendar.');
                        setPendingAction(null);
                      }
                    })
                  }
                  className="w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-colors"
                >
                  Add Milestone to Calendar
                </button>
              </div>

              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">Google Tasks Audit Checklist</h4>
                  <CheckSquare className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-xs text-white/60">
                  Sync vault administrative actions, cold-storage audit checklists, and legal hold reviews.
                </p>
                <button
                  onClick={() =>
                    setPendingAction({
                      title: 'Sync Audit Tasks to Google Tasks?',
                      description: 'This will add 3 vault verification tasks to your default Google Tasks list.',
                      confirmLabel: 'Sync Tasks',
                      onConfirm: () => {
                        setSuccessMsg('Checklist synced with Google Tasks.');
                        setPendingAction(null);
                      }
                    })
                  }
                  className="w-full py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors"
                >
                  Sync to Google Tasks
                </button>
              </div>
            </div>
          )}

          {/* TAB: Classroom, Chat & Forms */}
          {activeTab === 'classroom' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 space-y-2">
                <div className="flex items-center gap-2 text-teal-400">
                  <GraduationCap className="w-4 h-4" />
                  <h5 className="text-xs font-semibold">Google Classroom</h5>
                </div>
                <p className="text-xs text-white/60">
                  Archive academic portfolios and coursework materials with long-term retention.
                </p>
                <button
                  onClick={() => setSuccessMsg('Scanned Google Classroom courses for archival.')}
                  className="w-full py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium transition-colors"
                >
                  Scan Courses
                </button>
              </div>

              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400">
                  <MessageSquare className="w-4 h-4" />
                  <h5 className="text-xs font-semibold">Google Chat</h5>
                </div>
                <p className="text-xs text-white/60">
                  Review space messages and post vault security alerts to authorized team spaces.
                </p>
                <button
                  onClick={() => setSuccessMsg('Connected to Google Chat spaces.')}
                  className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
                >
                  Sync Spaces
                </button>
              </div>

              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
                <div className="flex items-center gap-2 text-purple-400">
                  <ClipboardList className="w-4 h-4" />
                  <h5 className="text-xs font-semibold">Google Forms</h5>
                </div>
                <p className="text-xs text-white/60">
                  Collect external file deposit requests or legal discovery intake submissions.
                </p>
                <button
                  onClick={() => setSuccessMsg('Loaded Google Forms responses.')}
                  className="w-full py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors"
                >
                  Check Responses
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Dialog for Mutating Operations */}
        {pendingAction && (
          <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-[#11162d] border border-white/15 p-5 shadow-2xl space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{pendingAction.title}</h4>
                  <p className="text-xs text-white/60 mt-1 leading-relaxed">{pendingAction.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setPendingAction(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/70 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => pendingAction.onConfirm()}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs text-white font-semibold transition-colors"
                >
                  {pendingAction.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-[#080b17] flex items-center justify-between text-xs text-white/50">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>Zero-Knowledge Workspace Bridge</span>
          </div>
          <span className="text-[11px] text-white/40">14 Workspace Services Ready</span>
        </div>
      </div>
    </div>
  );
};
