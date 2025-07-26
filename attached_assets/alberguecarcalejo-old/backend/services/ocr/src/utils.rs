use base64::{engine::general_purpose, Engine as _};
use image::{DynamicImage, ImageFormat};
use std::io::Cursor;

pub struct Utils;

impl Utils {
    pub fn decode_base64_image(
        base64_data: &str,
    ) -> Result<DynamicImage, Box<dyn std::error::Error>> {
        // Remove data URL prefix if present
        let base64_clean = if base64_data.starts_with("data:") {
            base64_data.split(',').nth(1).unwrap_or(base64_data)
        } else {
            base64_data
        };

        // Decode base64
        let image_bytes = general_purpose::STANDARD.decode(base64_clean)?;

        // Load image
        let image = image::load_from_memory(&image_bytes)?;

        Ok(image)
    }

    pub fn validate_image_size(image: &DynamicImage, max_size_mb: f32) -> Result<(), String> {
        let (width, height) = image.dimensions();
        let total_pixels = width * height;
        let estimated_size_mb = (total_pixels * 3) as f32 / 1_048_576.0; // RGB estimate

        if estimated_size_mb > max_size_mb {
            return Err(format!(
                "Image too large: {:.1}MB. Maximum allowed: {:.1}MB",
                estimated_size_mb, max_size_mb
            ));
        }

        Ok(())
    }

    pub fn normalize_text(text: &str) -> String {
        text.lines()
            .map(|line| line.trim())
            .filter(|line| !line.is_empty())
            .collect::<Vec<_>>()
            .join("\n")
    }

    pub fn extract_country_code(nationality_text: &str) -> Option<String> {
        let country_mappings = [
            ("ESPAÑA", "ESP"),
            ("SPAIN", "ESP"),
            ("FRANCE", "FRA"),
            ("FRANCIA", "FRA"),
            ("GERMANY", "DEU"),
            ("ALEMANIA", "DEU"),
            ("ITALY", "ITA"),
            ("ITALIA", "ITA"),
            ("PORTUGAL", "PRT"),
            ("UNITED KINGDOM", "GBR"),
            ("REINO UNIDO", "GBR"),
            ("UNITED STATES", "USA"),
            ("ESTADOS UNIDOS", "USA"),
            ("MOROCCO", "MAR"),
            ("MARRUECOS", "MAR"),
            ("ROMANIA", "ROU"),
            ("RUMANIA", "ROU"),
            ("COLOMBIA", "COL"),
            ("ARGENTINA", "ARG"),
        ];

        let upper_text = nationality_text.to_uppercase();

        for (country_name, code) in &country_mappings {
            if upper_text.contains(country_name) {
                return Some(code.to_string());
            }
        }

        None
    }

    pub fn format_date(date_str: &str) -> Option<String> {
        // Try to parse various date formats and normalize to DD-MM-YYYY
        let formats = [
            "%d/%m/%Y", "%d.%m.%Y", "%d-%m-%Y", "%Y-%m-%d", "%Y/%m/%d", "%Y.%m.%d",
        ];

        for format in &formats {
            if let Ok(date) = chrono::NaiveDate::parse_from_str(date_str, format) {
                return Some(date.format("%d-%m-%Y").to_string());
            }
        }

        None
    }

    pub fn clean_document_number(number: &str) -> String {
        number
            .chars()
            .filter(|c| c.is_alphanumeric())
            .collect::<String>()
            .to_uppercase()
    }

    pub fn extract_confidence_from_text_length(text: &str) -> f32 {
        // Estimate confidence based on text length and character quality
        let clean_text = text.trim();
        let char_count = clean_text.len();

        if char_count == 0 {
            return 0.0;
        }

        let alpha_count = clean_text.chars().filter(|c| c.is_alphabetic()).count();
        let digit_count = clean_text.chars().filter(|c| c.is_numeric()).count();
        let valid_chars = alpha_count + digit_count;

        let character_ratio = valid_chars as f32 / char_count as f32;

        // Base confidence on character quality and reasonable text length
        let length_score = if char_count > 50 && char_count < 2000 {
            1.0
        } else if char_count > 20 {
            0.8
        } else {
            0.5
        };

        (character_ratio * length_score).min(1.0)
    }
}

pub const SPANISH_ID_LETTERS: &str = "TRWAGMYFPDXBNJZSQVHLCKE";

pub fn validate_spanish_id_checksum(number: &str, letter: &str) -> bool {
    if let Ok(num) = number.parse::<u32>() {
        let expected_letter = SPANISH_ID_LETTERS.chars().nth((num % 23) as usize);
        if let Some(expected) = expected_letter {
            return letter.to_uppercase().chars().next() == Some(expected);
        }
    }
    false
}
