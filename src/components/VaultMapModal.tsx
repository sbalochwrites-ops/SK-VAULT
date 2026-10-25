import React, { useState } from 'react';
import { X, Globe2, Shield, Server, MapPin, Radio, HardDrive, ExternalLink, Key, CheckCircle2 } from 'lucide-react';
import { VaultFile } from '../types';

interface VaultNode {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  status: 'online' | 'replicating' | 'cold-sync';
  latency: string;
  redundancy: string;
  tier: string;
}

const STORAGE_NODES: VaultNode[] = [
  {
    id: 'sg-1',
    name: 'Singapore Primary Vault',
    region: 'asia-southeast1',
    lat: 1.3521,
    lng: 103.8198,
    status: 'online',
    latency: '8 ms',
    redundancy: '3x Erasure Coded',
    tier: 'Hot Mirror'
  },
  {
    id: 'ty-1',
    name: 'Tokyo Secondary Archive',
    region: 'asia-northeast1',
    lat: 35.6762,
    lng: 139.6503,
    status: 'online',
    latency: '34 ms',
    redundancy: '2x Geographic Parity',
    tier: 'Warm Reserve'
  },
  {
    id: 'ch-1',
    name: 'Swiss Alpine Deep Vault',
    region: 'europe-west6 (Zurich)',
    lat: 47.3769,
    lng: 8.5417,
    status: 'cold-sync',
    latency: '112 ms',
    redundancy: 'Optical Cold Storage',
    tier: '100-Year Air-gap'
  },
  {
    id: 'de-1',
    name: 'Frankfurt Sovereign Node',
    region: 'europe-west3',
    lat: 50.1109,
    lng: 8.6821,
    status: 'online',
    latency: '105 ms',
    redundancy: 'GDPR / ISO-27001 Validated',
    tier: 'Zero-Knowledge Replica'
  },
  {
    id: 'us-1',
    name: 'Virginia Atlantic Gateway',
    region: 'us-east4',
    lat: 39.0438,
    lng: -77.4874,
    status: 'online',
    latency: '168 ms',
    redundancy: 'Multi-AZ Reed-Solomon',
    tier: 'High Availability'
  }
];

const FILE_LOCATIONS = [
  { id: '1', name: 'IMG_4928_NorthernLights.jpg', location: 'Tromsø, Norway', lat: 69.6492, lng: 18.9553, category: 'photos' },
  { id: '2', name: 'Family_Reunion_2023.mp4', location: 'Banff National Park, Canada', lat: 51.1784, lng: -115.5708, category: 'videos' },
  { id: '4', name: 'IMG_8810_BabyFirstSteps.jpg', location: 'San Francisco, CA, USA', lat: 37.7749, lng: -122.4194, category: 'photos' },
  { id: '3', name: 'House_Deed_Signed.pdf', location: 'Zurich Vault Deposit, Switzerland', lat: 47.3769, lng: 8.5417, category: 'documents' }
];

interface VaultMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: VaultFile[];
  onSelectFilePreview: (file: VaultFile) => void;
}

