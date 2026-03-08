import { useRef, useCallback, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Camera, Upload, Loader2, AlertCircle, ScanLine,
  ArrowLeft, Circle, PackageSearch,
} from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { cn } from '@/shared/utils/cn';
import type { UseReceiptScanner, ScannedItem } from '../hooks/useReceiptScanner';

const CATEGORIES = ['Produce', 'Dairy', 'Bakery', 'Beverages', 'Dry Goods', 'Oils', 'Other'];
const UNITS = ['units', 'kg', 'g', 'L', 'ml', 'bunches', 'loaves', 'bags'];

type View = 'upload' | 'camera' | 'review';

interface Props {
  scanner: UseReceiptScanner;
}

export function ReceiptScannerModal({ scanner }: Props) {
  const {
    isOpen,
    isScanning,
    error,
    noItemsFound,
    scannedItems,
    closeScanner,
    scanFile,
    updateItem,
    toggleItem,
    toggleAll,
    confirmAndAdd,
    openScanner,
  } = scanner;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [view, setView] = useState<View>('upload');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  // Advance to review as soon as items arrive
  useEffect(() => {
    if (scannedItems.length > 0) {
      setView('review');
    }
  }, [scannedItems]);

  // Reset everything when the modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setView('upload');
      setCameraError(null);
      setCapturing(false);
    } else {
      stopCamera();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  const openCamera = useCallback(async () => {
    setCameraError(null);
    setView('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Camera unavailable';
      setCameraError(
        msg === 'Permission denied'
          ? 'Camera access was denied. Allow camera access in your browser settings, then retry.'
          : msg
      );
    }
  }, []);

  const backToUpload = useCallback(() => {
    stopCamera();
    setCameraError(null);
    setView('upload');
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setCapturing(true);
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext('2d')?.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        setCapturing(false);
        if (!blob) return;
        stopCamera();
        const file = new File([blob], `receipt-${Date.now()}.jpg`, { type: 'image/jpeg' });
        scanFile(file);
      },
      'image/jpeg',
      0.92
    );
  }, [scanFile]);

  const handleFile = useCallback(
    (file: File | null | undefined) => { if (file) scanFile(file); },
    [scanFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); },
    [handleFile]
  );

  const selectedCount = scannedItems.filter((i) => i.selected).length;
  const allSelected = scannedItems.length > 0 && scannedItems.every((i) => i.selected);

  if (!isOpen) return null;

  const title = view === 'camera' ? 'Take Photo' : view === 'review' ? 'Review Items' : 'Scan Receipt';

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-forest/30 backdrop-blur-sm" onClick={closeScanner} aria-hidden="true" />

      <div
        className={cn(
          'relative z-10 w-full rounded-xl bg-cream shadow-xl flex flex-col overflow-hidden',
          view === 'review' ? 'max-w-3xl max-h-[90vh]' : 'max-w-md'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-forest/10 shrink-0">
          <div className="flex items-center gap-2">
            {view === 'camera' && (
              <button onClick={backToUpload} className="mr-1 text-forest/50 hover:text-forest transition-colors" aria-label="Back">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <ScanLine className="h-5 w-5 text-forest/60" />
            <div>
              <h2 className="text-lg font-semibold text-forest">{title}</h2>
              {view === 'review' && (
                <p className="text-xs text-forest/50 mt-0.5">
                  Found {scannedItems.length} item{scannedItems.length !== 1 ? 's' : ''} — edit anything before confirming
                </p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={closeScanner} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-auto">

          {/* ════ Upload view ════ */}
          {view === 'upload' && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={openCamera}
                  disabled={isScanning}
                  className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-forest/20 bg-cream hover:bg-forest/5 py-8 text-forest transition-colors disabled:opacity-50"
                >
                  <Camera className="h-8 w-8 text-forest/50" />
                  <span className="text-sm font-medium">Take Photo</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanning}
                  className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-forest/20 bg-cream hover:bg-forest/5 py-8 text-forest transition-colors disabled:opacity-50"
                >
                  <Upload className="h-8 w-8 text-forest/50" />
                  <span className="text-sm font-medium">Upload Image</span>
                </button>
              </div>

              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="rounded-xl border-2 border-dashed border-forest/15 bg-forest/[0.02] py-8 text-center text-sm text-forest/40 hover:border-forest/30 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                or drag and drop a receipt image here
              </div>

              {/* Scanning in progress */}
              {isScanning && (
                <div className="flex items-center justify-center gap-3 py-5 rounded-xl bg-forest/[0.03]">
                  <Loader2 className="h-5 w-5 animate-spin text-forest/60" />
                  <span className="text-sm font-medium text-forest/70">Reading receipt…</span>
                </div>
              )}

              {/* No items found after a successful scan */}
              {!isScanning && noItemsFound && (
                <div className="flex flex-col items-center gap-3 py-5 rounded-xl border border-amber-200 bg-amber-50 text-center">
                  <PackageSearch className="h-8 w-8 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">No items recognised</p>
                    <p className="text-xs text-amber-600 mt-1 max-w-xs mx-auto">
                      The receipt was read but no product lines could be parsed. Try a clearer photo with better lighting.
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={openScanner}>
                    Try again
                  </Button>
                </div>
              )}

              {/* OCR / network error */}
              {!isScanning && error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-red-700">{error}</p>
                    <button
                      onClick={openScanner}
                      className="mt-1 text-xs font-medium text-red-600 hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              )}

              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])} />
            </div>
          )}

          {/* ════ Camera view ════ */}
          {view === 'camera' && (
            <div className="p-4 space-y-3">
              {cameraError ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <AlertCircle className="h-10 w-10 text-red-400" />
                  <p className="text-sm text-red-600 max-w-xs">{cameraError}</p>
                  <Button variant="secondary" size="sm" onClick={openCamera}>Retry</Button>
                </div>
              ) : (
                <>
                  <div className="relative overflow-hidden rounded-xl bg-black aspect-video">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <div className="absolute inset-4 pointer-events-none">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white/70 rounded-tl" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white/70 rounded-tr" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white/70 rounded-bl" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white/70 rounded-br" />
                    </div>
                  </div>
                  <p className="text-center text-xs text-forest/50">
                    Point your camera at the receipt, then tap the shutter button
                  </p>
                  {isScanning && (
                    <div className="flex items-center justify-center gap-2 text-forest/60">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Reading receipt…</span>
                    </div>
                  )}
                  <div className="flex justify-center pt-2 pb-1">
                    <button
                      onClick={capturePhoto}
                      disabled={capturing || isScanning}
                      aria-label="Capture photo"
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-forest text-cream shadow-lg hover:bg-forest/90 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {capturing || isScanning
                        ? <Loader2 className="h-6 w-6 animate-spin" />
                        : <Circle className="h-8 w-8 fill-cream" />
                      }
                    </button>
                  </div>
                </>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {/* ════ Review view ════ */}
          {view === 'review' && (
            <div className="px-6 pt-4 pb-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-forest/50">
                  {selectedCount} of {scannedItems.length} selected
                </span>
                <button
                  onClick={() => toggleAll(!allSelected)}
                  className="text-xs font-medium text-forest/60 hover:text-forest transition-colors"
                >
                  {allSelected ? 'Deselect all' : 'Select all'}
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-forest/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-forest/[0.04] text-left">
                      <th className="py-2.5 pl-3 pr-2 w-8"></th>
                      <th className="py-2.5 px-2 font-medium text-forest/60 text-xs">Name</th>
                      <th className="py-2.5 px-2 font-medium text-forest/60 text-xs">Category</th>
                      <th className="py-2.5 px-2 font-medium text-forest/60 text-xs w-20">Qty</th>
                      <th className="py-2.5 px-2 font-medium text-forest/60 text-xs w-24">Unit</th>
                      <th className="py-2.5 px-2 font-medium text-forest/60 text-xs w-32">Date Added</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-forest/5">
                    {scannedItems.map((item) => (
                      <ScannedItemRow
                        key={item.id}
                        item={item}
                        onToggle={() => toggleItem(item.id)}
                        onUpdate={(updates) => updateItem(item.id, updates)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer — review only ── */}
        {view === 'review' && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-forest/10 shrink-0">
            <button
              onClick={backToUpload}
              className="text-sm text-forest/50 hover:text-forest transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Scan another
            </button>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={closeScanner}>Cancel</Button>
              <Button
                onClick={confirmAndAdd}
                disabled={selectedCount === 0}
                className="bg-green-600 hover:bg-green-700 text-white border-0 disabled:opacity-50"
              >
                Add {selectedCount} item{selectedCount !== 1 ? 's' : ''} to Inventory
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

// ─── Editable row ─────────────────────────────────────────────────────────────

interface RowProps {
  item: ScannedItem;
  onToggle: () => void;
  onUpdate: (updates: Partial<ScannedItem>) => void;
}

function ScannedItemRow({ item, onToggle, onUpdate }: RowProps) {
  const cell = 'w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-sm text-forest focus:outline-none focus:border-forest/30 focus:bg-white transition-colors';

  return (
    <tr className={cn('hover:bg-forest/[0.02] transition-colors', !item.selected && 'opacity-40')}>
      <td className="py-1.5 pl-3 pr-2">
        <input type="checkbox" checked={item.selected} onChange={onToggle}
          className="h-4 w-4 rounded accent-forest cursor-pointer" />
      </td>
      <td className="py-1 px-2">
        <input type="text" value={item.name} onChange={(e) => onUpdate({ name: e.target.value })}
          className={cn(cell, 'min-w-[130px]')} />
      </td>
      <td className="py-1 px-2">
        <select value={item.category} onChange={(e) => onUpdate({ category: e.target.value })}
          className={cn(cell, 'w-full')}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </td>
      <td className="py-1 px-2">
        <input type="number" min="0.01" step="any" value={item.quantity}
          onChange={(e) => onUpdate({ quantity: parseFloat(e.target.value) || 1 })}
          className={cn(cell, 'w-16')} />
      </td>
      <td className="py-1 px-2">
        <select value={item.unit} onChange={(e) => onUpdate({ unit: e.target.value })}
          className={cn(cell, 'w-full')}>
          {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </td>
      <td className="py-1 px-2">
        <input type="date" value={item.date_added}
          onChange={(e) => onUpdate({ date_added: e.target.value })}
          className={cn(cell, 'w-32')} />
      </td>
    </tr>
  );
}
