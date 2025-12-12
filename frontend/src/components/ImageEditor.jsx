import React, { useState, useRef, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { API_URL, processImage } from '../api/api';

// Helper to create cropped image from canvas
const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous'); // needed to avoid contamination
        image.src = url;
    });

export default function ImageEditor({ imageUrl, imageId, onSave, onCancel }) {
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [aspect, setAspect] = useState(16 / 9);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [mode, setMode] = useState('crop'); // 'crop' | 'redact' | 'watermark' | 'ai'
    const [isProcessing, setIsProcessing] = useState(false);

    // Canvas for Redaction/Watermarking
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [editHistory, setEditHistory] = useState([]); // Array of strict Image data blobs/urls to undo? Or simpler: canvas snapshots.

    const addToHistory = () => {
        let state;
        if (mode === 'crop') {
            state = imageSrc;
        } else {
            if (canvasRef.current) {
                try {
                    state = canvasRef.current.toDataURL('image/jpeg');
                } catch (e) {
                    console.warn("Cannot save history state (tainted canvas?):", e);
                    state = imageSrc;
                }
            } else {
                state = imageSrc;
            }
        }
        setEditHistory(prev => [...prev, state]);
    };

    const handleUndo = () => {
        if (editHistory.length === 0) return;
        const lastState = editHistory[editHistory.length - 1];
        setEditHistory(prev => prev.slice(0, -1));
        setImageSrc(lastState);
    };

    // Load initial image
    useEffect(() => {
        setImageSrc(imageUrl);
    }, [imageUrl]);

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    // Apply Crop and switch to 'Effects' mode (Redact/Watermark)
    const applyCrop = async () => {
        addToHistory();
        try {
            const image = await createImage(imageSrc);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = croppedAreaPixels.width;
            canvas.height = croppedAreaPixels.height;

            ctx.drawImage(
                image,
                croppedAreaPixels.x,
                croppedAreaPixels.y,
                croppedAreaPixels.width,
                croppedAreaPixels.height,
                0,
                0,
                croppedAreaPixels.width,
                croppedAreaPixels.height
            );

            const croppedImageBase64 = canvas.toDataURL('image/jpeg');
            setImageSrc(croppedImageBase64); // Update source to be the cropped version
            setMode('effects'); // Switch mode
            setZoom(1);
        } catch (e) {
            console.error(e);
        }
    };

    // Initialize Canvas when entering 'effects' or 'ai' mode
    useEffect(() => {
        if ((mode === 'effects' || mode === 'ai') && canvasRef.current && imageSrc) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const image = new Image();
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = imageSrc;
            image.onload = () => {
                canvas.width = image.width;
                canvas.height = image.height;
                ctx.drawImage(image, 0, 0);
            }
        }
    }, [mode, imageSrc]);



    const handleWatermark = () => {
        if (!canvasRef.current) return;
        addToHistory();
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = 'white';
        ctx.font = `bold ${canvas.width * 0.05}px Arial`;
        ctx.fillText('MUHABİR', canvas.width - (canvas.width * 0.25), canvas.height - (canvas.height * 0.05));
        ctx.restore();
    };

    // Blur Logic
    const startDrawing = (e) => {
        if (mode !== 'effects') return;
        addToHistory();
        setIsDrawing(true);
        blurOnCanvas(e);
    }
    const stopDrawing = () => setIsDrawing(false);
    const draw = (e) => {
        if (!isDrawing) return;
        blurOnCanvas(e);
    }

    const blurOnCanvas = (e) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
        const radius = 30; // Brush size

        // Simple 'pixelate' or fill for now to simulate blur
        // Real blur requires getting image data, processing, putting back.
        // For 'Redaction' simple opaque block or pixelation is standard.
        // Let's do a strong Blur effect by redrawing that region with filter.

        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.filter = 'blur(10px)';
        ctx.drawImage(canvas, 0, 0);
        ctx.restore();
    };

    const handleAIAction = async (action) => {
        if (!imageId) return;
        addToHistory();
        try {
            setIsProcessing(true);
            const blob = await processImage(imageId, action);

            // Create object URL for the result blob
            const newUrl = URL.createObjectURL(blob);

            // Note: In a real app we might want to revoke old object URLs to avoid leaks
            // but here we just set it as the new source.

            // Preload to ensure it's ready
            await createImage(newUrl);
            setImageSrc(newUrl);

            // Reset to crop mode standard view
            setMode('crop');
            setZoom(1);
        } catch (e) {
            console.error(e);
            alert("AI Processing Failed: " + (e.response?.data?.detail || e.message));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSave = async () => {
        // If in crop mode, apply crop first (conceptual check)
        // If in effects mode, get canvas Blob
        let finalBlob;

        if (mode === 'crop') {
            // Generate crop directly
            // Re-run apply crop logic effectively or force user to click "Apply Crop"
            // For simplicity, let's say "Save" in crop mode saves the crop.
            const image = await createImage(imageSrc);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = croppedAreaPixels.width;
            canvas.height = croppedAreaPixels.height;
            ctx.drawImage(image, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);

            finalBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
        } else {
            // Effects mode
            finalBlob = await new Promise(resolve => canvasRef.current.toBlob(resolve, 'image/jpeg', 0.9));
        }

        onSave(finalBlob);
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column' }}>
            {/* Top Tabs */}
            <div style={{ display: 'flex', background: '#000', borderBottom: '1px solid #333', justifyContent: 'space-between', alignItems: 'center', paddingRight: '1rem' }}>
                <div style={{ display: 'flex', flex: 1 }}>
                    {['crop', 'effects', 'ai'].map(m => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                background: mode === m ? '#111' : 'transparent',
                                color: mode === m ? 'cyan' : '#aaa',
                                border: 'none',
                                borderBottom: mode === m ? '2px solid cyan' : 'none',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                maxWidth: '150px'
                            }}
                        >
                            {m === 'ai' ? 'AI Tools' : m}
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleUndo}
                    disabled={editHistory.length === 0}
                    style={{
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: editHistory.length === 0 ? '#555' : 'white',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        cursor: editHistory.length === 0 ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                    title="Undo Last Action"
                >
                    ↩️ Undo ({editHistory.length})
                </button>
            </div>

            {/* Toolbar */}
            <div style={{ padding: '0.75rem', display: 'flex', gap: '1rem', justifyContent: 'center', background: '#111', borderBottom: '1px solid #222', flexWrap: 'wrap' }}>
                {mode === 'crop' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {[
                            { label: '16:9', val: 16 / 9 },
                            { label: '1:1', val: 1 },
                            { label: '9:16', val: 9 / 16 }
                        ].map(opt => (
                            <button
                                key={opt.label}
                                onClick={() => setAspect(opt.val)}
                                style={{
                                    background: aspect === opt.val ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                    border: aspect === opt.val ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                                    color: aspect === opt.val ? '#38bdf8' : '#aaa',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                        <div style={{ width: '1px', background: '#333', margin: '0 8px' }} />
                        <button
                            onClick={applyCrop}
                            style={{
                                background: 'rgba(56, 189, 248, 0.1)',
                                border: '1px solid rgba(56, 189, 248, 0.2)',
                                color: '#38bdf8',
                                padding: '6px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)' }}
                        >
                            <span>✂️</span> Apply Crop
                        </button>
                    </div>
                )}
                {mode === 'effects' && (
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <button
                            onClick={handleWatermark}
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#e2e8f0',
                                padding: '6px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)' }}
                        >
                            <span>©️</span> Add Watermark
                        </button>

                        <div style={{
                            color: '#94a3b8',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'rgba(0,0,0,0.3)',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <span>👆</span> Click & Drag to Blur
                        </div>
                    </div>
                )}
                {mode === 'ai' && (
                    <>
                        {isProcessing ? (
                            <span style={{ color: 'cyan', animation: 'pulse 1s infinite' }}>Processing...</span>
                        ) : (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => handleAIAction('remove_bg')}
                                    style={{
                                        background: 'rgba(56, 189, 248, 0.1)',
                                        border: '1px solid rgba(56, 189, 248, 0.2)',
                                        color: '#38bdf8',
                                        padding: '6px 16px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        transition: 'all 0.2s',
                                        fontSize: '0.9rem'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)' }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)' }}
                                >
                                    <span>✂️</span> Remove BG
                                </button>
                                <button
                                    onClick={() => handleAIAction('smart_expand')}
                                    style={{
                                        background: 'rgba(168, 85, 247, 0.1)',
                                        border: '1px solid rgba(168, 85, 247, 0.2)',
                                        color: '#a855f7',
                                        padding: '6px 16px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        transition: 'all 0.2s',
                                        fontSize: '0.9rem'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)' }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)' }}
                                >
                                    <span>↔️</span> Smart Expand
                                </button>
                                <button
                                    onClick={() => handleAIAction('enhance')}
                                    style={{
                                        background: 'rgba(34, 197, 94, 0.1)',
                                        border: '1px solid rgba(34, 197, 94, 0.2)',
                                        color: '#22c55e',
                                        padding: '6px 16px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        transition: 'all 0.2s',
                                        fontSize: '0.9rem'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)' }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)' }}
                                >
                                    <span>✨</span> Enhance
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Editor Area */}
            <div style={{ flex: 1, position: 'relative', background: '#050505', overflow: 'hidden' }}>
                {mode === 'crop' && (
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                    />
                )}

                {(mode === 'effects' || mode === 'ai') && (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {/* In AI mode, we just show the image or canvas? 
                            If we act on the image, we reload it. 
                            Ideally we show the 'result' here.
                            Since 'imageSrc' is updated, we can just show an Image tag or reuse Canvas logic if we want to layer effects.
                            Let's use the Canvas ref approach so transitions are smooth if user switches to effects.
                         */}
                        <canvas
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            style={{ maxHeight: '90vh', maxWidth: '90vw', boxShadow: '0 0 20px rgba(0,0,0,0.5)', cursor: mode === 'effects' ? 'crosshair' : 'default' }}
                        />
                    </div>
                )}
            </div>

            {/* Footer */}
            <div style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: '#000', borderTop: '1px solid #222' }}>
                <button onClick={onCancel} style={{ color: '#aaa' }}>Cancel</button>
                <button onClick={handleSave} style={{ background: 'cyan', color: 'black', padding: '0.5rem 2rem', fontWeight: 'bold', borderRadius: '4px', border: 'none' }}>Save Result</button>
            </div>
        </div>
    );
}
