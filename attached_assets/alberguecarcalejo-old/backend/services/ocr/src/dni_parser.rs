use crate::image_processor::ImageProcessor;
use crate::models::{DocumentData, DocumentType, ValidationResult};
use crate::ocr_engine::OCREngine;
use image::{DynamicImage, GrayImage};
use regex::Regex;
use std::collections::HashMap;

pub struct SpanishDNIParser {
    ocr_engine: OCREngine,
}

impl SpanishDNIParser {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let ocr_engine = OCREngine::new()?;
        Ok(Self { ocr_engine })
    }

    pub fn parse_dni(
        &mut self,
        image: &DynamicImage,
        document_type: &DocumentType,
    ) -> Result<DocumentData, Box<dyn std::error::Error>> {
        let mut data = DocumentData {
            document_number: None,
            first_name: None,
            last_names: None,
            birth_date: None,
            expiry_date: None,
            nationality: Some("ESP".to_string()),
            address: None,
            postal_code: None,
            validation: ValidationResult {
                format_valid: false,
                checksum_valid: false,
                confidence: 0.0,
            },
            confidence_score: 0.0,
            gender: None,
            issue_date: None,
            issuing_authority: None,
            provincia: None,
            municipio: None,
            support_number: None,
            can_number: None,
        };

        // Preprocess image for better OCR
        let processed_image = ImageProcessor::preprocess(image)?;

        match document_type {
            DocumentType::DniFront | DocumentType::NieFront => {
                self.parse_dni_front(&processed_image, &mut data)?;
            }
            DocumentType::DniBack | DocumentType::NieBack => {
                self.parse_dni_back(&processed_image, &mut data)?;
            }
            _ => {
                // Try to auto-detect if it's front or back
                let full_text = self.ocr_engine.extract_text(&processed_image)?;
                if self.is_dni_back(&full_text) {
                    self.parse_dni_back(&processed_image, &mut data)?;
                } else {
                    self.parse_dni_front(&processed_image, &mut data)?;
                }
            }
        }

        // Calculate overall confidence
        data.confidence_score = self.calculate_confidence(&data);
        data.validation.confidence = data.confidence_score;
        data.validation.format_valid = data.confidence_score > 0.3;

        // Validate DNI number if present
        if let Some(ref dni_number) = data.document_number {
            data.validation.checksum_valid = self.validate_dni_checksum(dni_number);
        }

        Ok(data)
    }

    fn parse_dni_front(
        &mut self,
        image: &GrayImage,
        data: &mut DocumentData,
    ) -> Result<(), Box<dyn std::error::Error>> {
        // Extract full text first
        let full_text = self.ocr_engine.extract_text(image)?;

        // Parse DNI number patterns
        self.extract_dni_number(&full_text, data);

        // Parse names
        self.extract_names(&full_text, data);

        // Parse dates
        self.extract_dates(&full_text, data);

        // Parse gender
        self.extract_gender(&full_text, data);

        // Parse nationality (should be ESP for DNI)
        self.extract_nationality(&full_text, data);

        // Parse support number
        self.extract_support_number(&full_text, data);

        // Try region-based OCR for better accuracy
        self.extract_regions_front(image, data)?;

        Ok(())
    }

    fn parse_dni_back(
        &mut self,
        image: &GrayImage,
        data: &mut DocumentData,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let full_text = self.ocr_engine.extract_text(image)?;

        // Parse address information
        self.extract_address(&full_text, data);

        // Parse MRZ if present (modern DNIs)
        self.extract_mrz_data(&full_text, data);

        // Try region-based OCR for address details
        self.extract_regions_back(image, data)?;

        Ok(())
    }

    fn extract_dni_number(&self, text: &str, data: &mut DocumentData) {
        // Multiple patterns for DNI/NIE numbers
        let patterns = vec![
            r"(?i)(?:dni|nif)[\s\.:]*([0-9]{8}[A-Z])", // DNI: 12345678A
            r"(?i)(?:nie)[\s\.:]*([XYZ][0-9]{7}[A-Z])", // NIE: X1234567A
            r"\b([0-9]{8}[A-Z])\b",                    // Just the number: 12345678A
            r"\b([XYZ][0-9]{7}[A-Z])\b",               // Just NIE: X1234567A
            r"(?i)num[\s\.:]*([0-9]{8}[A-Z])",         // NUM: 12345678A
            r"(?i)número[\s\.:]*([0-9]{8}[A-Z])",     // NÚMERO: 12345678A
        ];

        for pattern in patterns {
            if let Ok(regex) = Regex::new(pattern) {
                if let Some(captures) = regex.captures(text) {
                    if let Some(dni_match) = captures.get(1) {
                        let dni = dni_match.as_str().to_uppercase();
                        // Validate the DNI format before accepting
                        if self.is_valid_dni_format(&dni) {
                            data.document_number = Some(dni);
                            return;
                        }
                    }
                }
            }
        }
    }

    fn extract_names(&self, text: &str, data: &mut DocumentData) {
        let lines: Vec<&str> = text.lines().collect();

        // Look for name patterns - names usually appear in uppercase after certain keywords
        let name_patterns = vec![
            r"(?i)(?:apellidos?|apellido|surname)[\s:]*([A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s]+)",
            r"(?i)(?:nombre|name)[\s:]*([A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s]+)",
        ];

        // Try to find structured name fields
        for line in &lines {
            let clean_line = line.trim();

            // Skip very short lines or lines with mostly numbers
            if clean_line.len() < 3
                || clean_line.chars().filter(|c| c.is_numeric()).count() > clean_line.len() / 2
            {
                continue;
            }

            // Look for lines that are mostly uppercase letters (likely names)
            if clean_line.chars().filter(|c| c.is_uppercase()).count() > clean_line.len() / 2 {
                let words: Vec<&str> = clean_line.split_whitespace().collect();

                // If we find a line with 2-4 words in uppercase, it's likely names
                if words.len() >= 2 && words.len() <= 4 {
                    // First word(s) are usually surnames, last word is first name
                    if words.len() == 2 {
                        data.last_names = Some(words[0].to_string());
                        data.first_name = Some(words[1].to_string());
                    } else if words.len() == 3 {
                        data.last_names = Some(format!("{} {}", words[0], words[1]));
                        data.first_name = Some(words[2].to_string());
                    } else if words.len() == 4 {
                        data.last_names = Some(format!("{} {}", words[0], words[1]));
                        data.first_name = Some(format!("{} {}", words[2], words[3]));
                    }

                    if data.last_names.is_some() && data.first_name.is_some() {
                        break;
                    }
                }
            }
        }

        // If structured extraction failed, try pattern matching
        if data.last_names.is_none() || data.first_name.is_none() {
            for pattern in name_patterns {
                if let Ok(regex) = Regex::new(pattern) {
                    for captures in regex.captures_iter(text) {
                        if let Some(name_match) = captures.get(1) {
                            let name = name_match.as_str().trim();
                            if pattern.contains("apellido") && data.last_names.is_none() {
                                data.last_names = Some(name.to_string());
                            } else if pattern.contains("nombre") && data.first_name.is_none() {
                                data.first_name = Some(name.to_string());
                            }
                        }
                    }
                }
            }
        }
    }

    fn extract_dates(&self, text: &str, data: &mut DocumentData) {
        // Multiple date patterns for Spanish dates
        let date_patterns = vec![
            r"(?i)(?:fecha[\s]*de[\s]*nacimiento|nacimiento|born)[\s:]*(\d{1,2})[./\-](\d{1,2})[./\-](\d{4})",
            r"(?i)(?:válido[\s]*hasta|expir|exp|caducidad)[\s:]*(\d{1,2})[./\-](\d{1,2})[./\-](\d{4})",
            r"(?i)(?:expedido|issued)[\s:]*(\d{1,2})[./\-](\d{1,2})[./\-](\d{4})",
            r"\b(\d{1,2})[./\-](\d{1,2})[./\-](\d{4})\b", // Generic date pattern
        ];

        let mut found_dates = Vec::new();

        for pattern in date_patterns {
            if let Ok(regex) = Regex::new(pattern) {
                for captures in regex.captures_iter(text) {
                    if let (Some(day), Some(month), Some(year)) =
                        (captures.get(1), captures.get(2), captures.get(3))
                    {
                        let day_str = day.as_str();
                        let month_str = month.as_str();
                        let year_str = year.as_str();

                        // Validate date components
                        if let (Ok(d), Ok(m), Ok(y)) = (
                            day_str.parse::<u32>(),
                            month_str.parse::<u32>(),
                            year_str.parse::<u32>(),
                        ) {
                            if d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2050 {
                                let formatted_date = format!("{:02}-{:02}-{}", d, m, y);

                                // Categorize dates based on context
                                let context = captures.get(0).unwrap().as_str().to_lowercase();
                                if context.contains("nacimiento") || context.contains("born") {
                                    data.birth_date = Some(formatted_date);
                                } else if context.contains("válido")
                                    || context.contains("expir")
                                    || context.contains("caducidad")
                                {
                                    data.expiry_date = Some(formatted_date);
                                } else if context.contains("expedido") || context.contains("issued")
                                {
                                    data.issue_date = Some(formatted_date);
                                } else {
                                    found_dates.push((formatted_date, y));
                                }
                            }
                        }
                    }
                }
            }
        }

        // If we couldn't categorize dates, assign them based on year logic
        if data.birth_date.is_none() || data.expiry_date.is_none() {
            found_dates.sort_by_key(|&(_, year)| year);

            for (date, year) in found_dates {
                if data.birth_date.is_none() && year < 2010 {
                    data.birth_date = Some(date);
                } else if data.expiry_date.is_none() && year > 2020 {
                    data.expiry_date = Some(date);
                }
            }
        }
    }

    fn extract_gender(&self, text: &str, data: &mut DocumentData) {
        let gender_patterns = vec![r"(?i)(?:sexo|gender)[\s:]*([MFV])", r"(?i)\b([MFV])\b"];

        for pattern in gender_patterns {
            if let Ok(regex) = Regex::new(pattern) {
                if let Some(captures) = regex.captures(text) {
                    if let Some(gender_match) = captures.get(1) {
                        let gender = gender_match.as_str().to_uppercase();
                        if gender == "M" || gender == "F" || gender == "V" {
                            data.gender = Some(gender);
                            return;
                        }
                    }
                }
            }
        }
    }

    fn extract_nationality(&self, text: &str, data: &mut DocumentData) {
        let nationality_patterns = vec![
            r"(?i)(?:nacionalidad|nationality)[\s:]*([A-Z]{3})",
            r"(?i)\b(ESP|SPA|ESPAÑOLA?)\b",
        ];

        for pattern in nationality_patterns {
            if let Ok(regex) = Regex::new(pattern) {
                if let Some(captures) = regex.captures(text) {
                    if let Some(nat_match) = captures.get(1) {
                        let nationality = nat_match.as_str().to_uppercase();
                        if nationality == "ESP"
                            || nationality == "SPA"
                            || nationality.contains("ESPAÑOL")
                        {
                            data.nationality = Some("ESP".to_string());
                        } else {
                            data.nationality = Some(nationality);
                        }
                        return;
                    }
                }
            }
        }
    }

    fn extract_support_number(&self, text: &str, data: &mut DocumentData) {
        let support_patterns = vec![
            r"(?i)(?:número[\s]*de[\s]*soporte|soporte|support)[\s:]*([A-Z0-9]{6,12})",
            r"(?i)(?:núm[\s]*soporte)[\s:]*([A-Z0-9]{6,12})",
            r"(?i)(?:can)[\s:]*([A-Z0-9]{6,12})",
        ];

        for pattern in support_patterns {
            if let Ok(regex) = Regex::new(pattern) {
                if let Some(captures) = regex.captures(text) {
                    if let Some(support_match) = captures.get(1) {
                        let support = support_match.as_str().to_uppercase();
                        if pattern.contains("can") {
                            data.can_number = Some(support);
                        } else {
                            data.support_number = Some(support);
                        }
                    }
                }
            }
        }
    }

    fn extract_address(&self, text: &str, data: &mut DocumentData) {
        let address_patterns = vec![
            r"(?i)(?:domicilio|dirección|address)[\s:]*([^\n]+)",
            r"(?i)(?:calle|c/|street)[\s:]*([^\n]+)",
        ];

        for pattern in address_patterns {
            if let Ok(regex) = Regex::new(pattern) {
                if let Some(captures) = regex.captures(text) {
                    if let Some(addr_match) = captures.get(1) {
                        let address = addr_match.as_str().trim();
                        if !address.is_empty() && address.len() > 5 {
                            data.address = Some(address.to_string());
                            break;
                        }
                    }
                }
            }
        }

        // Extract provincia and municipio
        let provincia_patterns = vec![
            r"(?i)(?:provincia|prov)[\s:]*([A-ZÁÉÍÓÚÑÜ][a-záéíóúñü\s]+)",
            r"(?i)(?:comunidad|ccaa)[\s:]*([A-ZÁÉÍÓÚÑÜ][a-záéíóúñü\s]+)",
        ];

        for pattern in provincia_patterns {
            if let Ok(regex) = Regex::new(pattern) {
                if let Some(captures) = regex.captures(text) {
                    if let Some(prov_match) = captures.get(1) {
                        data.provincia = Some(prov_match.as_str().trim().to_string());
                        break;
                    }
                }
            }
        }

        let municipio_patterns =
            vec![r"(?i)(?:municipio|localidad|ciudad)[\s:]*([A-ZÁÉÍÓÚÑÜ][a-záéíóúñü\s]+)"];

        for pattern in municipio_patterns {
            if let Ok(regex) = Regex::new(pattern) {
                if let Some(captures) = regex.captures(text) {
                    if let Some(mun_match) = captures.get(1) {
                        data.municipio = Some(mun_match.as_str().trim().to_string());
                        break;
                    }
                }
            }
        }
    }

    fn extract_mrz_data(&self, text: &str, data: &mut DocumentData) {
        let lines: Vec<&str> = text.lines().collect();
        let mut mrz_lines = Vec::new();

        // Find MRZ lines (they contain specific patterns and are usually at the bottom)
        for line in &lines {
            let clean_line = line.trim().replace(" ", "");

            // MRZ lines for Spanish DNI typically start with "IDESP" and have specific patterns
            if clean_line.starts_with("IDESP")
                || clean_line.contains("ESP<")
                || (clean_line.len() > 30
                    && clean_line.chars().all(|c| c.is_alphanumeric() || c == '<'))
            {
                mrz_lines.push(clean_line);
            }
        }

        if !mrz_lines.is_empty() {
            // Parse MRZ data - Spanish DNI MRZ format
            for line in &mrz_lines {
                if line.starts_with("IDESP") {
                    // Extract support number from MRZ
                    if let Some(support_start) = line.find("IDESP") {
                        let support_part = &line[support_start + 5..];
                        let support_end = support_part.find('<').unwrap_or(support_part.len());
                        let support = &support_part[..support_end];
                        if !support.is_empty() && support.len() >= 6 {
                            data.support_number = Some(support.to_string());
                        }
                    }
                }

                // Look for additional MRZ data patterns
                if line.contains("ESP<") {
                    // Extract names from MRZ
                    if let Some(esp_pos) = line.find("ESP<") {
                        let names_part = &line[esp_pos + 4..];
                        let names: Vec<&str> = names_part.split('<').collect();

                        if names.len() >= 2 {
                            if data.last_names.is_none() && !names[0].is_empty() {
                                data.last_names = Some(names[0].to_string());
                            }
                            if data.first_name.is_none() && names.len() > 1 && !names[1].is_empty()
                            {
                                data.first_name = Some(names[1].to_string());
                            }
                        }
                    }
                }
            }
        }
    }

    fn extract_regions_front(
        &mut self,
        image: &GrayImage,
        data: &mut DocumentData,
    ) -> Result<(), Box<dyn std::error::Error>> {
        // Define regions for different parts of the DNI front
        let (width, height) = image.dimensions();

        // Region coordinates as percentages (x, y, width, height)
        let regions = vec![
            ("names", 0.3, 0.15, 0.65, 0.25), // Names area
            ("dates", 0.3, 0.4, 0.65, 0.25),  // Dates area
            ("numbers", 0.0, 0.8, 1.0, 0.2),  // Bottom area for DNI number
        ];

        for (region_name, x_pct, y_pct, w_pct, h_pct) in regions {
            let x = (x_pct * width as f32) as u32;
            let y = (y_pct * height as f32) as u32;
            let w = (w_pct * width as f32) as u32;
            let h = (h_pct * height as f32) as u32;

            // Ensure coordinates are within bounds
            if x + w <= width && y + h <= height {
                let region_image = image.view(x, y, w, h).to_image();
                if let Ok(region_text) = self.ocr_engine.extract_text(&region_image) {
                    match region_name {
                        "names" => {
                            if data.first_name.is_none() || data.last_names.is_none() {
                                self.extract_names(&region_text, data);
                            }
                        }
                        "dates" => {
                            if data.birth_date.is_none() || data.expiry_date.is_none() {
                                self.extract_dates(&region_text, data);
                            }
                        }
                        "numbers" => {
                            if data.document_number.is_none() {
                                self.extract_dni_number(&region_text, data);
                            }
                        }
                        _ => {}
                    }
                }
            }
        }

        Ok(())
    }

    fn extract_regions_back(
        &mut self,
        image: &GrayImage,
        data: &mut DocumentData,
    ) -> Result<(), Box<dyn std::error::Error>> {
        // Define regions for DNI back
        let (width, height) = image.dimensions();

        let regions = vec![
            ("address", 0.0, 0.0, 0.7, 0.6), // Address area
            ("mrz", 0.0, 0.7, 1.0, 0.3),     // MRZ area at bottom
        ];

        for (region_name, x_pct, y_pct, w_pct, h_pct) in regions {
            let x = (x_pct * width as f32) as u32;
            let y = (y_pct * height as f32) as u32;
            let w = (w_pct * width as f32) as u32;
            let h = (h_pct * height as f32) as u32;

            if x + w <= width && y + h <= height {
                let region_image = image.view(x, y, w, h).to_image();
                if let Ok(region_text) = self.ocr_engine.extract_text(&region_image) {
                    match region_name {
                        "address" => self.extract_address(&region_text, data),
                        "mrz" => self.extract_mrz_data(&region_text, data),
                        _ => {}
                    }
                }
            }
        }

        Ok(())
    }

    fn is_dni_back(&self, text: &str) -> bool {
        let back_indicators = vec![
            "domicilio",
            "dirección",
            "address",
            "municipio",
            "provincia",
            "idesp",
            "mrz",
            "<<<",
            "lugar de nacimiento",
        ];

        let text_lower = text.to_lowercase();
        back_indicators
            .iter()
            .any(|&indicator| text_lower.contains(indicator))
    }

    fn is_valid_dni_format(&self, dni: &str) -> bool {
        if dni.len() != 9 {
            return false;
        }

        // DNI format: 8 digits + 1 letter
        let (numbers, letter) = dni.split_at(8);

        // Check if first 8 characters are digits
        if !numbers.chars().all(|c| c.is_ascii_digit()) {
            // Check for NIE format: X/Y/Z + 7 digits + 1 letter
            if dni.len() == 9 {
                let first_char = dni.chars().next().unwrap();
                if first_char == 'X' || first_char == 'Y' || first_char == 'Z' {
                    let (_, rest) = dni.split_at(1);
                    let (numbers, _) = rest.split_at(7);
                    return numbers.chars().all(|c| c.is_ascii_digit());
                }
            }
            return false;
        }

        // Check if last character is a letter
        letter.chars().all(|c| c.is_ascii_alphabetic())
    }

    fn validate_dni_checksum(&self, dni: &str) -> bool {
        if !self.is_valid_dni_format(dni) {
            return false;
        }

        let letters = "TRWAGMYFPDXBNJZSQVHLCKE";

        let (number_part, check_letter) =
            if dni.starts_with('X') || dni.starts_with('Y') || dni.starts_with('Z') {
                // NIE validation
                let first_char = dni.chars().next().unwrap();
                let replacement = match first_char {
                    'X' => '0',
                    'Y' => '1',
                    'Z' => '2',
                    _ => return false,
                };
                let number_str = format!("{}{}", replacement, &dni[1..8]);
                (number_str, dni.chars().nth(8).unwrap())
            } else {
                // DNI validation
                (dni[..8].to_string(), dni.chars().nth(8).unwrap())
            };

        if let Ok(number) = number_part.parse::<u32>() {
            let expected_letter = letters.chars().nth((number % 23) as usize).unwrap();
            return check_letter == expected_letter;
        }

        false
    }

    fn calculate_confidence(&self, data: &DocumentData) -> f32 {
        let mut score = 0.0;
        let mut total_fields = 0.0;

        // Essential fields
        if data.document_number.is_some() {
            score += 2.0;
        }
        total_fields += 2.0;

        if data.first_name.is_some() {
            score += 1.5;
        }
        total_fields += 1.5;

        if data.last_names.is_some() {
            score += 1.5;
        }
        total_fields += 1.5;

        if data.birth_date.is_some() {
            score += 1.0;
        }
        total_fields += 1.0;

        // Optional fields
        if data.gender.is_some() {
            score += 0.5;
        }
        total_fields += 0.5;

        if data.nationality.is_some() {
            score += 0.5;
        }
        total_fields += 0.5;

        if data.expiry_date.is_some() {
            score += 0.5;
        }
        total_fields += 0.5;

        // Bonus for validation
        if data.validation.checksum_valid {
            score += 1.0;
        }
        total_fields += 1.0;

        if total_fields > 0.0 {
            score / total_fields
        } else {
            0.0
        }
    }
}
