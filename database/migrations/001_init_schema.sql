-- Initial schema for Albergue del Carrascalejo
-- Creates core tables for pilgrim management, booking system, and bed inventory

-- Enable UUID extension (PostgreSQL only)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Countries table for nationality validation
CREATE TABLE countries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(2) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    nationality VARCHAR(100) NOT NULL,
    requires_visa BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pilgrims/guests table
CREATE TABLE pilgrims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_type VARCHAR(20) NOT NULL CHECK (document_type IN ('DNI', 'NIE', 'PASSPORT')),
    document_number VARCHAR(50) NOT NULL,
    document_checksum_valid BOOLEAN DEFAULT FALSE,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    nationality_code VARCHAR(2) REFERENCES countries(code),
    birth_date DATE,
    emergency_contact VARCHAR(255),
    emergency_phone VARCHAR(50),
    -- OCR and validation data
    document_confidence DECIMAL(3,2) DEFAULT 0.0,
    ocr_extracted_data JSONB,
    validation_status VARCHAR(20) DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid', 'manual_review')),
    -- GDPR compliance
    consent_marketing BOOLEAN DEFAULT FALSE,
    consent_data_processing BOOLEAN DEFAULT TRUE,
    data_retention_until DATE,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Unique constraint on document
    UNIQUE(document_type, document_number)
);

-- Beds and rooms
CREATE TABLE beds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bed_number INTEGER NOT NULL UNIQUE,
    room_type VARCHAR(20) NOT NULL CHECK (room_type IN ('dorm_a', 'dorm_b', 'private')),
    bed_type VARCHAR(20) DEFAULT 'single' CHECK (bed_type IN ('single', 'bunk_top', 'bunk_bottom')),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance')),
    max_occupancy INTEGER DEFAULT 1,
    price_per_night DECIMAL(10,2) NOT NULL,
    amenities JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings/reservations
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pilgrim_id UUID NOT NULL REFERENCES pilgrims(id) ON DELETE CASCADE,
    bed_id UUID NOT NULL REFERENCES beds(id),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    nights INTEGER GENERATED ALWAYS AS (check_out_date - check_in_date) STORED,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'reserved' CHECK (status IN ('reserved', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'expired')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'transfer', 'online')),
    -- Government submission (Spain MIR)
    mir_submission_id VARCHAR(100),
    mir_submission_status VARCHAR(20) DEFAULT 'pending' CHECK (mir_submission_status IN ('pending', 'submitted', 'confirmed', 'failed')),
    mir_submitted_at TIMESTAMP WITH TIME ZONE,
    -- Expiry management (2-hour window)
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '2 hours'),
    -- Special requests and notes
    special_requests TEXT,
    admin_notes TEXT,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensure no double bookings
    EXCLUDE USING gist (
        bed_id WITH =,
        daterange(check_in_date, check_out_date, '[)') WITH &&
    ) WHERE (status != 'cancelled' AND status != 'expired')
);

-- Payments tracking
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency CHAR(3) DEFAULT 'EUR',
    payment_method VARCHAR(20) NOT NULL,
    payment_provider VARCHAR(50), -- 'stripe', 'cash', 'bank_transfer'
    provider_transaction_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    receipt_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pilgrims_updated_at BEFORE UPDATE ON pilgrims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();