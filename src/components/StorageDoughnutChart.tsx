import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { VaultFile } from '../types';

interface StorageDoughnutChartProps {
  files: VaultFile[];
  capacityGb?: number;
}

interface CategoryData {
  name: string;
  category: string;
  bytes: number;
  formattedSize: string;
  color: string;
  percentage: number;
  [key: string]: any;
}

const CATEGORY_COLORS: Record<string, string> = {
  photos: '#a78bfa',   // Violet
  videos: '#38bdf8',   // Sky/Blue
  documents: '#34d399',// Emerald
  free: '#1e293b'      // Slate-800 for unallocated
};

export const StorageDoughnutChart: React.FC<StorageDoughnutChartProps> = ({
  files,
  capacityGb = 100
}) => {
  const capacityBytes = capacityGb * 1024 * 1024 * 1024;

  const { chartData, totalBytesUsed, photosBytes, videosBytes, docsBytes } = React.useMemo(() => {
    let photos = 0;
    let videos = 0;
    let docs = 0;

    files.forEach((f) => {
      if (f.category === 'photos') photos += f.sizeBytes;
      else if (f.category === 'videos') videos += f.sizeBytes;
      else if (f.category === 'documents') docs += f.sizeBytes;
    });

    const used = photos + videos + docs;
    const free = Math.max(0, capacityBytes - used);

    const formatBytes = (bytes: number): string => {
      if (bytes >= 1024 * 1024 * 1024) {
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
      }
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const data: CategoryData[] = [
      {
        name: 'Videos',
        category: 'videos',
        bytes: videos,
        formattedSize: formatBytes(videos),
        color: CATEGORY_COLORS.videos,
        percentage: Number(((videos / capacityBytes) * 100).toFixed(1))
      },
      {
        name: 'Photos',
        category: 'photos',
        bytes: photos,
        formattedSize: formatBytes(photos),
        color: CATEGORY_COLORS.photos,
        percentage: Number(((photos / capacityBytes) * 100).toFixed(1))
      },
      {
        name: 'Documents',
        category: 'documents',
        bytes: docs,
        formattedSize: formatBytes(docs),
        color: CATEGORY_COLORS.documents,
        percentage: Number(((docs / capacityBytes) * 100).toFixed(1))
      },
      {
        name: 'Free Space',
        category: 'free',
        bytes: free,
        formattedSize: formatBytes(free),
        color: CATEGORY_COLORS.free,
        percentage: Number(((free / capacityBytes) * 100).toFixed(1))
      }
    ].filter((item) => item.bytes > 0);

    return {
      chartData: data,
      totalBytesUsed: used,
      photosBytes: photos,
      videosBytes: videos,
      docsBytes: docs
    };
  }, [files, capacityBytes]);

  const usedGb = (totalBytesUsed / (1024 * 1024 * 1024)).toFixed(1);
  const usedPercent = ((totalBytesUsed / capacityBytes) * 100).toFixed(1);

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full">
      {/* Doughnut Chart with Center Metric */}
      <div className="relative w-full h-[150px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as CategoryData;
                  if (data.category === 'free') {
                    return (
                      <div className="rounded-xl bg-[#0d1223]/95 border border-white/10 px-3 py-2 text-[11px] shadow-2xl backdrop-blur-md">
                        <p className="font-semibold text-white/90">Available Storage</p>
                        <p className="text-white/50">{data.formattedSize} ({data.percentage}% free)</p>
                      </div>
                    );
                  }
                  return (
                    <div className="rounded-xl bg-[#0d1223]/95 border border-white/10 px-3 py-2 text-[11px] shadow-2xl backdrop-blur-md">
                      <div className="flex items-center gap-1.5 font-semibold" style={{ color: data.color }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
                        <span>{data.name}</span>
                      </div>
                      <p className="mt-1 text-white/90 font-medium">{data.formattedSize}</p>
                      <p className="text-white/40 text-[10px]">{data.percentage}% of 100 GB vault</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={chartData}
              dataKey="bytes"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={44}
              outerRadius={62}
              paddingAngle={3}
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[16px] font-bold text-white tracking-tight leading-none font-mono">
            {usedGb} <span className="text-[10px] font-normal text-white/40">GB</span>
          </span>
          <span className="text-[10px] text-white/40 tracking-wider mt-0.5">
            {usedPercent}% used
          </span>
        </div>
      </div>

      {/* Category breakdown legend below */}
      <div className="mt-2 grid grid-cols-3 gap-1.5 pt-2 border-t border-white/5 text-[11px]">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-white/50">
            <span className="w-2 h-2 rounded-full bg-[#38bdf8] shrink-0" />
            <span className="truncate">Videos</span>
          </div>
          <span className="text-[11px] font-medium text-white/90 font-mono mt-0.5">
            {formatSize(videosBytes)}
          </span>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-white/50">
            <span className="w-2 h-2 rounded-full bg-[#a78bfa] shrink-0" />
            <span className="truncate">Photos</span>
          </div>
          <span className="text-[11px] font-medium text-white/90 font-mono mt-0.5">
            {formatSize(photosBytes)}
          </span>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-white/50">
            <span className="w-2 h-2 rounded-full bg-[#34d399] shrink-0" />
            <span className="truncate">Docs</span>
          </div>
          <span className="text-[11px] font-medium text-white/90 font-mono mt-0.5">
            {formatSize(docsBytes)}
          </span>
        </div>
      </div>
    </div>
  );
};
