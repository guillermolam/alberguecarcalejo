use image::{DynamicImage, ImageBuffer, Luma};
use crate::models::DocumentType;

pub struct DocumentClassifier;

impl DocumentClassifier {
    pub fn classify(image: &DynamicImage, hint: Option<String>) -> DocumentType {
        // If we have a hint from the user, use it
        if let Some(hint) = hint {
            return DocumentType::from_string(&hint);
        }
        
        // Analyze image characteristics
        let (width, height) = (image.width(), image.height());
        let aspect_ratio = width as f32 / height as f32;
        
        // Convert to grayscale for analysis
        let gray_image = image.to_luma8();
        
        // Check for passport characteristics (MRZ lines, specific aspect ratio)
        if Self::detect_passport_features(&gray_image, aspect_ratio) {
            return DocumentType::Passport;
        }
        
        // Check for Spanish ID card characteristics
        if Self::detect_spanish_id_features(&gray_image, aspect_ratio) {
            // Try to distinguish between DNI and NIE by looking for specific patterns
            if Self::detect_nie_patterns(&gray_image) {
                return DocumentType::NieFront;
            } else {
                return DocumentType::DniFront;
            }
        }
        
        DocumentType::Other
    }
    
    fn detect_passport_features(image: &ImageBuffer<Luma<u8>, Vec<u8>>, aspect_ratio: f32) -> bool {
        // Passport aspect ratio is typically around 1.4 (width/height)
        if aspect_ratio < 1.2 || aspect_ratio > 1.6 {
            return false;
        }
        
        // Look for MRZ (Machine Readable Zone) at bottom
        let height = image.height();
        let mrz_region = height - (height / 4); // Bottom quarter
        
        // Count horizontal lines in MRZ area (simplified detection)
        let mut line_count = 0;
        for y in mrz_region..height {
            let mut consecutive_chars = 0;
            for x in 0..image.width() {
                let pixel = image.get_pixel(x, y)[0];
                if pixel < 128 { // Dark pixel (text)
                    consecutive_chars += 1;
                } else {
                    if consecutive_chars > 20 { // Likely a text line
                        line_count += 1;
                        break;
                    }
                    consecutive_chars = 0;
                }
            }
        }
        
        line_count >= 2 // Passport MRZ typically has 2 lines
    }
    
    fn detect_spanish_id_features(image: &ImageBuffer<Luma<u8>, Vec<u8>>, aspect_ratio: f32) -> bool {
        // Spanish ID cards have aspect ratio around 1.6 (width/height)
        if aspect_ratio < 1.4 || aspect_ratio > 1.8 {
            return false;
        }
        
        // Look for typical ID card layout patterns
        // This is a simplified check - in practice you'd look for:
        // - Photo region (square area)
        // - Text regions
        // - Specific color patterns (Spain flag colors)
        
        true // For now, assume it's a Spanish ID if aspect ratio matches
    }
    
    fn detect_nie_patterns(image: &ImageBuffer<Luma<u8>, Vec<u8>>) -> bool {
        // Look for NIE-specific text patterns
        // This would involve OCR on specific regions to look for "NIE" text
        // For now, return false to default to DNI
        false
    }
    
    pub fn needs_back_side(doc_type: &DocumentType) -> bool {
        matches!(doc_type, DocumentType::DniFront | DocumentType::NieFront)
    }
}