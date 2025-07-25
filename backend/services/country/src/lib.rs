use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CountryInfo {
    pub calling_code: String,
    pub flag_url: String,
    pub country_code: String,
    pub country_name: String,
}

#[wasm_bindgen]
pub struct CountryService {
    cache: HashMap<String, CountryInfo>,
}

#[wasm_bindgen]
impl CountryService {
    #[wasm_bindgen(constructor)]
    pub fn new() -> CountryService {
        CountryService {
            cache: HashMap::new(),
        }
    }

    #[wasm_bindgen]
    pub async fn get_country_info(&mut self, country_name: &str) -> Result<String, JsValue> {
        let key = country_name.to_lowercase();
        
        // Check cache first
        if let Some(cached) = self.cache.get(&key) {
            return Ok(serde_json::to_string(cached).unwrap());
        }

        // Fallback data for common countries
        let fallback_data = self.get_fallback_data();
        
        if let Some(fallback) = fallback_data.get(country_name) {
            self.cache.insert(key, fallback.clone());
            return Ok(serde_json::to_string(fallback).unwrap());
        }

        // Try REST Countries API
        match self.fetch_from_api(country_name).await {
            Ok(country_info) => {
                self.cache.insert(key, country_info.clone());
                Ok(serde_json::to_string(&country_info).unwrap())
            }
            Err(_) => {
                // Return default/empty response if API fails
                let default = CountryInfo {
                    calling_code: String::new(),
                    flag_url: String::new(),
                    country_code: String::new(),
                    country_name: country_name.to_string(),
                };
                Ok(serde_json::to_string(&default).unwrap())
            }
        }
    }

    async fn fetch_from_api(&self, country_name: &str) -> Result<CountryInfo, JsValue> {
        let url = format!(
            "https://restcountries.com/v3.1/name/{}?fields=name,flag,idd,cca3",
            js_sys::encode_uri_component(country_name)
        );

        let window = web_sys::window().unwrap();
        let resp_value = JsFuture::from(window.fetch_with_str(&url)).await?;
        let resp: web_sys::Response = resp_value.dyn_into().unwrap();
        
        if !resp.ok() {
            return Err(JsValue::from_str("API request failed"));
        }

        let json = JsFuture::from(resp.json()?).await?;
        let countries: Vec<serde_json::Value> = serde_json::from_str(
            &js_sys::JSON::stringify(&json)?.as_string().unwrap()
        ).map_err(|_| JsValue::from_str("JSON parse error"))?;

        if let Some(country) = countries.first() {
            let calling_code = format!(
                "{}{}",
                country["idd"]["root"].as_str().unwrap_or(""),
                country["idd"]["suffixes"][0].as_str().unwrap_or("")
            );

            Ok(CountryInfo {
                calling_code,
                flag_url: country["flag"].as_str().unwrap_or("").to_string(),
                country_code: country["cca3"].as_str().unwrap_or("").to_string(),
                country_name: country["name"]["common"].as_str().unwrap_or(country_name).to_string(),
            })
        } else {
            Err(JsValue::from_str("No country data found"))
        }
    }

    fn get_fallback_data(&self) -> HashMap<&str, CountryInfo> {
        let mut data = HashMap::new();
        
        data.insert("Spain", CountryInfo {
            calling_code: "+34".to_string(),
            flag_url: "https://flagcdn.com/w320/es.png".to_string(),
            country_code: "ESP".to_string(),
            country_name: "Spain".to_string(),
        });
        
        data.insert("France", CountryInfo {
            calling_code: "+33".to_string(),
            flag_url: "https://flagcdn.com/w320/fr.png".to_string(),
            country_code: "FRA".to_string(),
            country_name: "France".to_string(),
        });
        
        data.insert("Germany", CountryInfo {
            calling_code: "+49".to_string(),
            flag_url: "https://flagcdn.com/w320/de.png".to_string(),
            country_code: "DEU".to_string(),
            country_name: "Germany".to_string(),
        });
        
        data.insert("Portugal", CountryInfo {
            calling_code: "+351".to_string(),
            flag_url: "https://flagcdn.com/w320/pt.png".to_string(),
            country_code: "PRT".to_string(),
            country_name: "Portugal".to_string(),
        });

        data
    }
}