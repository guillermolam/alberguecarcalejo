use regex::Regex;
use crate::models::{DocumentData, ValidationResult};

pub struct PassportParser;

impl PassportParser {
    pub fn parse_passport(text: &str) -> DocumentData {
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
        
        // Look for MRZ (Machine Readable Zone) lines
        let mrz_lines = Self::extract_mrz_lines(text);
        
        if mrz_lines.len() >= 2 {
            // Parse MRZ data
            Self::parse_mrz(&mut data, &mrz_lines);
        } else {
            // Fallback to text-based extraction
            Self::parse_text_fields(&mut data, text);
        }
        
        data.confidence_score = Self::calculate_confidence(&data);
        data.validation.confidence = data.confidence_score;
        
        data
    }
    
    fn extract_mrz_lines(text: &str) -> Vec<String> {
        let lines: Vec<&str> = text.lines().collect();
        let mut mrz_lines = Vec::new();
        
        // MRZ lines typically contain specific patterns
        let mrz_pattern = Regex::new(r"^[A-Z0-9<]{30,}$").unwrap();
        
        for line in &lines {
            let clean_line = line.trim().replace(" ", "");
            if mrz_pattern.is_match(&clean_line) && clean_line.len() >= 36 {
                mrz_lines.push(clean_line);
            }
        }
        
        mrz_lines
    }
    
    fn parse_mrz(data: &mut DocumentData, mrz_lines: &[String]) {
        if mrz_lines.len() < 2 {
            return;
        }
        
        let line1 = &mrz_lines[0];
        let line2 = &mrz_lines[1];
        
        // Parse first line: P<COUNTRY<<SURNAME<<GIVEN_NAMES<<<<<<<<<<<<<<<<
        if line1.starts_with('P') {
            // Extract country code
            if line1.len() > 5 {
                let country_code = &line1[2..5];
                if country_code != "<<<" {
                    data.nationality = Some(country_code.to_string());
                }
            }
            
            // Extract names from remainder of line1
            if line1.len() > 5 {
                let names_part = &line1[5..];
                let names: Vec<&str> = names_part.split("<<").collect();
                
                if names.len() >= 2 {
                    data.last_names = Some(names[0].replace("<", " ").trim().to_string());
                    data.first_name = Some(names[1].replace("<", " ").trim().to_string());
                }
            }
        }
        
        // Parse second line: passport number, birth date, expiry date, etc.
        if line2.len() >= 36 {
            // Passport number (positions 0-8)
            let passport_num = &line2[0..9].replace("<", "");
            if !passport_num.is_empty() {
                data.document_number = Some(passport_num.to_string());
            }
            
            // Birth date (positions 13-18: YYMMDD)
            if line2.len() > 18 {
                let birth_date = &line2[13..19];
                if let Ok(date) = Self::parse_mrz_date(birth_date) {
                    data.birth_date = Some(date);
                }
            }
            
            // Expiry date (positions 21-26: YYMMDD)
            if line2.len() > 26 {
                let expiry_date = &line2[21..27];
                if let Ok(date) = Self::parse_mrz_date(expiry_date) {
                    data.expiry_date = Some(date);
                }
            }
        }
        
        data.validation.format_valid = true;
        data.validation.checksum_valid = Self::validate_mrz_checksums(mrz_lines);
    }
    
    fn parse_mrz_date(mrz_date: &str) -> Result<String, &'static str> {
        if mrz_date.len() != 6 {
            return Err("Invalid date length");
        }
        
        let year: i32 = mrz_date[0..2].parse().map_err(|_| "Invalid year")?;
        let month: u32 = mrz_date[2..4].parse().map_err(|_| "Invalid month")?;
        let day: u32 = mrz_date[4..6].parse().map_err(|_| "Invalid day")?;
        
        // Convert 2-digit year to 4-digit (assume 20xx for years < 30, 19xx for years >= 30)
        let full_year = if year < 30 { 2000 + year } else { 1900 + year };
        
        Ok(format!("{:02}-{:02}-{}", day, month, full_year))
    }
    
    fn validate_mrz_checksums(mrz_lines: &[String]) -> bool {
        // Simplified checksum validation
        // In a real implementation, you would validate each checksum digit
        // according to ICAO Doc 9303 specifications
        
        if mrz_lines.len() < 2 {
            return false;
        }
        
        // For now, just check that the lines have the expected format
        let line2 = &mrz_lines[1];
        line2.len() >= 36
    }
    
    fn parse_text_fields(data: &mut DocumentData, text: &str) {
        // Fallback parsing for when MRZ is not readable
        let lines: Vec<&str> = text.lines().collect();
        
        // Look for passport number patterns
        let passport_regex = Regex::new(r"\b([A-Z]{1,3}\d{6,9})\b").unwrap();
        if let Some(captures) = passport_regex.captures(text) {
            data.document_number = Some(captures[1].to_string());
        }
        
        // Look for dates
        let date_regex = Regex::new(r"\b(\d{2})[./](\d{2})[./](\d{4})\b").unwrap();
        let mut dates_found = Vec::new();
        
        for captures in date_regex.captures_iter(text) {
            let day = &captures[1];
            let month = &captures[2];
            let year = &captures[3];
            let date_str = format!("{}-{}-{}", day, month, year);
            dates_found.push(date_str);
        }
        
        // Assign dates chronologically
        dates_found.sort();
        if dates_found.len() >= 1 {
            data.birth_date = Some(dates_found[0].clone());
        }
        if dates_found.len() >= 2 {
            data.expiry_date = Some(dates_found.last().unwrap().clone());
        }
        
        // Look for names in typical passport format
        for line in &lines {
            let line = line.trim();
            if line.len() > 5 && line.chars().all(|c| c.is_uppercase() || c.is_whitespace()) {
                let words: Vec<&str> = line.split_whitespace().collect();
                if words.len() >= 2 {
                    data.first_name = Some(words[0].to_string());
                    data.last_names = Some(words[1..].join(" "));
                    break;
                }
            }
        }
    }
    
    fn calculate_confidence(data: &DocumentData) -> f32 {
        let mut score = 0.0;
        let mut total_checks = 0.0;
        
        if data.document_number.is_some() { score += 1.0; }
        total_checks += 1.0;
        
        if data.first_name.is_some() { score += 1.0; }
        total_checks += 1.0;
        
        if data.last_names.is_some() { score += 1.0; }
        total_checks += 1.0;
        
        if data.birth_date.is_some() { score += 1.0; }
        total_checks += 1.0;
        
        if data.expiry_date.is_some() { score += 1.0; }
        total_checks += 1.0;
        
        if data.nationality.is_some() { score += 1.0; }
        total_checks += 1.0;
        
        if total_checks > 0.0 {
            score / total_checks
        } else {
            0.0
        }
    }
}