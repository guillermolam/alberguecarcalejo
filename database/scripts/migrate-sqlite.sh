#!/bin/bash
set -e

echo "🗄️  SQLite Migration Script for Spin/Fermyon Deployment"

# Set SQLite database path
SQLITE_DB=${SQLITE_DATABASE:-"./albergue.db"}

echo "📁 Creating SQLite database: $SQLITE_DB"

# Remove existing database for fresh start
rm -f "$SQLITE_DB"

# Create database and schema
echo "🏗️  Creating database schema..."
sqlite3 "$SQLITE_DB" < database/schemas/sqlite.sql

# Seed essential data
echo "🌱 Seeding essential data..."
sqlite3 "$SQLITE_DB" << 'EOF'
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
    (23, 'private', 35.00), (24, 'private', 35.00);

-- Insert common countries
INSERT INTO countries (code, name, nationality, requires_visa) VALUES
    ('ES', 'España', 'Española', 0),
    ('PT', 'Portugal', 'Portuguesa', 0),
    ('FR', 'Francia', 'Francesa', 0),
    ('DE', 'Alemania', 'Alemana', 0),
    ('IT', 'Italia', 'Italiana', 0),
    ('GB', 'Reino Unido', 'Británica', 0),
    ('US', 'Estados Unidos', 'Estadounidense', 0),
    ('BR', 'Brasil', 'Brasileña', 1),
    ('AR', 'Argentina', 'Argentina', 1),
    ('KR', 'Corea del Sur', 'Coreana', 1);

-- Insert default pricing
INSERT INTO pricing (room_type, effective_date, price_per_night) VALUES
    ('dorm_a', date('now'), 15.00),
    ('dorm_b', date('now'), 15.00),
    ('private', date('now'), 35.00);
EOF

echo "✅ SQLite database setup complete!"
echo "   📄 Database: $SQLITE_DB"
echo "   📊 Total beds: 24 (12 dorm A + 10 dorm B + 2 private)"
echo "   🌍 Countries seeded: 10 common nationalities"  
echo "   💰 Pricing: €15/night (dorms), €35/night (private)"
echo ""
echo "🔧 For Spin deployment, copy this database to your component:"
echo "   cp $SQLITE_DB services/booking-service/"
echo ""
echo "📝 Add to your Spin component configuration:"
echo "   [component.booking-service.files]"
echo "   \"/albergue.db\" = \"albergue.db\""