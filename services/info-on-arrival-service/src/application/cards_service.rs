use crate::domain::*;
use crate::ports::*;
use shared::{AlbergueError, AlbergueResult};
use serde_json;

pub struct CardsServiceImpl {
    storage: Box<dyn StoragePort>,
    scraper: Box<dyn ScraperPort>,
}

impl CardsServiceImpl {
    pub fn new() -> Self {
        Self {
            storage: Box::new(crate::adapters::storage::PostgresCardsRepository::new()),
            scraper: Box::new(crate::adapters::scraper::MeridaScraperAdapter::new()),
        }
    }

    pub async fn get_merida_attractions(&self) -> AlbergueResult<String> {
        // Try to get cached content first
        if let Ok(cached_card) = self.storage.get_card_by_type(CardType::MeridaAttractions).await {
            if !cached_card.is_cache_expired() {
                return Ok(serde_json::to_string(&cached_card)?);
            }
        }

        // Scrape fresh content
        let scraped_content = self.scraper.scrape_merida_attractions().await?;
        
        let attractions_card = InfoCard::new(
            CardType::MeridaAttractions,
            "Qué ver en Mérida".to_string(),
            format!(
                "Descubre los tesoros romanos de Mérida:\n\n{}\n\nMérida es un verdadero museo al aire libre con más de 2000 años de historia.",
                scraped_content.content
            ),
        )
        .with_links(vec![
            InfoLink {
                title: "Teatro Romano".to_string(),
                url: "https://www.consorciomerida.org/teatro-romano".to_string(),
                description: Some("Espectacular teatro del siglo I a.C.".to_string()),
                link_type: LinkType::Website,
            },
            InfoLink {
                title: "Anfiteatro Romano".to_string(),
                url: "https://www.consorciomerida.org/anfiteatro".to_string(),
                description: Some("Donde luchaban los gladiadores".to_string()),
                link_type: LinkType::Website,
            },
            InfoLink {
                title: "Museo Nacional de Arte Romano".to_string(),
                url: "https://www.culturaydeporte.gob.es/mnar".to_string(),
                description: Some("Impresionante colección de arte romano".to_string()),
                link_type: LinkType::Website,
            },
            InfoLink {
                title: "Puente Romano".to_string(),
                url: "https://goo.gl/maps/example".to_string(),
                description: Some("Uno de los puentes romanos mejor conservados".to_string()),
                link_type: LinkType::Map,
            },
        ])
        .with_priority(1)
        .with_source_url(scraped_content.source_url);

        // Save to cache
        self.storage.save_card(attractions_card.clone()).await?;

        Ok(serde_json::to_string(&attractions_card)?)
    }

    pub async fn get_carrascalejo_info(&self) -> AlbergueResult<String> {
        if let Ok(cached_card) = self.storage.get_card_by_type(CardType::CarrascalejoInfo).await {
            if !cached_card.is_cache_expired() {
                return Ok(serde_json::to_string(&cached_card)?);
            }
        }

        let carrascalejo_card = InfoCard::new(
            CardType::CarrascalejoInfo,
            "El Carrascalejo - Curiosidades".to_string(),
            r#"¡Bienvenido a Carrascalejo! 🏘️

Este pequeño pueblo de apenas 300 habitantes guarda secretos fascinantes:

**Historia del Camino:**
• Antigua calzada romana de la Vía de la Plata
• Los peregrinos pasan por aquí desde hace más de 1000 años
• El nombre viene de "carrascal" - bosque de encinas

**Curiosidades locales:**
• El pueblo tiene más camas de albergue que habitantes 😄
• La iglesia parroquial data del siglo XVI
• Famoso por sus productos ibéricos y aceite de oliva
• Los vecinos conocen a cada peregrino por su nombre

**Tradiciones:**
• Fiesta patronal: San Bartolomé (24 de agosto)
• Matanza tradicional en invierno
• Recogida de aceitunas en familia

**El Albergue:**
• Único albergue del pueblo, referencia en la Vía de la Plata
• Atención personalizada y ambiente familiar
• Desayuno casero con productos locales"#.to_string(),
        )
        .with_links(vec![
            InfoLink {
                title: "Ayuntamiento de Carrascalejo".to_string(),
                url: "tel:+34924123456".to_string(),
                description: Some("Información municipal".to_string()),
                link_type: LinkType::Phone,
            },
            InfoLink {
                title: "Centro de Salud".to_string(),
                url: "tel:+34924654321".to_string(),
                description: Some("Atención médica básica".to_string()),
                link_type: LinkType::Phone,
            },
        ])
        .with_priority(2);

        self.storage.save_card(carrascalejo_card.clone()).await?;
        Ok(serde_json::to_string(&carrascalejo_card)?)
    }

