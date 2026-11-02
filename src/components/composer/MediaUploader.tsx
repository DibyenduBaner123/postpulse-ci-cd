import React, { useState } from 'react';
import { MediaAsset } from '../../types';
import { Image as ImageIcon, X, Plus, Sparkles } from 'lucide-react';

interface MediaUploaderProps {
  media: MediaAsset[];
  onChange: (media: MediaAsset[]) => void;
  maxCount?: number;
}

const SAMPLE_ASSETS: MediaAsset[] = [
  {
    id: 'sample_dash',
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    type: 'image',
    name: 'saas_analytics.png',
    sizeBytes: 420000,
  },
  {
    id: 'sample_team',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    type: 'image',
    name: 'engineering_collab.jpg',
    sizeBytes: 520000,
  },
  {
    id: 'sample_code',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    type: 'image',
    name: 'server_architecture.jpg',
    sizeBytes: 680000,
  },
  {
    id: 'sample_mobile',
    url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80',
    type: 'image',
    name: 'mobile_preview.jpg',
    sizeBytes: 380000,
  },
];

export const MediaUploader: React.FC<MediaUploaderProps> = ({ media, onChange, maxCount = 4 }) => {
  const [showGallery, setShowGallery] = useState(false);

  const handleAddSample = (asset: MediaAsset) => {
    if (media.length >= maxCount) return;
    if (media.some((m) => m.id === asset.id)) return;
    onChange([...media, asset]);
  };

  const handleRemove = (assetId: string) => {
    onChange(media.filter((m) => m.id !== assetId));
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const customAsset: MediaAsset = {
        id: `custom_${Date.now()}`,
        url: reader.result as string,
        type: 'image',
        name: file.name,
        sizeBytes: file.size,
      };
      if (media.length < maxCount) {
        onChange([...media, customAsset]);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700">Media Attachments</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGallery(!showGallery)}
            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
          >
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>{showGallery ? 'Hide Gallery' : 'Choose Sample Asset'}</span>
          </button>
          <span className="text-[11px] text-slate-400 font-mono">
            ({media.length}/{maxCount})
          </span>
        </div>
      </div>

      {/* Sample Assets Quick Picker Drawer */}
      {showGallery && (
        <div className="p-3 bg-indigo-50/40 rounded-lg border border-indigo-100 space-y-2">
          <p className="text-[11px] font-medium text-slate-600">Click to attach high-resolution sample photography:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SAMPLE_ASSETS.map((asset) => {
              const isAttached = media.some((m) => m.id === asset.id);
              return (
                <button
                  type="button"
                  key={asset.id}
                  onClick={() => handleAddSample(asset)}
                  disabled={isAttached || media.length >= maxCount}
                  className={`relative rounded-md overflow-hidden border text-left group transition-all ${
                    isAttached
                      ? 'border-indigo-600 opacity-50 cursor-not-allowed'
                      : 'border-slate-200 hover:border-indigo-400'
                  }`}
                >
                  <img src={asset.url} alt={asset.name} className="w-full h-16 object-cover" />
                  <div className="p-1 text-[10px] truncate text-slate-700 font-medium bg-white">
                    {asset.name}
                  </div>
                  {isAttached && (
                    <div className="absolute inset-0 bg-indigo-900/40 flex items-center justify-center text-white text-[10px] font-bold">
                      Attached
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Attached Media Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {media.map((item) => (
          <div
            key={item.id}
            className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 group"
          >
            <img src={item.url} alt={item.name} className="w-full h-24 object-cover" />
            <div className="p-1.5 bg-white text-[10px] flex items-center justify-between">
              <span className="truncate text-slate-600 font-medium">{item.name}</span>
              <span className="text-slate-400 font-mono">{(item.sizeBytes / 1024).toFixed(0)}KB</span>
            </div>
            <button
              type="button"
              onClick={() => handleRemove(item.id)}
              className="absolute top-1.5 right-1.5 bg-slate-900/80 hover:bg-rose-600 text-white p-1 rounded-full transition-colors"
              title="Remove media"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* Upload Trigger Button */}
        {media.length < maxCount && (
          <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-lg h-24 flex flex-col items-center justify-center gap-1 cursor-pointer bg-slate-50/50 hover:bg-indigo-50/30 transition-all text-slate-500 hover:text-indigo-600">
            <input type="file" accept="image/*" onChange={handleCustomUpload} className="hidden" />
            <Plus className="w-5 h-5 text-slate-400" />
            <span className="text-xs font-semibold">Upload Image</span>
            <span className="text-[10px] text-slate-400">JPG, PNG up to 10MB</span>
          </label>
        )}
      </div>
    </div>
  );
};
