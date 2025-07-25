//! document_parser.rs
//!
//! A production-ready module for parsing Spanish DNI front and back images.
//!
//! Front-side fields:
//! - Portrait picture crop
//! - Last name and second last name
//! - First name
//! - Gender
//! - Nationality
//! - Expiration date
//! - ID support number
//!
//! Back-side fields:
//! - Address (DOMICILIO)
//! - Town/Municipio
//! - State/Comunidad Autónoma
//! - ID support number (from MRZ)

use std::error::Error;

use image::{DynamicImage, GenericImageView};
use tesseract::{TessApi, TessInitError, PageSegMode};

/// Data extracted from the front side of a Spanish DNI
#[derive(Debug, Clone)]
pub struct SpanishIdFrontData {
    pub last_name: String,
    pub second_last_name: String,
    pub first_name: String,
    pub gender: String,
    pub nationality: String,
    pub expiration_date: String,
    pub id_support_number: String,
    pub picture: DynamicImage,
}

/// Data extracted from the back side of a Spanish DNI
#[derive(Debug, Clone)]
pub struct SpanishIdBackData {
    pub address: String,
    pub town: String,
    pub state: String,
    pub id_support_number: String,
}

/// Main parser for Spanish DNI documents
pub struct DocumentParser {
    ocr: TessApi,
}

impl DocumentParser {
    /// Initialize the parser with optional tessdata path and language code (e.g. "spa").
    pub fn new(tessdata_path: Option<&str>, lang: &str) -> Result<Self, TessInitError> {
        let mut api = TessApi::new(tessdata_path, lang)?;
        api.set_page_seg_mode(PageSegMode::SingleLine);
        Ok(DocumentParser { ocr: api })
    }

    /// Parse front-side fields from a Spanish DNI image
    pub fn parse_front(
        &mut self,
        image: &DynamicImage,
    ) -> Result<SpanishIdFrontData, Box<dyn Error>> {
        // 1. Portrait crop (left 30% × top 50%)
        let picture = crop_region(image, 0.00, 0.00, 0.30, 0.50);

        // 2. Last names (combined line) at roughly 35–75% width, 20–30% height
        let last_raw = self.ocr_text(&crop_region(image, 0.35, 0.20, 0.40, 0.10))?;
        let mut parts = last_raw.split_whitespace();
        let last_name = parts.next().unwrap_or_default().to_string();
        let second_last_name = parts.collect::<Vec<_>>().join(" ");

        // 3. First name at 35–75% width, 30–40% height
        let first_name = self.ocr_text(&crop_region(image, 0.35, 0.30, 0.40, 0.10))?;

        // 4. Gender at 35–50% width, 40–48% height
        let gender = self.ocr_text(&crop_region(image, 0.35, 0.40, 0.15, 0.08))?;

        // 5. Nationality at 50–75% width, 40–48% height
        let nationality = self.ocr_text(&crop_region(image, 0.50, 0.40, 0.25, 0.08))?;

        // 6. Expiration date at 50–75% width, 50–58% height
        let expiration_date = self.ocr_text(&crop_region(image, 0.50, 0.50, 0.25, 0.08))?;

        // 7. ID support number ("NÚM. SOPORT") at 35–75% width, 48–56% height
        let id_support_number = self.ocr_text(&crop_region(image, 0.35, 0.48, 0.40, 0.08))?;

        Ok(SpanishIdFrontData {
            last_name,
            second_last_name,
            first_name,
            gender,
            nationality,
            expiration_date,
            id_support_number,
            picture,
        })
    }

    /// Parse back-side fields from a Spanish DNI image
    pub fn parse_back(
        &mut self,
        image: &DynamicImage,
    ) -> Result<SpanishIdBackData, Box<dyn Error>> {
        // 1. Address (DOMICILIO) at top ~0–60% width, 0–12% height
        let address = self.ocr_text(&crop_region(image, 0.00, 0.00, 0.60, 0.12))?;

        // 2. Town/Municipio just below at 0–60% width, 12–20% height
        let town = self.ocr_text(&crop_region(image, 0.00, 0.12, 0.60, 0.08))?;

        // 3. State/Comunidad Autónoma below at 0–60% width, 20–28% height
        let state = self.ocr_text(&crop_region(image, 0.00, 0.20, 0.60, 0.08))?;

        // 4. Back ID support number from MRZ first line (bottom ~75–85%)
        let mrz_line1 = self.ocr_text(&crop_region(image, 0.00, 0.75, 1.00, 0.10))?;
        let id_support_number = extract_id_support_from_mrz(&mrz_line1);

        Ok(SpanishIdBackData {
            address,
            town,
            state,
            id_support_number,
        })
    }

    /// Internal: run OCR on an image region and return cleaned text
    fn ocr_text(&mut self, sub_image: &DynamicImage) -> Result<String, Box<dyn Error>> {
        let gray = sub_image.to_luma8();
        self.ocr.set_image_from_mem(&gray)?;
        let mut txt = self.ocr.get_text()?;
        txt = txt.replace('\n', " ");
        Ok(txt.trim().to_string())
    }
}

/// Crop a sub-region of the source image by relative percentages
fn crop_region(
    image: &DynamicImage,
    x_pct: f32,
    y_pct: f32,
    w_pct: f32,
    h_pct: f32,
) -> DynamicImage {
    let (w, h) = image.dimensions();
    let x = (x_pct * w as f32).round().clamp(0.0, w as f32 - 1.0) as u32;
    let y = (y_pct * h as f32).round().clamp(0.0, h as f32 - 1.0) as u32;
    let cw = (w_pct * w as f32).round().clamp(1.0, w as f32 - x as f32) as u32;
    let ch = (h_pct * h as f32).round().clamp(1.0, h as f32 - y as f32) as u32;
    image.crop_imm(x, y, cw, ch)
}

/// Extract the ID support number token following "DESP" in an MRZ line
fn extract_id_support_from_mrz(mrz: &str) -> String {
    if let Some(idx) = mrz.find("DESP") {
        mrz[idx + 4..]
            .chars()
            .take_while(|c| *c != '<' && !c.is_whitespace())
            .collect()
    } else {
        String::new()
    }
}