    pub async fn get_emergency_contacts(&self) -> AlbergueResult<String> {
        let emergency_card = InfoCard::new(
            CardType::EmergencyContacts,
            "Emergencias y Contactos Útiles".to_string(),
            "Números importantes para tu seguridad:".to_string(),
        )
        .with_links(vec![
            InfoLink {
                title: "🚨 Emergencias".to_string(),
                url: "tel:112".to_string(),
                description: Some("Número europeo de emergencias (24h)".to_string()),
                link_type: LinkType::Emergency,
            },
            InfoLink {
                title: "👮 Guardia Civil".to_string(),
                url: "tel:062".to_string(),
                description: Some("Fuerzas de seguridad (24h)".to_string()),
                link_type: LinkType::Emergency,
            },
            InfoLink {
                title: "🏥 Centro de Salud Mérida".to_string(),
                url: "tel:+34924330000".to_string(),
                description: Some("Hospital más cercano (20 km)".to_string()),
                link_type: LinkType::Phone,
            },
            InfoLink {
                title: "💊 Farmacia Almendralejo".to_string(),
                url: "tel:+34924660123".to_string(),
                description: Some("Farmacia 24h más cercana".to_string()),
                link_type: LinkType::Phone,
            },
            InfoLink {
                title: "🚕 Taxi Local".to_string(),
                url: "tel:+34924987654".to_string(),
                description: Some("Servicio de taxi local".to_string()),
                link_type: LinkType::Phone,
            },
            InfoLink {
                title: "ℹ️ Oficina de Turismo Mérida".to_string(),
                url: "tel:+34924315353".to_string(),
                description: Some("Información turística (9-14h, 16-19h)".to_string()),
                link_type: LinkType::Phone,
            },
        ])
        .with_priority(10); // High priority for emergency info

        Ok(serde_json::to_string(&emergency_card)?)
    }

    pub async fn get_route_map(&self, next_stage: &str) -> AlbergueResult<String> {
        let route_data = match next_stage {
            "almendralejo" | "Almendralejo" => RouteMapData::default(),
            "merida" | "Mérida" => RouteMapData {
                current_location: "Albergue del Carrascalejo".to_string(),
                next_stage: "Mérida".to_string(),
                distance_km: 38.0,
                estimated_time_hours: 8.5,
                difficulty_level: DifficultyLevel::Moderate,
                route_description: "Etapa larga pero hermosa hacia la capital romana".to_string(),
                waypoints: vec![
                    Waypoint {
                        name: "Carrascalejo".to_string(),
                        latitude: 38.9167,
                        longitude: -6.1833,
                        description: Some("Salida del albergue".to_string()),
                        services: vec!["accommodation".to_string(), "food".to_string()],
                    },
                    Waypoint {
                        name: "Aljucén".to_string(),
                        latitude: 38.8500,
                        longitude: -6.2833,
                        description: Some("Pueblo intermedio con bar".to_string()),
                        services: vec!["food".to_string(), "water".to_string()],
                    },
                    Waypoint {
                        name: "Mérida".to_string(),
                        latitude: 38.9165,
                        longitude: -6.3500,
                        description: Some("Ciudad romana patrimonio UNESCO".to_string()),
                        services: vec!["accommodation".to_string(), "food".to_string(), "medical".to_string()],
                    },
                ],
                map_embed_url: "https://www.openstreetmap.org/export/embed.html?bbox=-6.4,-6.1,38.8,39.0&layer=mapnik".to_string(),
            },
            _ => RouteMapData::default(),
        };

        let map_card = InfoCard::new(
            CardType::RouteMap,
            format!("Ruta hacia {}", route_data.next_stage),
            format!(
                "📍 **Próxima etapa:** {}\n📏 **Distancia:** {:.1} km\n⏱️ **Tiempo estimado:** {:.1} horas\n🏔️ **Dificultad:** {:?}\n\n{}",
                route_data.next_stage,
                route_data.distance_km,
                route_data.estimated_time_hours,
                route_data.difficulty_level,
                route_data.route_description
            ),
        )
        .with_links(vec![
            InfoLink {
                title: "🗺️ Ver mapa interactivo".to_string(),
                url: route_data.map_embed_url.clone(),
                description: Some("Mapa detallado de la ruta".to_string()),
                link_type: LinkType::Map,
            },
            InfoLink {
                title: "🌤️ Previsión meteorológica".to_string(),
                url: format!("https://www.aemet.es/es/eltiempo/prediccion/municipios/{}", next_stage.to_lowercase()),
                description: Some("Consulta el tiempo antes de salir".to_string()),
                link_type: LinkType::Website,
            },
        ])
        .with_priority(3);

        Ok(serde_json::to_string(&map_card)?)
    }

    pub async fn get_all_info_cards(&self) -> AlbergueResult<String> {
        let mut all_cards = Vec::new();

        // Get all card types
        if let Ok(card) = self.get_merida_attractions().await {
            if let Ok(parsed) = serde_json::from_str::<InfoCard>(&card) {
                all_cards.push(parsed);
            }
        }

        if let Ok(card) = self.get_carrascalejo_info().await {
            if let Ok(parsed) = serde_json::from_str::<InfoCard>(&card) {
                all_cards.push(parsed);
            }
        }

        if let Ok(card) = self.get_emergency_contacts().await {
            if let Ok(parsed) = serde_json::from_str::<InfoCard>(&card) {
                all_cards.push(parsed);
            }
        }

        if let Ok(card) = self.get_route_map("almendralejo").await {
            if let Ok(parsed) = serde_json::from_str::<InfoCard>(&card) {
                all_cards.push(parsed);
            }
        }

        // Sort by priority
        all_cards.sort_by(|a, b| b.priority.cmp(&a.priority));

        Ok(serde_json::to_string(&all_cards)?)
    }

    pub async fn update_card_content(&self, card_id: &str, content: &str) -> AlbergueResult<String> {
        let card_uuid = uuid::Uuid::parse_str(card_id)
            .map_err(|_| AlbergueError::ValidationError("Invalid card ID format".to_string()))?;

        let mut card = self.storage.get_card_by_id(card_uuid).await?;
        card.update_content(content.to_string());
        
        self.storage.save_card(card.clone()).await?;
        
        Ok(serde_json::to_string(&card)?)
    }
}