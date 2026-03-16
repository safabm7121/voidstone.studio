import sharp from 'sharp';

export class ImageProcessor {
    /**
     * Clean base64 image by removing metadata and optimizing
     */
    static async cleanBase64Image(base64String: string): Promise<string> {
        try {
            // Remove data:image prefix if present
            const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            
            if (!matches || matches.length !== 3) {
                throw new Error('Invalid base64 image format');
            }

            const imageType = matches[1];
            const base64Data = matches[2];
            const imageBuffer = Buffer.from(base64Data, 'base64');

            // Process with sharp - this automatically strips metadata
            let processedBuffer: Buffer;
            
            if (imageType.includes('jpeg') || imageType.includes('jpg')) {
                processedBuffer = await sharp(imageBuffer)
                    .jpeg({ 
                        quality: 85,           // Good balance of quality/size
                        progressive: true,      // Better for web loading
                        mozjpeg: true           // Better compression
                    })
                    .toBuffer();
            } else if (imageType.includes('png')) {
                processedBuffer = await sharp(imageBuffer)
                    .png({ 
                        compressionLevel: 9,    // Maximum compression
                        palette: true,          // Reduce colors if possible
                        quality: 85
                    })
                    .toBuffer();
            } else if (imageType.includes('webp')) {
                processedBuffer = await sharp(imageBuffer)
                    .webp({ 
                        quality: 85,
                        effort: 6               // Compression effort
                    })
                    .toBuffer();
            } else {
                // Default to JPEG for other formats
                processedBuffer = await sharp(imageBuffer)
                    .jpeg({ quality: 85 })
                    .toBuffer();
            }

            // Convert back to base64 with proper prefix
            const processedBase64 = `data:${imageType};base64,${processedBuffer.toString('base64')}`;
            
            // Log size reduction
            const originalSize = (imageBuffer.length / 1024).toFixed(2);
            const newSize = (processedBuffer.length / 1024).toFixed(2);
            console.log(`📸 Image optimized: ${originalSize}KB → ${newSize}KB (${((1 - processedBuffer.length/imageBuffer.length)*100).toFixed(1)}% reduction)`);
            
            return processedBase64;
            
        } catch (error) {
            console.error('Error processing image:', error);
            // Return original if processing fails (don't break the upload)
            return base64String;
        }
    }

    /**
     * Process multiple images
     */
    static async cleanMultipleImages(images: string[]): Promise<string[]> {
        const processedImages = await Promise.all(
            images.map(img => this.cleanBase64Image(img))
        );
        return processedImages;
    }

    /**
     * Get image stats
     */
    static async getImageStats(base64String: string): Promise<any> {
        try {
            const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (!matches) return null;
            
            const buffer = Buffer.from(matches[2], 'base64');
            const metadata = await sharp(buffer).metadata();
            
            return {
                format: metadata.format,
                width: metadata.width,
                height: metadata.height,
                sizeKB: (buffer.length / 1024).toFixed(2),
                hasMetadata: !!metadata.exif || !!metadata.icc || !!metadata.iptc
            };
        } catch (error) {
            return null;
        }
    }
}
