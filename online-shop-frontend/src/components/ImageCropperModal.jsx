import React, { useState, useRef, useEffect } from 'react';

const ImageCropperModal = ({ imageFile, isOpen, onClose, onSave }) => {
    const [image, setImage] = useState(null);
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // UI State
    const [cropSize, setCropSize] = useState(300); // Dynamic crop window size

    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    // Constants
    const OUTPUT_SIZE = 800; // High res output

    // Load image from file & Init Layout
    useEffect(() => {
        if (imageFile && isOpen) {
            const img = new Image();
            img.src = URL.createObjectURL(imageFile);
            img.onload = () => {
                setImage(img);
                // Calculate initial scale to fit image
                if (containerRef.current) {
                    const containerW = containerRef.current.clientWidth;
                    const containerH = containerRef.current.clientHeight;

                    // Determine crop box size based on container (max 400, min 200, or 80% of container)
                    const targetSize = Math.min(400, Math.min(containerW, containerH) * 0.8);
                    setCropSize(targetSize);

                    // Fit image into the crop box initially
                    const scaleW = targetSize / img.width;
                    const scaleH = targetSize / img.height;
                    const fitScale = Math.max(scaleW, scaleH); // Fill the box

                    setScale(fitScale);
                    setRotation(0);
                    setOffset({ x: 0, y: 0 });
                }
            };
        }
    }, [imageFile, isOpen]);

    // Handle Dragging
    const handleMouseDown = (e) => {
        setIsDragging(true);
        // Supports touch and mouse
        const clientX = e.clientX || e.touches?.[0].clientX;
        const clientY = e.clientY || e.touches?.[0].clientY;
        setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        const clientX = e.clientX || e.touches?.[0].clientX;
        const clientY = e.clientY || e.touches?.[0].clientY;

        setOffset({
            x: clientX - dragStart.x,
            y: clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Draw Canvas (Preview)
    useEffect(() => {
        if (!image || !canvasRef.current || !containerRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const container = containerRef.current;

        // Match canvas size to container
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Clear Background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#111827'; // Dark gray/black bg
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Save context for image transform
        ctx.save();

        // Translate to center + user offset
        ctx.translate(centerX + offset.x, centerY + offset.y);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(scale, scale);

        // Draw Image centered at origin
        // Draw image with smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(image, -image.width / 2, -image.height / 2);

        ctx.restore();

        // Overlay: Darken area outside crop box
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        const boxHalf = cropSize / 2;

        // Top
        ctx.fillRect(0, 0, canvas.width, centerY - boxHalf);
        // Bottom
        ctx.fillRect(0, centerY + boxHalf, canvas.width, canvas.height - (centerY + boxHalf));
        // Left
        ctx.fillRect(0, centerY - boxHalf, centerX - boxHalf, cropSize);
        // Right
        ctx.fillRect(centerX + boxHalf, centerY - boxHalf, canvas.width - (centerX + boxHalf), cropSize);

        // Draw Crop Border (White Stroke)
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(centerX - boxHalf, centerY - boxHalf, cropSize, cropSize);

        // Grid lines (Rule of Thirds)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Vertical 1
        ctx.moveTo(centerX - boxHalf + cropSize / 3, centerY - boxHalf);
        ctx.lineTo(centerX - boxHalf + cropSize / 3, centerY + boxHalf);
        // Vertical 2
        ctx.moveTo(centerX - boxHalf + (cropSize * 2) / 3, centerY - boxHalf);
        ctx.lineTo(centerX - boxHalf + (cropSize * 2) / 3, centerY + boxHalf);
        // Horizontal 1
        ctx.moveTo(centerX - boxHalf, centerY - boxHalf + cropSize / 3);
        ctx.lineTo(centerX + boxHalf, centerY - boxHalf + cropSize / 3);
        // Horizontal 2
        ctx.moveTo(centerX - boxHalf, centerY - boxHalf + (cropSize * 2) / 3);
        ctx.lineTo(centerX + boxHalf, centerY - boxHalf + (cropSize * 2) / 3);
        ctx.stroke();

    }, [image, scale, rotation, offset, isOpen, cropSize]);

    const handleSave = () => {
        if (!image) return;

        // Create output canvas
        const outCanvas = document.createElement('canvas');
        outCanvas.width = OUTPUT_SIZE;
        outCanvas.height = OUTPUT_SIZE;
        const ctx = outCanvas.getContext('2d');

        // Fill white background (optional, for safety)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, outCanvas.width, outCanvas.height);

        // Map visible CROP_AREA to OUTPUT_SIZE
        // screen 'origin' relative to image center is (offset.x, offset.y)
        // visual scale is 'scale'

        const cx = outCanvas.width / 2;
        const cy = outCanvas.height / 2;

        // Scale factor: Output / VisibleCropBox
        const outputScaleFactor = OUTPUT_SIZE / cropSize;

        ctx.save();
        ctx.translate(cx + offset.x * outputScaleFactor, cy + offset.y * outputScaleFactor);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(scale * outputScaleFactor, scale * outputScaleFactor);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(image, -image.width / 2, -image.height / 2);
        ctx.restore();

        outCanvas.toBlob((blob) => {
            onSave(blob);
        }, 'image/jpeg', 0.80);
    };

    const handleReset = () => {
        if (!image) return;
        // Recalculate 'fit' logic same as load
        if (containerRef.current) {
            const targetSize = cropSize;
            const scaleW = targetSize / image.width;
            const scaleH = targetSize / image.height;
            const fitScale = Math.max(scaleW, scaleH);

            setScale(fitScale);
            setRotation(0);
            setOffset({ x: 0, y: 0 });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-5xl rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl h-[85vh]">

                {/* Canvas Area */}
                <div
                    ref={containerRef}
                    className="flex-1 bg-[#0f1218] relative cursor-move overflow-hidden flex items-center justify-center pattern-grid-lg"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={(e) => handleMouseDown(e)}
                    onTouchMove={(e) => handleMouseMove(e)}
                    onTouchEnd={handleMouseUp}
                >
                    <canvas ref={canvasRef} className="block w-full h-full pointer-events-none" />

                    {/* Floating Hint */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-xs bg-black/30 px-3 py-1 rounded-full pointer-events-none">
                        Drag to move • Scroll to zoom
                    </div>
                </div>

                {/* Controls Sidebar */}
                <div className="w-full md:w-[340px] p-8 flex flex-col border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 z-10">
                    <div className="mb-8">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Edit Image</h3>
                        <p className="text-sm text-gray-500 mt-1">Adjust your product image perfectly.</p>
                    </div>

                    <div className="space-y-8 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {/* Zoom Control */}
                        <div>
                            <div className="flex justify-between mb-3 text-sm font-semibold dark:text-gray-300">
                                <span>Zoom</span>
                                <span>{(scale * 100).toFixed(0)}%</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setScale(s => Math.max(0.1, s - 0.01))} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300">-</button>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="3"
                                    step="0.01"
                                    value={scale}
                                    onChange={(e) => setScale(parseFloat(e.target.value))}
                                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <button onClick={() => setScale(s => Math.min(3, s + 0.01))} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300">+</button>
                            </div>
                        </div>

                        {/* Rotate Control */}
                        <div>
                            <label className="block text-sm font-semibold mb-3 dark:text-gray-300">Rotation</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setRotation(r => r - 90)}
                                    className="py-3 px-4 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-white font-medium transition flex items-center justify-center gap-2"
                                >
                                    <span className="text-xl">↺</span> -90°
                                </button>
                                <button
                                    onClick={() => setRotation(r => r + 90)}
                                    className="py-3 px-4 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-white font-medium transition flex items-center justify-center gap-2"
                                >
                                    <span className="text-xl">↻</span> +90°
                                </button>
                            </div>
                            {/* Fine Rotation Slider? Optional */}
                        </div>

                        <button onClick={handleReset} className="text-sm text-blue-600 hover:underline font-medium self-start">
                            Reset to default
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-3">
                        <button
                            onClick={handleSave}
                            className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200/50 hover:bg-blue-700 hover:shadow-blue-200/80 hover:-translate-y-0.5 transition-all text-sm uppercase tracking-wide"
                        >
                            ✓ Apply & Save
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-3.5 bg-white border border-gray-200 dark:bg-transparent dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm uppercase tracking-wide"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ImageCropperModal;
