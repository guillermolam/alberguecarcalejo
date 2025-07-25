use image::GrayImage;
use leptess::{LepTess, Variable};
use crate::models::DocumentData;

pub struct OCREngine {
    tesseract: LepTess,
}

impl OCREngine {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let mut tesseract = LepTess::new(None, "spa")?;
        
        // Configure Tesseract for document scanning
        tesseract.set_variable(Variable::TesseditPagesegMode, "1")?; // Automatic page segmentation with OSD
        tesseract.set_variable(Variable::TesseditOcrEngineMode, "1")?; // LSTM only
        tesseract.set_variable(Variable::TesseditCharWhitelist, 
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789áéíóúñüÁÉÍÓÚÑÜ -.,/")?;
        
        Ok(Self { tesseract })
    }
    
    pub fn extract_text(&mut self, image: &GrayImage) -> Result<String, Box<dyn std::error::Error>> {
        // Convert image to format expected by Tesseract
        let (width, height) = image.dimensions();
        let image_data: Vec<u8> = image.pixels().map(|p| p[0]).collect();
        
        self.tesseract.set_image(&image_data, width as i32, height as i32, 1, width as i32)?;
        
        Ok(self.tesseract.get_utf8_text()?)
    }
    
    pub fn extract_text_with_confidence(&mut self, image: &GrayImage) -> Result<(String, f32), Box<dyn std::error::Error>> {
        let text = self.extract_text(image)?;
        let confidence = self.tesseract.mean_text_conf() as f32 / 100.0;
        
        Ok((text, confidence))
    }
    
    pub fn extract_regions(&mut self, image: &GrayImage) -> Result<Vec<TextRegion>, Box<dyn std::error::Error>> {
        let (width, height) = image.dimensions();
        let image_data: Vec<u8> = image.pixels().map(|p| p[0]).collect();
        
        self.tesseract.set_image(&image_data, width as i32, height as i32, 1, width as i32)?;
        
        let boxes = self.tesseract.get_component_images(leptess::capi::TessPageIteratorLevel_RIL_WORD, true)?;
        let mut regions = Vec::new();
        
        for (image_data, bbox, _) in boxes {
            if let Ok(text) = std::str::from_utf8(&image_data) {
                regions.push(TextRegion {
                    text: text.to_string(),
                    bbox,
                    confidence: self.tesseract.mean_text_conf() as f32 / 100.0,
                });
            }
        }
        
        Ok(regions)
    }
}

#[derive(Debug)]
pub struct TextRegion {
    pub text: String,
    pub bbox: leptess::capi::Boxa,
    pub confidence: f32,
}

impl Default for OCREngine {
    fn default() -> Self {
        Self::new().expect("Failed to initialize OCR engine")
    }
}