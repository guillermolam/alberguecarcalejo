.PHONY: build deploy test clean install

# Variables
FUNCTION_NAME = spanish-document-ocr
REGION = us-east-1
MEMORY = 256
TIMEOUT = 30

# Install system dependencies
install:
	@echo "Installing system dependencies..."
	sudo apt-get update
	sudo apt-get install -y tesseract-ocr tesseract-ocr-spa libtesseract-dev libleptonica-dev
	rustup target add x86_64-unknown-linux-musl
	cargo install cargo-lambda

# Build the Lambda function
build:
	@echo "Building Lambda function..."
	cargo lambda build --release

# Build for local development
build-dev:
	@echo "Building for local development..."
	cargo build

# Test the function locally
test:
	@echo "Running tests..."
	cargo test
	
# Watch for changes and test locally
watch:
	@echo "Starting local Lambda runtime..."
	cargo lambda watch

# Deploy to AWS Lambda
deploy:
	@echo "Deploying to AWS Lambda..."
	cargo lambda deploy \
		--function-name $(FUNCTION_NAME) \
		--memory $(MEMORY) \
		--timeout $(TIMEOUT) \
		--environment-variables "RUST_LOG=info,TESSERACT_LANG=spa,MAX_IMAGE_SIZE=10485760"

# Test with sample data
test-local:
	@echo "Testing with sample data..."
	curl -X POST http://localhost:9000/lambda-url/$(FUNCTION_NAME)/ \
		-H "Content-Type: application/json" \
		-d '{"image_base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", "document_type": "DNI"}'

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	cargo clean
	rm -rf target/

# Check Lambda function status
status:
	@echo "Checking Lambda function status..."
	aws lambda get-function --function-name $(FUNCTION_NAME) --region $(REGION)

# View Lambda logs
logs:
	@echo "Viewing Lambda logs..."
	aws logs tail /aws/lambda/$(FUNCTION_NAME) --follow --region $(REGION)

# Package for deployment
package:
	@echo "Creating deployment package..."
	cargo lambda build --release
	cp target/lambda/$(FUNCTION_NAME)/bootstrap ./
	zip $(FUNCTION_NAME).zip bootstrap
	rm bootstrap

# Help
help:
	@echo "Available commands:"
	@echo "  install     - Install system dependencies"
	@echo "  build       - Build Lambda function for production"
	@echo "  build-dev   - Build for local development"
	@echo "  test        - Run unit tests"
	@echo "  watch       - Start local Lambda runtime for testing"
	@echo "  deploy      - Deploy to AWS Lambda"
	@echo "  test-local  - Test locally with sample data"
	@echo "  clean       - Clean build artifacts"
	@echo "  status      - Check Lambda function status"
	@echo "  logs        - View Lambda logs"
	@echo "  package     - Create deployment package"
	@echo "  help        - Show this help"