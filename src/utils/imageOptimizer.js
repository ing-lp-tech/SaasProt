/**
 * Compresses and resizes an image file using the browser's Canvas API.
 * Converts to WebP format for optimal size/quality ratio.
 * 
 * @param {File} file - The original image file.
 * @param {Object} options - Compression options.
 * @param {number} [options.maxWidth=1024] - Maximum width or height.
 * @param {number} [options.quality=0.8] - specific query quality (0 to 1).
 * @returns {Promise<File>} - The compressed file.
 */
export const compressImage = (file, { maxWidth = 1024, quality = 0.8 } = {}) => {
    return new Promise((resolve, reject) => {
        // Skip compression for SVGs
        if (file.type === 'image/svg+xml') {
            resolve(file);
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions respecting aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxWidth) {
                        width = Math.round((width * maxWidth) / height);
                        height = maxWidth;
                    }
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to WebP
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error("Image compression failed"));
                            return;
                        }

                        // Create new file with .webp extension
                        const newName = file.name.replace(/\.[^.]+$/, "") + ".webp";
                        const compressedFile = new File([blob], newName, {
                            type: "image/webp",
                            lastModified: Date.now(),
                        });

                        resolve(compressedFile);
                    },
                    "image/webp",
                    quality
                );
            };

            img.onerror = (err) => reject(err);
        };

        reader.onerror = (err) => reject(err);
    });
};
