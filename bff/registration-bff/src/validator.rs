use crate::{RegistrationData, PilgrimData, BookingData, PaymentData};
use regex::Regex;
use chrono::{NaiveDate, Utc};

/// Validate dates for availability checks
pub fn validate_dates(check_in_date: &str, check_out_date: &str) -> Result<(), String> {
    let check_in = NaiveDate::parse_from_str(check_in_date, "%Y-%m-%d")
        .map_err(|_| "Invalid check-in date format. Use YYYY-MM-DD".to_string())?;
    
    let check_out = NaiveDate::parse_from_str(check_out_date, "%Y-%m-%d")
        .map_err(|_| "Invalid check-out date format. Use YYYY-MM-DD".to_string())?;

    let today = Utc::now().date_naive();
    
    if check_in < today {
        return Err("Check-in date cannot be in the past".to_string());
    }
    
    if check_out <= check_in {
        return Err("Check-out date must be after check-in date".to_string());
    }
    
    let max_stay = chrono::Duration::days(14);
    if check_out.signed_duration_since(check_in) > max_stay {
        return Err("Maximum stay is 14 nights".to_string());
    }

    Ok(())
}

/// Comprehensive validation for registration data
pub fn validate_registration(data: &RegistrationData) -> Result<(), Vec<String>> {
    let mut errors = Vec::new();

    // Validate pilgrim data
    if let Err(pilgrim_errors) = validate_pilgrim_data(&data.pilgrim) {
        errors.extend(pilgrim_errors);
    }

    // Validate booking data
    if let Err(booking_errors) = validate_booking_data(&data.booking) {
        errors.extend(booking_errors);
    }

    // Validate payment data
    if let Err(payment_errors) = validate_payment_data(&data.payment) {
        errors.extend(payment_errors);
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors)
    }
}

/// Validate pilgrim personal data
fn validate_pilgrim_data(pilgrim: &PilgrimData) -> Result<(), Vec<String>> {
    let mut errors = Vec::new();

    // Name validation
    if pilgrim.first_name.trim().is_empty() || pilgrim.first_name.len() > 50 {
        errors.push("First name is required and must be less than 50 characters".to_string());
    }
    
    if pilgrim.last_name_1.trim().is_empty() || pilgrim.last_name_1.len() > 50 {
        errors.push("Last name is required and must be less than 50 characters".to_string());
    }

    if let Some(ref last_name_2) = pilgrim.last_name_2 {
        if last_name_2.len() > 50 {
            errors.push("Second last name must be less than 50 characters".to_string());
        }
    }

    // Birth date validation
    if let Err(_) = NaiveDate::parse_from_str(&pilgrim.birth_date, "%Y-%m-%d") {
        errors.push("Invalid birth date format. Use YYYY-MM-DD".to_string());
    } else {
        let birth_date = NaiveDate::parse_from_str(&pilgrim.birth_date, "%Y-%m-%d").unwrap();
        let today = Utc::now().date_naive();
        let min_age = today - chrono::Duration::days(365 * 16); // 16 years minimum
        let max_age = today - chrono::Duration::days(365 * 120); // 120 years maximum
        
        if birth_date > min_age {
            errors.push("Pilgrim must be at least 16 years old".to_string());
        }
        if birth_date < max_age {
            errors.push("Please verify birth date".to_string());
        }
    }

    // Document validation
    if !validate_document_type(&pilgrim.document_type) {
        errors.push("Invalid document type".to_string());
    }

    if !validate_spanish_document(&pilgrim.document_type, &pilgrim.document_number) {
        errors.push("Invalid document number format".to_string());
    }

    // Gender validation
    if !["H", "M", "O"].contains(&pilgrim.gender.as_str()) {
        errors.push("Gender must be H (Hombre), M (Mujer), or O (Otro)".to_string());
    }

    // Phone validation
    if !validate_phone(&pilgrim.phone) {
        errors.push("Invalid phone number format".to_string());
    }

    // Email validation (optional)
    if let Some(ref email) = pilgrim.email {
        if !email.is_empty() && !validate_email(email) {
            errors.push("Invalid email format".to_string());
        }
    }

    // Address validation
    if pilgrim.address_country.len() != 3 {
        errors.push("Country code must be 3 characters (ISO 3166-1 alpha-3)".to_string());
    }

    if pilgrim.address_street.trim().is_empty() || pilgrim.address_street.len() > 100 {
        errors.push("Street address is required and must be less than 100 characters".to_string());
    }

    if pilgrim.address_city.trim().is_empty() || pilgrim.address_city.len() > 50 {
        errors.push("City is required and must be less than 50 characters".to_string());
    }

    if pilgrim.address_postal_code.trim().is_empty() || pilgrim.address_postal_code.len() > 10 {
        errors.push("Postal code is required and must be less than 10 characters".to_string());
    }

    // Spanish municipality code validation (if Spain)
    if pilgrim.address_country == "ESP" {
        if let Some(ref code) = pilgrim.address_municipality_code {
            if !validate_spanish_municipality_code(code) {
                errors.push("Invalid Spanish municipality code".to_string());
            }
        }
    }

    // Language validation
    if !validate_language_code(&pilgrim.language) {
        errors.push("Invalid language code".to_string());
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors)
    }
}

