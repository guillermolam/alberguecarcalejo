#!/bin/bash
set -e

echo "🗄️  PostgreSQL Migration Script for Albergue del Carrascalejo"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ] && [ -z "$NEON_DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL or NEON_DATABASE_URL environment variable not set"
    echo "   Set your NeonDB connection string in Replit Secrets"
    exit 1
fi

# Use NEON_DATABASE_URL if available, otherwise DATABASE_URL
DB_URL=${NEON_DATABASE_URL:-$DATABASE_URL}

echo "📡 Connecting to NeonDB..."
echo "   Database: $(echo $DB_URL | sed 's/.*@//' | sed 's/\/.*//')"

# Check if sqlx CLI is installed
if ! command -v sqlx &> /dev/null; then
    echo "🔧 Installing sqlx CLI..."
    cargo install sqlx-cli --no-default-features --features native-tls,postgres
fi

# Create migrations directory if it doesn't exist
mkdir -p database/migrations

# Run the schema
echo "🏗️  Creating database schema..."
if command -v psql &> /dev/null; then
    psql "$DB_URL" -f database/schemas/postgres.sql
else
    echo "   Using sqlx to execute schema..."
    sqlx database create --database-url "$DB_URL" 2>/dev/null || echo "   Database already exists"
    sqlx migrate run --database-url "$DB_URL" --source database/migrations 2>/dev/null || true
    
    # If no migrations exist, create from schema
    if [ ! -f database/migrations/001_initial_schema.sql ]; then
        echo "   Creating initial migration from schema..."
        cp database/schemas/postgres.sql database/migrations/001_initial_schema.sql
        sqlx migrate run --database-url "$DB_URL" --source database/migrations
    fi
fi

# Seed essential data
echo "🌱 Seeding essential data..."
psql "$DB_URL" << EOF || echo "   Seed data may already exist"
-- Insert common bed configuration
INSERT INTO beds (bed_number, room_type, price_per_night) VALUES
    -- Dorm A (12 beds)
    (1, 'dorm_a', 15.00), (2, 'dorm_a', 15.00), (3, 'dorm_a', 15.00),
    (4, 'dorm_a', 15.00), (5, 'dorm_a', 15.00), (6, 'dorm_a', 15.00),
    (7, 'dorm_a', 15.00), (8, 'dorm_a', 15.00), (9, 'dorm_a', 15.00),
    (10, 'dorm_a', 15.00), (11, 'dorm_a', 15.00), (12, 'dorm_a', 15.00),
    -- Dorm B (10 beds)
    (13, 'dorm_b', 15.00), (14, 'dorm_b', 15.00), (15, 'dorm_b', 15.00),
    (16, 'dorm_b', 15.00), (17, 'dorm_b', 15.00), (18, 'dorm_b', 15.00),
    (19, 'dorm_b', 15.00), (20, 'dorm_b', 15.00), (21, 'dorm_b', 15.00),
    (22, 'dorm_b', 15.00),
    -- Private rooms (2 beds)
    (23, 'private', 35.00), (24, 'private', 35.00)
ON CONFLICT (bed_number) DO NOTHING;

-- Insert common countries
INSERT INTO countries (code, name, nationality) VALUES
    ('ES', 'España', 'Española'),
    ('PT', 'Portugal', 'Portuguesa'),
    ('FR', 'Francia', 'Francesa'),
    ('DE', 'Alemania', 'Alemana'),
    ('IT', 'Italia', 'Italiana'),
    ('GB', 'Reino Unido', 'Británica'),
    ('US', 'Estados Unidos', 'Estadounidense'),
    ('BR', 'Brasil', 'Brasileña'),
    ('AR', 'Argentina', 'Argentina'),
    ('KR', 'Corea del Sur', 'Coreana')
ON CONFLICT (code) DO NOTHING;

-- Insert default pricing
INSERT INTO pricing (room_type, effective_date, price_per_night) VALUES
    ('dorm_a', CURRENT_DATE, 15.00),
    ('dorm_b', CURRENT_DATE, 15.00),
    ('private', CURRENT_DATE, 35.00)
ON CONFLICT (room_type, effective_date) DO NOTHING;
EOF

echo "✅ PostgreSQL database setup complete!"
echo "   📊 Total beds: 24 (12 dorm A + 10 dorm B + 2 private)"
echo "   🌍 Countries seeded: 10 common nationalities"
echo "   💰 Pricing: €15/night (dorms), €35/night (private)"
echo ""
echo "🔗 Connection details:"
echo "   URL: $DB_URL"
echo "   Use this in your .env: DATABASE_URL=$DB_URL"