export const VaultMapModal: React.FC<VaultMapModalProps> = ({
  isOpen,
  onClose,
  files,
  onSelectFilePreview
}) => {
  const [activeTab, setActiveTab] = useState<'nodes' | 'geotags'>('nodes');
  const [selectedNode, setSelectedNode] = useState<VaultNode>(STORAGE_NODES[0]);
  const [selectedFileLoc, setSelectedFileLoc] = useState(FILE_LOCATIONS[0]);

  const mapsApiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#0c1021] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0f142b]/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">Global Vault & Storage Topology</h3>
                <span className="px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full">
                  5 Replicas Active
                </span>
              </div>
              <p className="text-xs text-white/50">
                Google Maps geographic distribution of cold-storage servers and geotagged digital assets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setActiveTab('nodes')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'nodes'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                Storage Nodes ({STORAGE_NODES.length})
              </button>
              <button
                onClick={() => setActiveTab('geotags')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'geotags'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                Geotagged Files ({FILE_LOCATIONS.length})
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-xl transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notice for API key if missing */}
        {!mapsApiKey && (
          <div className="px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Google Maps API Key:</strong> Running with vector topology preview. To unlock live satellite terrain tiles, configure <code className="bg-black/30 px-1.5 py-0.5 rounded font-mono text-amber-200">VITE_GOOGLE_MAPS_API_KEY</code>.
              </span>
            </div>
            <span className="text-[11px] text-amber-400/80 font-mono">Demo Mode Active</span>
          </div>
        )}

        {/* Content Body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 flex-1 overflow-hidden">
          {/* Map Canvas / Projection */}
          <div className="lg:col-span-2 relative bg-[#060814] p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10 min-h-[380px]">
            {/* World Grid Visualization */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#6366f1" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Simulated Mercator SVG continent background */}
            <div className="absolute inset-4 flex items-center justify-center opacity-30 pointer-events-none">
              <div className="text-center">
                <Globe2 className="w-72 h-72 text-purple-500/30 mx-auto animate-pulse" />
              </div>
            </div>

            {/* Pins overlay */}
            <div className="relative z-10 w-full h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 bg-[#0c1021]/80 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 text-xs">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-ping" />
                  <span className="text-white/80 font-medium">Replication Status: Real-time Synchronized</span>
                </div>
                <div className="text-[11px] text-white/40 font-mono">
                  AES-256 Multi-Cloud Mesh
                </div>
              </div>

              {/* Interactive Node Markers positioned roughly on global map */}
              <div className="relative my-auto h-64 w-full">
                {activeTab === 'nodes' ? (
                  <>
                    {/* Singapore */}
                    <div 
                      onClick={() => setSelectedNode(STORAGE_NODES[0])}
                      className={`absolute left-[72%] top-[62%] -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125 ${selectedNode.id === 'sg-1' ? 'scale-125 z-20' : 'z-10'}`}
                    >
                      <div className="relative flex items-center justify-center">
                        <span className="absolute w-8 h-8 rounded-full bg-emerald-500/20 animate-ping" />
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold text-[10px] shadow-lg shadow-emerald-500/50">
                          SG
                        </div>
                      </div>
                      <div className="mt-1 bg-black/80 backdrop-blur text-[10px] text-emerald-300 font-semibold px-1.5 py-0.5 rounded border border-emerald-500/30 whitespace-nowrap">
                        Singapore (Primary)
                      </div>
                    </div>

                    {/* Tokyo */}
                    <div 
                      onClick={() => setSelectedNode(STORAGE_NODES[1])}
                      className={`absolute left-[82%] top-[42%] -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125 ${selectedNode.id === 'ty-1' ? 'scale-125 z-20' : 'z-10'}`}
                    >
                      <div className="relative flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-[9px] shadow-lg shadow-purple-500/50">
                          TY
                        </div>
                      </div>
                      <div className="mt-1 bg-black/80 backdrop-blur text-[10px] text-purple-300 font-medium px-1.5 py-0.5 rounded border border-purple-500/30 whitespace-nowrap">
                        Tokyo
                      </div>
                    </div>

                    {/* Zurich */}
                    <div 
                      onClick={() => setSelectedNode(STORAGE_NODES[2])}
                      className={`absolute left-[48%] top-[34%] -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125 ${selectedNode.id === 'ch-1' ? 'scale-125 z-20' : 'z-10'}`}
                    >
                      <div className="relative flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-sky-500 text-black flex items-center justify-center font-bold text-[9px] shadow-lg shadow-sky-500/50">
                          CH
                        </div>
                      </div>
                      <div className="mt-1 bg-black/80 backdrop-blur text-[10px] text-sky-300 font-medium px-1.5 py-0.5 rounded border border-sky-500/30 whitespace-nowrap">
                        Zurich Bunker
                      </div>
                    </div>

                    {/* Frankfurt */}
                    <div 
                      onClick={() => setSelectedNode(STORAGE_NODES[3])}
                      className={`absolute left-[52%] top-[30%] -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125 ${selectedNode.id === 'de-1' ? 'scale-125 z-20' : 'z-10'}`}
                    >
                      <div className="relative flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-amber-500 text-black flex items-center justify-center font-bold text-[9px]">
                          DE
                        </div>
                      </div>
                      <div className="mt-1 bg-black/80 backdrop-blur text-[10px] text-amber-300 font-medium px-1.5 py-0.5 rounded border border-amber-500/30 whitespace-nowrap">
                        Frankfurt
                      </div>
                    </div>

                    {/* Virginia */}
                    <div 
                      onClick={() => setSelectedNode(STORAGE_NODES[4])}
                      className={`absolute left-[24%] top-[40%] -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125 ${selectedNode.id === 'us-1' ? 'scale-125 z-20' : 'z-10'}`}
                    >
                      <div className="relative flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-[9px]">
                          US
                        </div>
                      </div>
                      <div className="mt-1 bg-black/80 backdrop-blur text-[10px] text-blue-300 font-medium px-1.5 py-0.5 rounded border border-blue-500/30 whitespace-nowrap">
                        Virginia
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {FILE_LOCATIONS.map((loc) => (
                      <div
                        key={loc.id}
                        onClick={() => setSelectedFileLoc(loc)}
                        className="cursor-pointer transition-all hover:scale-110"
                        style={{
                          position: 'absolute',
                          left: `${((loc.lng + 180) / 360) * 100}%`,
                          top: `${((90 - loc.lat) / 180) * 100}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        <div className="flex items-center gap-1 bg-[#161c36] border border-purple-500/40 text-purple-300 px-2 py-1 rounded-md text-[10px] shadow-lg">
                          <MapPin className="w-3 h-3 text-purple-400" />
                          <span className="font-medium truncate max-w-[120px]">{loc.name}</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Bottom live stats */}
              <div className="flex items-center justify-between text-xs text-white/50 pt-2 border-t border-white/10">
                <div className="flex items-center gap-4">
                  <span>Target Region: <strong className="text-white">asia-southeast1</strong></span>
                  <span>Encryption: <strong className="text-white">AES-GCM-256</strong></span>
                </div>
                <div>Global RTT: <strong className="text-emerald-400">Average 46ms</strong></div>
              </div>
            </div>
          </div>

          {/* Right Detail Panel */}
          <div className="p-6 bg-[#0c1021] flex flex-col justify-between overflow-y-auto">
            {activeTab === 'nodes' ? (
              <div className="space-y-5">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-purple-400">Node Inspector</span>
                  <h4 className="text-lg font-bold text-white mt-0.5">{selectedNode.name}</h4>
                  <p className="text-xs text-white/50">{selectedNode.region}</p>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <span className="text-xs text-white/60">Operational Status</span>
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {selectedNode.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <span className="text-xs text-white/60">Network Ping</span>
                    <span className="text-xs font-mono font-medium text-white">{selectedNode.latency}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <span className="text-xs text-white/60">Redundancy Strategy</span>
                    <span className="text-xs font-medium text-purple-300">{selectedNode.redundancy}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <span className="text-xs text-white/60">Storage Tier</span>
                    <span className="text-xs font-medium text-white">{selectedNode.tier}</span>
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-white/80 mb-2">Select Replica Node</h5>
                  <div className="space-y-1.5">
                    {STORAGE_NODES.map((node) => (
                      <button
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          selectedNode.id === node.id
                            ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                            : 'hover:bg-white/5 text-white/70'
                        }`}
                      >
                        <span className="truncate">{node.name}</span>
                        <span className="font-mono text-[10px] text-white/40">{node.latency}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-purple-400">Asset Geotag</span>
                  <h4 className="text-base font-bold text-white mt-0.5">{selectedFileLoc.name}</h4>
                  <p className="text-xs text-white/50">{selectedFileLoc.location}</p>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">Coordinates</span>
                    <span className="font-mono text-white/90">{selectedFileLoc.lat.toFixed(4)}, {selectedFileLoc.lng.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">Category</span>
                    <span className="capitalize text-purple-300">{selectedFileLoc.category}</span>
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-white/80 mb-2">All Geotagged Items</h5>
                  <div className="space-y-1.5">
                    {FILE_LOCATIONS.map((loc) => (
                      <button
                        key={loc.id}
                        onClick={() => setSelectedFileLoc(loc)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          selectedFileLoc.id === loc.id
                            ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                            : 'hover:bg-white/5 text-white/70'
                        }`}
                      >
                        <span className="truncate font-medium">{loc.name}</span>
                        <span className="text-[11px] text-white/40 truncate ml-2">{loc.location}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    const match = files.find(f => f.id === selectedFileLoc.id);
                    if (match) {
                      onClose();
                      onSelectFilePreview(match);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open File In Preview
                </button>
              </div>
            )}

            <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40">
              <span>Google Maps Integration</span>
              <span>v1.0 Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