/// Validate booking data
fn validate_booking_data(booking: &BookingData) -> Result<(), Vec<String>> {
    let mut errors = Vec::new();

    // Validate dates
    if let Err(date_error) = validate_dates(&booking.check_in_date, &booking.check_out_date) {
        errors.push(date_error);
    }

    // Validate persons count (must be 1 for individual registration)
    if booking.number_of_persons != 1 {
        errors.push("Only individual registrations are allowed (1 person)".to_string());
    }

    // Validate rooms count
    if booking.number_of_rooms != 1 {
        errors.push("Number of rooms must be 1".to_string());
    }

    // Validate nights calculation
    if let Ok(check_in) = NaiveDate::parse_from_str(&booking.check_in_date, "%Y-%m-%d") {
        if let Ok(check_out) = NaiveDate::parse_from_str(&booking.check_out_date, "%Y-%m-%d") {
            let calculated_nights = check_out.signed_duration_since(check_in).num_days() as u32;
            if booking.number_of_nights != calculated_nights {
                errors.push("Number of nights doesn't match date range".to_string());
            }
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors)
    }
}

/// Validate payment data
fn validate_payment_data(payment: &PaymentData) -> Result<(), Vec<String>> {
    let mut errors = Vec::new();

    // Validate amount
    if let Err(_) = payment.amount.parse::<f64>() {
        errors.push("Invalid payment amount format".to_string());
    } else {
        let amount: f64 = payment.amount.parse().unwrap();
        if amount <= 0.0 || amount > 1000.0 {
            errors.push("Payment amount must be between 0 and 1000 EUR".to_string());
        }
    }

    // Validate payment type
    if !["EFECT", "TARJT", "TRANS"].contains(&payment.payment_type.as_str()) {
        errors.push("Invalid payment type. Must be EFECT, TARJT, or TRANS".to_string());
    }

    // Validate currency
    if payment.currency != "EUR" {
        errors.push("Only EUR currency is accepted".to_string());
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors)
    }
}

/// Validate Spanish documents (DNI, NIE, Passport)
pub fn validate_spanish_document(doc_type: &str, doc_number: &str) -> bool {
    match doc_type {
        "NIF" => validate_dni(doc_number),
        "NIE" => validate_nie(doc_number),
        "PAS" => validate_passport(doc_number),
        "OTRO" => doc_number.len() >= 3 && doc_number.len() <= 20,
        _ => false,
    }
}

