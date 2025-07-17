use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[derive(Serialize, Deserialize, Debug)]
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

// Cache for country data
static mut COUNTRY_CACHE: Option<HashMap<String, CountryInfo>> = None;

#[wasm_bindgen]
pub async fn get_country_info(country_name: &str) -> Result<JsValue, JsValue> {
    console_log!("Fetching country info for: {}", country_name);
    
    // Initialize cache if needed
    unsafe {
        if COUNTRY_CACHE.is_none() {
            COUNTRY_CACHE = Some(HashMap::new());
        }
    }
    
    // Check cache first
    let cache_key = country_name.to_lowercase();
    unsafe {
        if let Some(ref cache) = COUNTRY_CACHE {
            if let Some(cached_info) = cache.get(&cache_key) {
                console_log!("Returning cached data for: {}", country_name);
                return Ok(serde_wasm_bindgen::to_value(cached_info)?);
            }
        }
    }
    
    // Fetch from REST Countries API
    let url = format!("https://restcountries.com/v3.1/name/{}", country_name);
    
    let window = web_sys::window().unwrap();
    let resp_value = wasm_bindgen_futures::JsFuture::from(window.fetch_with_str(&url)).await?;
    let resp: web_sys::Response = resp_value.dyn_into().unwrap();
    
    if !resp.ok() {
        return Err(JsValue::from_str(&format!("HTTP error: {}", resp.status())));
    }
    
    let json = wasm_bindgen_futures::JsFuture::from(resp.json()?).await?;
    let countries: Vec<RestCountryResponse> = serde_wasm_bindgen::from_value(json)?;
    
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
    
    // Extract flag URL
    let flag_url = country.flags.svg.clone()
        .or_else(|| country.flags.png.clone())
        .unwrap_or_else(|| "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMTUiIHZpZXdCb3g9IjAgMCAyMCAxNSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjE1IiBmaWxsPSIjQ0NDIi8+Cjx0ZXh0IHg9IjEwIiB5PSI4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjgiIGZpbGw9IiM2NjYiPj88L3RleHQ+Cjwvc3ZnPg==".to_string());
    
    let country_info = CountryInfo {
        calling_code,
        flag_url,
        country_code: country.cca2.clone(),
        country_name: country.name.common.clone(),
    };
    
    // Cache the result
    unsafe {
        if let Some(ref mut cache) = COUNTRY_CACHE {
            cache.insert(cache_key, country_info.clone());
        }
    }
    
    console_log!("Successfully fetched country info: {:?}", country_info);
    Ok(serde_wasm_bindgen::to_value(&country_info)?)
}

#[wasm_bindgen]
pub fn init_country_service() {
    console_log!("Country service initialized");
}