import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/productModel';
import { ImageProcessor } from '../utils/imageProcessor';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/voidstone_products?authSource=admin';

async function cleanupAllImages() {
    console.log('🚀 Starting image cleanup...');
    console.log('📦 Connecting to MongoDB...');
    
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get all products with images
        const products = await Product.find({ 
            images: { $exists: true, $ne: [] } 
        });
        
        console.log(`📊 Found ${products.length} products with images`);

        let totalOriginalSize = 0;
        let totalNewSize = 0;
        let processedCount = 0;
        let errorCount = 0;

        for (const product of products) {
            try {
                console.log(`\n🔄 Processing product: ${product.name} (${product._id})`);
                console.log(`   Original images: ${product.images.length}`);

                // Calculate original size
                for (const img of product.images) {
                    const matches = img.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                    if (matches) {
                        totalOriginalSize += Buffer.from(matches[2], 'base64').length;
                    }
                }

                // Clean images
                const cleanedImages = await ImageProcessor.cleanMultipleImages(product.images);
                
                // Calculate new size
                for (const img of cleanedImages) {
                    const matches = img.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                    if (matches) {
                        totalNewSize += Buffer.from(matches[2], 'base64').length;
                    }
                }

                // Update product
                product.images = cleanedImages;
                await product.save();
                
                processedCount++;
                console.log(`   ✅ Product updated successfully`);

            } catch (error) {
                console.error(`   ❌ Error processing product ${product._id}:`, error);
                errorCount++;
            }
        }

        // Calculate savings
        const originalMB = (totalOriginalSize / (1024 * 1024)).toFixed(2);
        const newMB = (totalNewSize / (1024 * 1024)).toFixed(2);
        const savings = ((1 - totalNewSize/totalOriginalSize) * 100).toFixed(1);

        console.log('\n' + '='.repeat(50));
        console.log('📊 CLEANUP SUMMARY');
        console.log('='.repeat(50));
        console.log(`✅ Products processed: ${processedCount}`);
        console.log(`❌ Errors: ${errorCount}`);
        console.log(`📦 Original size: ${originalMB} MB`);
        console.log(`📦 New size: ${newMB} MB`);
        console.log(`💰 Space saved: ${savings}%`);
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Script failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
    }
}

// Run the script
cleanupAllImages().catch(console.error);