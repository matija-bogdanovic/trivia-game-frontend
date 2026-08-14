'use client';

import React, { useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { useT } from '@/app/lib/i18n';
import { CropPixels, cropToAvatarDataUrl } from '@/app/helpers/avatar';

interface AvatarCropperProps {
  /** data URL of the original picked image */
  imageSrc: string;
  onDone: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

/**
 * Modal with drag + zoom and a circular mask matching the round avatar.
 *
 * react-easy-crop reports the selection back in *source-image* pixels via
 * onCropComplete, which is what cropToAvatarDataUrl needs — no scaling from
 * the displayed size to the natural size to get wrong.
 */
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
    <div
      className="arena-root fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-title"
    >
      <div className="flex w-full max-w-md flex-col gap-4 border border-white/[0.07] bg-arena-800 p-6">
        <h3
          id="crop-title"
          className="text-[11px] font-bold tracking-[0.25em] text-arena-200 uppercase"
        >
          {t('profile.cropTitle')}
        </h3>

        <div className="relative h-72 w-full overflow-hidden bg-arena-950">
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

        <label
          htmlFor="avatar-zoom"
          className="flex items-center gap-3 text-[10px] tracking-[0.2em] text-arena-300 uppercase"
        >
          {t('profile.zoom')}
          <input
            id="avatar-zoom"
            type="range"
            min={1}
            max={4}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 cursor-pointer accent-gold"
          />
        </label>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="cursor-pointer border border-white/20 px-5 py-3 text-[10px] tracking-[0.2em] text-white uppercase transition-colors hover:bg-arena-700 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none disabled:opacity-50"
          >
            {t('profile.cancel')}
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={busy || !cropPixels}
            className={`px-6 py-3 text-[10px] font-bold tracking-[0.2em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
              busy || !cropPixels
                ? 'cursor-not-allowed bg-arena-700 text-arena-400'
                : 'cursor-pointer bg-gold text-arena-950 hover:bg-gold-light'
            }`}
          >
            {busy ? '…' : t('profile.apply')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AvatarCropper;
