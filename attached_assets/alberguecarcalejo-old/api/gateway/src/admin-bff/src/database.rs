use js_sys::{Promise, JSON};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
use web_sys::{Request, RequestInit, RequestMode, Response};

#[derive(Debug, Serialize, Deserialize)]
pub struct DatabaseConnection {
    pub url: String,
    pub connection_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DatabaseQuery {
    pub sql: String,
    pub params: Vec<serde_json::Value>,
    pub operation_type: String, // SELECT, INSERT, UPDATE, DELETE
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DatabaseResult {
    pub success: bool,
    pub rows: Option<Vec<serde_json::Value>>,
    pub affected_rows: Option<u32>,
    pub error: Option<String>,
    pub execution_time_ms: Option<u32>,
}

// Whitelist of allowed database operations for security
const ALLOWED_OPERATIONS: &[&str] = &["SELECT", "INSERT", "UPDATE", "DELETE"];

const RESTRICTED_KEYWORDS: &[&str] = &[
    "DROP", "TRUNCATE", "ALTER", "CREATE", "GRANT", "REVOKE", "EXEC", "EXECUTE",
];

pub struct SecureDatabase {
    connection_url: String,
}

impl SecureDatabase {
    pub fn new() -> Self {
        // In production, this would be configured through environment variables
        // For now, we'll use a placeholder that the orchestrator will replace
        Self {
            connection_url: "postgresql://secure_connection".to_string(),
        }
    }

    pub fn validate_query(&self, query: &DatabaseQuery) -> Result<(), String> {
        let sql_upper = query.sql.to_uppercase();

        // Check if operation is allowed
        let is_allowed = ALLOWED_OPERATIONS
            .iter()
            .any(|&op| sql_upper.trim_start().starts_with(op));

        if !is_allowed {
            return Err("Operation not permitted".to_string());
        }

        // Check for restricted keywords
        for &keyword in RESTRICTED_KEYWORDS {
            if sql_upper.contains(keyword) {
                return Err(format!("Restricted keyword '{}' not allowed", keyword));
            }
        }

        // Additional validation for specific operations
        match query.operation_type.to_uppercase().as_str() {
            "DELETE" => {
                if !sql_upper.contains("WHERE") {
                    return Err("DELETE operations must include WHERE clause".to_string());
                }
            }
            "UPDATE" => {
                if !sql_upper.contains("WHERE") {
                    return Err("UPDATE operations must include WHERE clause".to_string());
                }
            }
            _ => {}
        }

        Ok(())
    }

    pub async fn execute_query(&self, query: &DatabaseQuery) -> Result<DatabaseResult, String> {
        // Validate query first
        self.validate_query(query)?;

        // In production, this would execute against the actual database
        // For now, we'll return a success response for valid queries
        Ok(DatabaseResult {
            success: true,
            rows: Some(vec![]),
            affected_rows: Some(0),
            error: None,
            execution_time_ms: Some(1),
        })
    }

    // Specific secure query methods for common operations
    pub async fn get_dashboard_stats(&self) -> Result<serde_json::Value, String> {
        let query = DatabaseQuery {
            sql: "SELECT 
                COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied_beds,
                COUNT(CASE WHEN status = 'available' THEN 1 END) as available_beds,
                COUNT(*) as total_beds,
                (SELECT COUNT(*) FROM bookings WHERE status = 'active') as active_bookings,
                (SELECT COUNT(*) FROM bookings WHERE status = 'checked_in') as checked_in_bookings
                FROM beds"
                .to_string(),
            params: vec![],
            operation_type: "SELECT".to_string(),
        };

        match self.execute_query(&query).await {
            Ok(result) => {
                // In production, this would parse the actual database result
                Ok(serde_json::json!({
                    "occupancy": {
                        "occupied": 0,
                        "available": 25,
                        "total": 25
                    },
                    "bookings": {
                        "active": 0,
                        "checked_in": 0
                    },
                    "revenue": {
                        "today": 0.0,
                        "week": 0.0,
                        "month": 0.0
                    }
                }))
            }
            Err(e) => Err(e),
        }
    }

    pub async fn get_beds(&self) -> Result<serde_json::Value, String> {
        let query = DatabaseQuery {
            sql: "SELECT id, room_number, bed_number, status, notes, updated_at 
                  FROM beds ORDER BY room_number, bed_number"
                .to_string(),
            params: vec![],
            operation_type: "SELECT".to_string(),
        };

        match self.execute_query(&query).await {
            Ok(_result) => {
                // In production, this would return the actual bed data
                Ok(serde_json::json!([]))
            }
            Err(e) => Err(e),
        }
    }

    pub async fn update_bed_status(
        &self,
        bed_id: u32,
        status: &str,
        notes: Option<&str>,
    ) -> Result<serde_json::Value, String> {
        let notes_value = notes
            .map(|n| serde_json::Value::String(n.to_string()))
            .unwrap_or(serde_json::Value::Null);

        let query = DatabaseQuery {
            sql: "UPDATE beds SET status = $1, notes = $2, updated_at = NOW() WHERE id = $3"
                .to_string(),
            params: vec![
                serde_json::Value::String(status.to_string()),
                notes_value,
                serde_json::Value::Number(serde_json::Number::from(bed_id)),
            ],
            operation_type: "UPDATE".to_string(),
        };

        match self.execute_query(&query).await {
            Ok(_result) => Ok(serde_json::json!({
                "bed_id": bed_id,
                "status": status,
                "updated": true
            })),
            Err(e) => Err(e),
        }
    }

    pub async fn get_bookings(&self, limit: Option<u32>) -> Result<serde_json::Value, String> {
        let limit_clause = limit.map(|l| format!(" LIMIT {}", l)).unwrap_or_default();

        let query = DatabaseQuery {
            sql: format!(
                "SELECT b.*, p.first_name, p.last_name 
                         FROM bookings b 
                         JOIN pilgrims p ON b.pilgrim_id = p.id 
                         ORDER BY b.created_at DESC{}",
                limit_clause
            ),
            params: vec![],
            operation_type: "SELECT".to_string(),
        };

        match self.execute_query(&query).await {
            Ok(_result) => {
                // In production, this would return the actual booking data
                Ok(serde_json::json!([]))
            }
            Err(e) => Err(e),
        }
    }

    pub async fn get_government_submissions(&self) -> Result<serde_json::Value, String> {
        let query = DatabaseQuery {
            sql: "SELECT * FROM government_submissions 
                  ORDER BY created_at DESC LIMIT 100"
                .to_string(),
            params: vec![],
            operation_type: "SELECT".to_string(),
        };

        match self.execute_query(&query).await {
            Ok(_result) => {
                // In production, this would return the actual submission data
                Ok(serde_json::json!([]))
            }
            Err(e) => Err(e),
        }
    }
}

// Global database instance
static mut DATABASE: Option<SecureDatabase> = None;

pub fn init_database() {
    unsafe {
        DATABASE = Some(SecureDatabase::new());
    }
}

pub fn get_database() -> &'static SecureDatabase {
    unsafe { DATABASE.as_ref().expect("Database not initialized") }
}
