use regex::Regex;
use chrono::{NaiveDate, Datelike};
use crate::models::{DocumentData, ValidationResult};

pub struct SpanishValidator;

impl SpanishValidator {
    pub fn parse_dni_front(text: &str) -> DocumentData {
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
        };
        
        // Extract DNI number (8 digits + 1 letter)
        let dni_regex = Regex::new(r"\b(\d{8})([A-Z])\b").unwrap();
        if let Some(captures) = dni_regex.captures(text) {
            let number = &captures[1];
            let letter = &captures[2];
            let dni = format!("{}{}", number, letter);
            
            data.document_number = Some(dni.clone());
            data.validation.format_valid = true;
            data.validation.checksum_valid = Self::validate_dni_checksum(number, letter);
        }
        
        // Extract names using common Spanish name patterns
        Self::extract_names(&mut data, text);
        
        // Extract dates
        Self::extract_dates(&mut data, text);
        
        // Calculate overall confidence
        data.confidence_score = Self::calculate_confidence(&data);
        data.validation.confidence = data.confidence_score;
        
        data
    }
    
    pub fn parse_nie_front(text: &str) -> DocumentData {
        let mut data = DocumentData {
            document_number: None,
            first_name: None,
            last_names: None,
            birth_date: None,
            expiry_date: None,
            nationality: None,
            address: None,
            postal_code: None,
            validation: ValidationResult {
                format_valid: false,
                checksum_valid: false,
                confidence: 0.0,
            },
            confidence_score: 0.0,
        };
        
        // Extract NIE number (X/Y/Z + 7 digits + 1 letter)
        let nie_regex = Regex::new(r"\b([XYZ])(\d{7})([A-Z])\b").unwrap();
        if let Some(captures) = nie_regex.captures(text) {
            let prefix = &captures[1];
            let number = &captures[2];
            let letter = &captures[3];
            let nie = format!("{}{}{}", prefix, number, letter);
            
            data.document_number = Some(nie.clone());
            data.validation.format_valid = true;
            data.validation.checksum_valid = Self::validate_nie_checksum(prefix, number, letter);
        }
        
        // Extract names
        Self::extract_names(&mut data, text);
        
        // Extract dates
        Self::extract_dates(&mut data, text);
        
        // Extract nationality for NIE
        Self::extract_nationality(&mut data, text);
        
        data.confidence_score = Self::calculate_confidence(&data);
        data.validation.confidence = data.confidence_score;
        
        data
    }
    
    pub fn parse_dni_back(text: &str) -> DocumentData {
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
                format_valid: true,
                checksum_valid: true,
                confidence: 0.0,
            },
            confidence_score: 0.0,
        };
        
        // Extract address from back of DNI
        Self::extract_address(&mut data, text);
        
        data.confidence_score = Self::calculate_confidence(&data);
        data.validation.confidence = data.confidence_score;
        
        data
    }
    
    fn validate_dni_checksum(number: &str, letter: &str) -> bool {
        let dni_letters = "TRWAGMYFPDXBNJZSQVHLCKE";
        
        if let Ok(num) = number.parse::<u32>() {
            let expected_letter = dni_letters.chars().nth((num % 23) as usize).unwrap();
            return letter.chars().next().unwrap() == expected_letter;
        }
        
        false
    }
    
    fn validate_nie_checksum(prefix: &str, number: &str, letter: &str) -> bool {
        let nie_letters = "TRWAGMYFPDXBNJZSQVHLCKE";
        
        // Convert prefix to number (X=0, Y=1, Z=2)
        let prefix_num = match prefix {
            "X" => 0,
            "Y" => 1,
            "Z" => 2,
            _ => return false,
        };
        
        let full_number = format!("{}{}", prefix_num, number);
        
        if let Ok(num) = full_number.parse::<u32>() {
            let expected_letter = nie_letters.chars().nth((num % 23) as usize).unwrap();
            return letter.chars().next().unwrap() == expected_letter;
        }
        
        false
    }
    
    fn extract_names(data: &mut DocumentData, text: &str) {
        // Look for common Spanish name patterns
        let lines: Vec<&str> = text.lines().collect();
        
        for line in &lines {
            let line = line.trim();
            
            // Look for "NOMBRE" or "NOMBRES" followed by name
            if line.contains("NOMBRE") || line.contains("APELLIDOS") {
                continue; // Skip labels
            }
            
            // Look for lines with all caps names (typical in Spanish IDs)
            if line.len() > 2 && line.chars().all(|c| c.is_uppercase() || c.is_whitespace()) {
                let words: Vec<&str> = line.split_whitespace().collect();
                
                if words.len() >= 2 {
                    // First word is typically the first name
                    data.first_name = Some(words[0].to_string());
                    
                    // Remaining words are last names
                    data.last_names = Some(words[1..].join(" "));
                    break;
                }
            }
        }
    }
    
    fn extract_dates(data: &mut DocumentData, text: &str) {
        // Look for date patterns (DD.MM.YYYY or DD/MM/YYYY)
        let date_regex = Regex::new(r"\b(\d{2})[./](\d{2})[./](\d{4})\b").unwrap();
        
        let mut dates_found = Vec::new();
        for captures in date_regex.captures_iter(text) {
            let day = &captures[1];
            let month = &captures[2];
            let year = &captures[3];
            let date_str = format!("{}-{}-{}", day, month, year);
            dates_found.push(date_str);
        }
        
        // Assign dates based on context and chronological order
        dates_found.sort();
        
        if dates_found.len() >= 1 {
            // First date is likely birth date
            data.birth_date = Some(dates_found[0].clone());
        }
        
        if dates_found.len() >= 2 {
            // Last date is likely expiry date
            data.expiry_date = Some(dates_found.last().unwrap().clone());
        }
    }
    
    fn extract_nationality(data: &mut DocumentData, text: &str) {
        // Look for common nationality patterns in NIE documents
        let nationality_patterns = [
            ("MARRUECOS", "MAR"),
            ("RUMANIA", "ROU"),
            ("COLOMBIA", "COL"),
            ("ARGENTINA", "ARG"),
            ("FRANCIA", "FRA"),
            ("ALEMANIA", "DEU"),
            ("ITALIA", "ITA"),
            ("PORTUGAL", "PRT"),
        ];
        
        for (pattern, code) in &nationality_patterns {
            if text.contains(pattern) {
                data.nationality = Some(code.to_string());
                break;
            }
        }
    }
    
    fn extract_address(data: &mut DocumentData, text: &str) {
        let lines: Vec<&str> = text.lines().collect();
        let mut address_lines = Vec::new();
        let postal_regex = Regex::new(r"\b(\d{5})\b").unwrap();
        
        for line in &lines {
            let line = line.trim();
            
            // Skip empty lines and common labels
            if line.is_empty() || line.contains("DOMICILIO") || line.contains("DIRECCIÓN") {
                continue;
            }
            
            // Look for postal code
            if let Some(captures) = postal_regex.captures(line) {
                data.postal_code = Some(captures[1].to_string());
            }
            
            // Collect address lines
            if line.len() > 5 && !line.chars().all(|c| c.is_numeric()) {
                address_lines.push(line);
            }
        }
        
        if !address_lines.is_empty() {
            data.address = Some(address_lines.join(", "));
        }
    }
    
    fn calculate_confidence(data: &DocumentData) -> f32 {
        let mut score = 0.0;
        let mut total_checks = 0.0;
        
        // Document number present and valid
        if data.document_number.is_some() {
            score += if data.validation.checksum_valid { 1.0 } else { 0.5 };
        }
        total_checks += 1.0;
        
        // Names present
        if data.first_name.is_some() { score += 1.0; }
        total_checks += 1.0;
        
        if data.last_names.is_some() { score += 1.0; }
        total_checks += 1.0;
        
        // Dates present
        if data.birth_date.is_some() { score += 1.0; }
        total_checks += 1.0;
        
        if data.expiry_date.is_some() { score += 1.0; }
        total_checks += 1.0;
        
        if total_checks > 0.0 {
            score / total_checks
        } else {
            0.0
        }
    }
}