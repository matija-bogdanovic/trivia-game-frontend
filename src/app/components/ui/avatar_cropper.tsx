'use client';

import React, { useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import Button from '@/app/components/general/button';
import { useT } from '@/app/lib/i18n';
import { CropPixels, cropToAvatarDataUrl } from '@/app/helpers/avatar';

interface AvatarCropperProps {
  /** data URL of the original picked image */
  imageSrc: string;
  onDone: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

/** modal with drag + zoom and a circular mask matching the round avatar */
function AvatarCropper({ imageSrc, onDone, onCancel }: AvatarCropperProps) {
  const { t } = useT();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropPixels, setCropPixels] = useState<CropPixels | null>(null);
  const [busy, setBusy] = useState(false);

  const apply = async () => {
    if (!cropPixels) return;
    setBusy(true);
    try {
      onDone(await cropToAvatarDataUrl(imageSrc, cropPixels));
    } catch (err) {
      console.error('Crop failed:', err);
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-30 bg-[rgba(0,0,0,0.6)] flex items-center justify-center p-4">
      <div className="bg-white rounded-md p-4 flex flex-col gap-4 w-full max-w-md">
        <h3 className="font-semibold">{t('profile.cropTitle')}</h3>
        <div className="relative w-full h-72 bg-gray-900 rounded overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_area: Area, pixels: Area) =>
              setCropPixels(pixels)
            }
          />
        </div>
        <label className="flex items-center gap-3 text-sm text-gray-600">
          {t('profile.zoom')}
          <input
            type="range"
            min={1}
            max={4}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1"
          />
        </label>
        <div className="flex gap-3 justify-end">
          <button
            className="px-4 py-2 rounded border border-gray-300 cursor-pointer"
            onClick={onCancel}
            disabled={busy}
          >
            {t('profile.cancel')}
          </button>
          <Button
            text={busy ? '…' : t('profile.apply')}
            onClick={apply}
            disabled={busy || !cropPixels}
          />
        </div>
      </div>
    </div>
  );
}

export default AvatarCropper;
