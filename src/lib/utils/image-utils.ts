"use client";

/**
 * Converts an image file to WebP format using Canvas API.
 * If the file is already WebP, returns it as-is.
 * 
 * @param file - The image file to convert
 * @param quality - WebP quality (0-1), default 0.85
 * @returns Promise<File> - The converted WebP file
 */
export async function convertToWebp(file: File, quality: number = 0.85): Promise<File> {
    // If already WebP, return as-is
    if (file.type === 'image/webp') {
        return file;
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
        }

        img.onload = () => {
            // Set canvas size to image size
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw image to canvas
            ctx.drawImage(img, 0, 0);

            // Convert to WebP blob
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Failed to convert image to WebP'));
                        return;
                    }

                    // Create new File from Blob with .webp extension
                    const originalName = file.name.replace(/\.[^/.]+$/, '');
                    const webpFile = new File([blob], `${originalName}.webp`, {
                        type: 'image/webp',
                        lastModified: Date.now(),
                    });

                    resolve(webpFile);
                },
                'image/webp',
                quality
            );
        };

        img.onerror = () => {
            reject(new Error('Failed to load image for conversion'));
        };

        // Load image from file
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Compresses and converts an image to WebP with optional max dimensions.
 * Useful for profile photos or thumbnails.
 * 
 * @param file - The image file to process
 * @param maxWidth - Maximum width (default 800)
 * @param maxHeight - Maximum height (default 800)
 * @param quality - WebP quality (0-1), default 0.85
 * @returns Promise<File> - The processed WebP file
 */
export async function compressAndConvertToWebp(
    file: File,
    maxWidth: number = 800,
    maxHeight: number = 800,
    quality: number = 0.85
): Promise<File> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
        }

        img.onload = () => {
            // Calculate new dimensions while maintaining aspect ratio
            let { width, height } = img;

            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            canvas.width = width;
            canvas.height = height;

            // Draw resized image
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to WebP blob
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Failed to convert image to WebP'));
                        return;
                    }

                    const originalName = file.name.replace(/\.[^/.]+$/, '');
                    const webpFile = new File([blob], `${originalName}.webp`, {
                        type: 'image/webp',
                        lastModified: Date.now(),
                    });

                    resolve(webpFile);
                },
                'image/webp',
                quality
            );
        };

        img.onerror = () => {
            reject(new Error('Failed to load image for conversion'));
        };

        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Creates a cropped image from a source URL and pixel crop data.
 * 
 * @param imageSrc - The source image URL
 * @param pixelCrop - The pixel crop data usually from react-easy-crop
 * @param quality - Output quality (0-1), default 0.9
 * @returns Promise<Blob> - The cropped image blob
 */
export async function getCroppedImg(
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number },
    quality: number = 0.9
): Promise<Blob> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('No 2d context');
    }

    // Set width to double the crop width for high resolution (optional, enables better quality on retina)
    // For now, let's keep it 1:1 to the crop
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                resolve(blob);
            },
            'image/webp',
            quality
        );
    });
}

const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous'); // needed to avoid CORS issues when downloading from external URL
        image.src = url;
    });
