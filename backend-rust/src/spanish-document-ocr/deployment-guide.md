# AWS Lambda Deployment Guide for Spanish Document OCR

This guide provides step-by-step instructions for deploying the zero-cost Spanish Document OCR service to AWS Lambda.

## Prerequisites

1. **AWS Account**: Create a free AWS account if you don't have one
2. **AWS CLI**: Install and configure AWS CLI with your credentials
3. **Rust Toolchain**: Install Rust and necessary targets
4. **System Dependencies**: Install Tesseract and development libraries

## Setup Instructions

### 1. Install Dependencies

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y tesseract-ocr tesseract-ocr-spa libtesseract-dev libleptonica-dev

# Install Rust target for Lambda
rustup target add x86_64-unknown-linux-musl

# Install cargo-lambda
cargo install cargo-lambda
```

### 2. Configure AWS CLI

```bash
# Configure AWS credentials
aws configure

# Verify configuration
aws sts get-caller-identity
```

### 3. Build the Function

```bash
cd backend-rust/src/spanish-document-ocr
make build
```

### 4. Create IAM Role

Create an IAM role for the Lambda function:

```bash
# Create trust policy
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the role
aws iam create-role \
  --role-name spanish-ocr-lambda-role \
  --assume-role-policy-document file://trust-policy.json

# Attach basic execution policy
aws iam attach-role-policy \
  --role-name spanish-ocr-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

### 5. Deploy to Lambda

```bash
# Deploy the function
cargo lambda deploy \
  --function-name spanish-document-ocr \
  --iam-role arn:aws:iam::YOUR_ACCOUNT_ID:role/spanish-ocr-lambda-role \
  --memory 256 \
  --timeout 30 \
  --environment-variables "RUST_LOG=info,TESSERACT_LANG=spa,MAX_IMAGE_SIZE=10485760"
```

Replace `YOUR_ACCOUNT_ID` with your actual AWS account ID.

### 6. Create Function URL (Optional)

For direct HTTP access without API Gateway:

```bash
aws lambda create-function-url-config \
  --function-name spanish-document-ocr \
  --cors '{"AllowCredentials": false, "AllowMethods": ["POST"], "AllowOrigins": ["*"], "AllowHeaders": ["Content-Type"]}' \
  --auth-type NONE
```

### 7. Configure API Gateway (Recommended)

For better CORS support and request routing:

```bash
# Create REST API
aws apigateway create-rest-api \
  --name spanish-ocr-api \
  --description "Spanish Document OCR API"

# Note the API ID from the response for the next steps
```

### 8. Test the Deployment

```bash
# Test with sample data
make test-local

# Or test directly with curl
curl -X POST https://YOUR_LAMBDA_URL \
  -H "Content-Type: application/json" \
  -d '{
    "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...",
    "document_type": "DNI",
    "side": "front"
  }'
```

## Environment Configuration

### Frontend Configuration

Add the Lambda URL to your frontend environment:

```bash
# .env.local or production environment
VITE_LAMBDA_OCR_URL=https://your-lambda-url-here
```

### Lambda Environment Variables

The function uses these environment variables:

- `RUST_LOG`: Set to `info` for production logging
- `TESSERACT_LANG`: Language for OCR (default: `spa`)
- `MAX_IMAGE_SIZE`: Maximum image size in bytes (default: `10485760`)

## Cost Optimization

### Free Tier Limits
- **Requests**: 1 million per month
- **Compute Time**: 400,000 GB-seconds per month
- **With 256MB**: ~1.56 million seconds of execution time

### Usage Estimation
- **24 users/day**: ~720 requests/month
- **Average processing time**: 3 seconds
- **Monthly compute time**: ~0.5 GB-seconds
- **Cost**: $0 (well within free tier)

## Monitoring and Logging

### CloudWatch Logs

```bash
# View logs
aws logs tail /aws/lambda/spanish-document-ocr --follow

# Create log insights query
aws logs start-query \
  --log-group-name /aws/lambda/spanish-document-ocr \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --query-string 'fields @timestamp, @message | filter @message like /ERROR/'
```

### CloudWatch Metrics

Monitor these key metrics:
- Duration
- Memory Usage
- Error Rate
- Invocations

## Troubleshooting

### Common Issues

1. **Cold Start Timeouts**
   - Increase timeout to 30 seconds
   - Consider provisioned concurrency for production

2. **Memory Issues**
   - Monitor memory usage in CloudWatch
   - Increase memory allocation if needed (still within free tier)

3. **OCR Accuracy**
   - Ensure Tesseract Spanish language data is included
   - Check image preprocessing pipeline

4. **CORS Errors**
   - Configure proper CORS headers
   - Use API Gateway for better CORS control

### Debug Mode

Enable debug logging:

```bash
aws lambda update-function-configuration \
  --function-name spanish-document-ocr \
  --environment Variables='{RUST_LOG=debug,TESSERACT_LANG=spa,MAX_IMAGE_SIZE=10485760}'
```

## Security Considerations

1. **Input Validation**: All inputs are validated before processing
2. **Size Limits**: 10MB image size limit prevents abuse
3. **Rate Limiting**: Consider implementing API Gateway rate limiting
4. **Authentication**: Add API keys if needed for production

## Scaling

The Lambda function automatically scales based on demand:
- **Concurrent Executions**: 1000 (default)
- **Burst Capacity**: 500-3000 depending on region
- **Auto-scaling**: No configuration needed

For higher volumes, consider:
- Provisioned concurrency
- Reserved concurrency limits
- SQS for batch processing

## Maintenance

### Updates

```bash
# Build and deploy updates
make build
make deploy

# Test after deployment
make test-local
```

### Monitoring

Set up CloudWatch alarms for:
- Error rate > 5%
- Duration > 25 seconds
- Memory usage > 90%

## Cost Monitoring

Track costs with AWS Cost Explorer:
- Lambda invocations
- Data transfer
- CloudWatch logs storage

The service should remain at $0 cost for the specified 24 users/day volume.