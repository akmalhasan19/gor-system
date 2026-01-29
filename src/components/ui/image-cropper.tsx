import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/lib/utils/image-utils';
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';

// Custom Slider since we might not have one in UI components yet, or to keep it simple self-contained
const ZoomSlider = ({ value, min, max, step, onChange, className }: any) => (
    <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black ${className}`}
    />
);

interface ImageCropperProps {
    imageSrc: string;
    onCropComplete: (croppedBlob: Blob) => void;
    onCancel: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCropComplete, onCancel }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        setIsProcessing(true);
        try {
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            onCropComplete(croppedImageBlob);
        } catch (e) {
            console.error(e);
            toast.error('Gagal memotong gambar');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-xl overflow-hidden border-2 border-black shadow-neo-lg flex flex-col h-[500px]">
                {/* Header */}
                <div className="p-4 border-b-2 border-black flex justify-between items-center bg-gray-50">
                    <h3 className="font-black uppercase italic text-lg">Sesuaikan Foto</h3>
                    <button onClick={onCancel} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Cropper Area */}
                <div className="relative flex-1 bg-gray-900 overflow-hidden">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1} // Square aspect ratio for thumbnails
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteHandler}
                        onZoomChange={onZoomChange}
                        showGrid={true}
                    />
                </div>

                {/* Controls */}
                <div className="p-4 bg-white border-t-2 border-black space-y-4">
                    <div className="flex items-center gap-4">
                        <ZoomOut size={20} className="text-gray-500" />
                        <ZoomSlider
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            onChange={(val: number) => setZoom(val)}
                        />
                        <ZoomIn size={20} className="text-gray-500" />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3 font-black uppercase border-2 border-black hover:bg-gray-100 transition-colors rounded-lg"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isProcessing}
                            className="flex-1 py-3 font-black uppercase bg-black text-white border-2 border-black hover:bg-gray-800 transition-all rounded-lg flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isProcessing ? 'Menyimpan...' : (
                                <>
                                    <Check size={18} strokeWidth={3} />
                                    Simpan
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
