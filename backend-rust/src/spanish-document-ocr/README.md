# Spanish Document OCR Lambda Service

Zero-cost AWS Lambda function for processing Spanish DNI/NIE documents and worldwide passports using Tesseract OCR. Optimized for the AWS Lambda free tier with low volume usage (24 users/day max).

## Features

- **Spanish Document Support**: DNI, NIE validation with checksum verification
- **Passport Processing**: MRZ (Machine Readable Zone) parsing for international passports
- **Image Preprocessing**: Advanced image enhancement for better OCR accuracy
- **Zero-Cost Architecture**: Designed for AWS Lambda free tier (1M requests/month)
- **High Accuracy**: Multi-stage validation and confidence scoring
- **Fast Processing**: Optimized for 256MB memory and 30-second timeout

## Architecture

```
Client Upload → API Gateway → Lambda Function → JSON Response
                  (CORS)       (256MB RAM)      (Parsed Data)
                               (30s timeout)
```

## Quick Start

### Prerequisites

```bash
# Install system dependencies
sudo apt-get update
sudo apt-get install -y tesseract-ocr tesseract-ocr-spa libtesseract-dev libleptonica-dev

# Install Rust targets and tools
rustup target add x86_64-unknown-linux-musl
cargo install cargo-lambda
```

### Build and Test Locally

```bash
# Build the function
make build

# Start local testing environment
make watch

# Test with sample data
make test-local
```

### Deploy to AWS

```bash
# Deploy to AWS Lambda
make deploy

# Check deployment status
make status

# View logs
make logs
```

## API Usage

### Request Format

```json
{
  "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...",
  "document_type": "DNI",
  "side": "front"
}
```

### Response Format

```json
{
  "success": true,
  "document_type": "DNI_FRONT",
  "data": {
    "document_number": "12345678A",
    "first_name": "JUAN",
    "last_names": "GARCÍA LÓPEZ",
    "birth_date": "01-01-1990",
    "expiry_date": "01-01-2030",
    "nationality": "ESP",
    "validation": {
      "format_valid": true,
      "checksum_valid": true,
      "confidence": 0.95
    },
    "confidence_score": 0.92
  },
  "processing_time_ms": 2500
}
```

## Document Types Supported

### Spanish Documents
- **DNI/NIF**: Spanish National Identity Document
- **NIE**: Foreigner Identity Number in Spain

### International Documents
- **Passport**: Worldwide passports with MRZ parsing

### Validation Features
- **DNI/NIE Checksum**: Validates control letter using mod-23 algorithm
- **Date Validation**: Ensures logical date ranges
- **Format Checking**: Verifies document number formats
- **Confidence Scoring**: Multi-factor confidence assessment

## Configuration

### Environment Variables

- `RUST_LOG`: Logging level (default: `info`)
- `TESSERACT_LANG`: OCR language (default: `spa`)
- `MAX_IMAGE_SIZE`: Maximum image size in bytes (default: `10485760`)

### Lambda Configuration

- **Memory**: 256MB (optimal for OCR processing)
- **Timeout**: 30 seconds (sufficient for complex documents)
- **Runtime**: Custom Runtime (Rust)

## Cost Optimization

- **Single Function**: Minimizes cold starts and complexity
- **Efficient Memory Usage**: 256MB keeps within free tier limits
- **Binary Optimization**: musl target with size optimization
- **No External Storage**: In-memory processing only
- **Smart Preprocessing**: Reduces OCR processing time

## Development

### Project Structure

```
src/
├── main.rs              # Lambda handler entry point
├── document_classifier.rs # Document type detection
├── image_processor.rs    # Image preprocessing pipeline
├── ocr_engine.rs        # Tesseract OCR wrapper
├── spanish_validator.rs  # DNI/NIE validation logic
├── passport_parser.rs    # MRZ parsing for passports
├── models.rs            # Data structures
└── utils.rs             # Helper functions
```

### Testing

```bash
# Run unit tests
cargo test

# Test with specific document types
curl -X POST http://localhost:9000/lambda-url/spanish-document-ocr/ \
  -H "Content-Type: application/json" \
  -d '{"image_base64": "...", "document_type": "NIE"}'
```

### Building for Production

```bash
# Build optimized binary
make build

# Create deployment package
make package
```

## Performance Characteristics

- **Cold Start**: ~2-3 seconds (includes Tesseract initialization)
- **Warm Execution**: ~1-5 seconds (depending on image complexity)
- **Memory Usage**: ~200-250MB peak
- **Accuracy**: >90% for good quality document images

## Error Handling

The service handles various error conditions:

- Invalid base64 image data
- Unsupported image formats
- Images too large (>10MB)
- Low OCR confidence (<30%)
- Invalid document formats
- Network timeouts

## Monitoring

Use CloudWatch to monitor:

- Function duration
- Memory usage
- Error rates
- Cost metrics

```bash
# View real-time logs
make logs

# Check function metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=spanish-document-ocr \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Average
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Run `make test` to ensure all tests pass
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.