/// Validate Spanish DNI with checksum
fn validate_dni(dni: &str) -> bool {
    let dni_regex = Regex::new(r"^\d{8}[A-Z]$").unwrap();
    if !dni_regex.is_match(dni) {
        return false;
    }

    let letters = "TRWAGMYFPDXBNJZSQVHLCKE";
    let number_part = &dni[..8];
    let letter_part = &dni[8..9];
    
    if let Ok(number) = number_part.parse::<u32>() {
        let expected_letter = letters.chars().nth((number % 23) as usize).unwrap();
        return letter_part == expected_letter.to_string();
    }
    
    false
}

/// Validate Spanish NIE with checksum
fn validate_nie(nie: &str) -> bool {
    let nie_regex = Regex::new(r"^[XYZ]\d{7}[A-Z]$").unwrap();
    if !nie_regex.is_match(nie) {
        return false;
    }

    let letters = "TRWAGMYFPDXBNJZSQVHLCKE";
    let prefix_map = [('X', 0), ('Y', 1), ('Z', 2)].iter().cloned().collect::<std::collections::HashMap<_, _>>();
    
    let prefix = nie.chars().next().unwrap();
    let number_part = &nie[1..8];
    let letter_part = &nie[8..9];
    
    if let Some(&prefix_value) = prefix_map.get(&prefix) {
        if let Ok(number) = number_part.parse::<u32>() {
            let full_number = prefix_value * 10_000_000 + number;
            let expected_letter = letters.chars().nth((full_number % 23) as usize).unwrap();
            return letter_part == expected_letter.to_string();
        }
    }
    
    false
}

/// Validate passport format (basic)
fn validate_passport(passport: &str) -> bool {
    let passport_regex = Regex::new(r"^[A-Z0-9]{6,12}$").unwrap();
    passport_regex.is_match(passport)
}

/// Validate document type
fn validate_document_type(doc_type: &str) -> bool {
    ["NIF", "NIE", "PAS", "OTRO"].contains(&doc_type)
}

/// Validate phone number
fn validate_phone(phone: &str) -> bool {
    let phone_regex = Regex::new(r"^\+?[\d\s\-\(\)]{7,15}$").unwrap();
    phone_regex.is_match(phone)
}

/// Validate email format
fn validate_email(email: &str) -> bool {
    let email_regex = Regex::new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$").unwrap();
    email_regex.is_match(email)
}

/// Validate Spanish municipality code (5 digits)
fn validate_spanish_municipality_code(code: &str) -> bool {
    let code_regex = Regex::new(r"^\d{5}$").unwrap();
    code_regex.is_match(code)
}

/// Validate language code
fn validate_language_code(lang: &str) -> bool {
    ["es", "en", "fr", "de", "it", "pt", "nl", "ko", "ja", "pl"].contains(&lang)
}

/// Security validation to detect potential injection attempts
pub fn validate_input_security(input: &str) -> bool {
    // Check for common injection patterns
    let dangerous_patterns = [
        "<script", "javascript:", "vbscript:", "onload=", "onerror=",
        "<?php", "<?xml", "SELECT ", "INSERT ", "UPDATE ", "DELETE ",
        "DROP ", "ALTER ", "CREATE ", "EXEC ", "UNION ",
        "../", "..\\", "%2e%2e", "file://", "data:",
    ];

    let input_lower = input.to_lowercase();
    for pattern in &dangerous_patterns {
        if input_lower.contains(pattern) {
            return false;
        }
    }

    // Check for excessive length (potential buffer overflow)
    if input.len() > 1000 {
        return false;
    }

    // Check for control characters
    for char in input.chars() {
        if char.is_control() && char != '\t' && char != '\n' && char != '\r' {
            return false;
        }
    }

    true
}

/// Sanitize input to prevent XSS and injection
pub fn sanitize_input(input: &str) -> String {
    input
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#x27;")
        .replace('&', "&amp;")
        .chars()
        .filter(|c| !c.is_control() || *c == '\t' || *c == '\n' || *c == '\r')
        .collect()
}