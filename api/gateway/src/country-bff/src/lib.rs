use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use gloo_net::http::Request;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CountryInfo {
    pub calling_code: String,
    pub flag_url: String,
    pub country_code: String,
    pub country_name: String,
}

#[derive(Deserialize, Debug)]
struct RestCountryResponse {
    name: RestCountryName,
    idd: Option<RestCountryIdd>,
    flags: RestCountryFlags,
    cca2: String,
}

#[derive(Deserialize, Debug)]
struct RestCountryName {
    common: String,
}

#[derive(Deserialize, Debug)]
struct RestCountryIdd {
    root: Option<String>,
    suffixes: Option<Vec<String>>,
}

#[derive(Deserialize, Debug)]
struct RestCountryFlags {
    svg: Option<String>,
    png: Option<String>,
}

// Cache for country data with timeout
static mut COUNTRY_CACHE: Option<HashMap<String, (CountryInfo, f64)>> = None;
const CACHE_DURATION_MS: f64 = 3600000.0; // 1 hour

fn get_current_time() -> f64 {
    js_sys::Date::now()
}

#[wasm_bindgen]
pub async fn fetch_country_info(country_name: &str) -> Result<JsValue, JsValue> {
    console_log!("BFF: Fetching country info for: {}", country_name);
    
    // Rate limiting check
    if !check_rate_limit() {
        return Err(JsValue::from_str("Rate limit exceeded"));
    }
    
    // Initialize cache if needed
    unsafe {
        if COUNTRY_CACHE.is_none() {
            COUNTRY_CACHE = Some(HashMap::new());
        }
    }
    
    // Check cache first
    let cache_key = country_name.to_lowercase();
    let current_time = get_current_time();
    
    unsafe {
        if let Some(ref cache) = COUNTRY_CACHE {
            if let Some((cached_info, timestamp)) = cache.get(&cache_key) {
                if current_time - timestamp < CACHE_DURATION_MS {
                    console_log!("BFF: Returning cached data for: {}", country_name);
                    return Ok(serde_wasm_bindgen::to_value(cached_info)?);
                }
            }
        }
    }
    
    // Fetch from REST Countries API
    let url = format!("https://restcountries.com/v3.1/name/{}", country_name);
    
    let response = Request::get(&url)
        .send()
        .await
        .map_err(|e| JsValue::from_str(&format!("Request failed: {:?}", e)))?;
    
    if !response.ok() {
        return Err(JsValue::from_str(&format!("HTTP error: {}", response.status())));
    }
    
    let countries: Vec<RestCountryResponse> = response
        .json()
        .await
        .map_err(|e| JsValue::from_str(&format!("JSON parse error: {:?}", e)))?;
    
    if countries.is_empty() {
        return Err(JsValue::from_str("No country found"));
    }
    
    let country = &countries[0];
    
    // Extract calling code
    let calling_code = if let Some(ref idd) = country.idd {
        let root = idd.root.as_deref().unwrap_or("");
        let suffix = idd.suffixes.as_ref()
            .and_then(|suffixes| suffixes.first())
            .map(|s| s.as_str())
            .unwrap_or("");
        format!("{}{}", root, suffix)
    } else {
        "+".to_string()
    };
    
    // Extract flag URL with fallback
    let flag_url = country.flags.svg.clone()
        .or_else(|| country.flags.png.clone())
        .unwrap_or_else(|| generate_fallback_flag(&country.cca2));
    
    let country_info = CountryInfo {
        calling_code,
        flag_url,
        country_code: country.cca2.clone(),
        country_name: country.name.common.clone(),
    };
    
    // Cache the result with timestamp
    unsafe {
        if let Some(ref mut cache) = COUNTRY_CACHE {
            cache.insert(cache_key, (country_info.clone(), current_time));
        }
    }
    
    console_log!("BFF: Successfully fetched country info: {:?}", country_info);
    Ok(serde_wasm_bindgen::to_value(&country_info)?)
}

fn generate_fallback_flag(country_code: &str) -> String {
    // Generate a simple SVG flag as fallback
    format!(
        "data:image/svg+xml;base64,{}",
        base64_encode(&format!(
            r#"<svg width="30" height="20" viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg">
                <rect width="30" height="20" fill="#f0f0f0" stroke="#ccc" stroke-width="1"/>
                <text x="15" y="12" text-anchor="middle" font-size="8" font-family="Arial" fill="#666">{}</text>
            </svg>"#,
            country_code
        ))
    )
}

fn base64_encode(input: &str) -> String {
    // Simple base64 encoding for fallback flag
    use js_sys::Uint8Array;
    let bytes = Uint8Array::from(input.as_bytes());
    js_sys::encode_uri_component(&format!("{:?}", bytes))
}

// Rate limiting state
static mut LAST_REQUEST_TIME: f64 = 0.0;
static mut REQUEST_COUNT: u32 = 0;
const RATE_LIMIT_WINDOW_MS: f64 = 60000.0; // 1 minute
const MAX_REQUESTS_PER_WINDOW: u32 = 10;

fn check_rate_limit() -> bool {
    let current_time = get_current_time();
    
    unsafe {
        if current_time - LAST_REQUEST_TIME > RATE_LIMIT_WINDOW_MS {
            // Reset window
            LAST_REQUEST_TIME = current_time;
            REQUEST_COUNT = 1;
            true
        } else if REQUEST_COUNT < MAX_REQUESTS_PER_WINDOW {
            REQUEST_COUNT += 1;
            true
        } else {
            false
        }
    }
}

#[wasm_bindgen]
pub fn init_country_bff() {
    console_log!("Country BFF initialized with caching and rate limiting");
}

#[wasm_bindgen]
pub fn clear_country_cache() {
    unsafe {
        COUNTRY_CACHE = Some(HashMap::new());
    }
    console_log!("Country cache cleared");
}