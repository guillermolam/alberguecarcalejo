// Image Rotation Detection and Correction Library
// Implements multiple rotation detection algorithms for optimal OCR accuracy

export interface RotationResult {
  angle: number;          // Detected rotation angle in degrees
  confidence: number;     // Confidence score (0-1)
  method: string;         // Detection method used
  correctedImage: string; // Base64 corrected image
  originalImage: string;  // Original base64 image
  processingTimeMs: number;
}

export interface ImageProcessingOptions {
  enableBinarization: boolean;
  thresholdValue: number;
  enableGaussianBlur: boolean;
  blurRadius: number;
  detectionMethods: ('hough' | 'projection' | 'text-orientation' | 'edge-detection')[];
}

export class ImageRotationDetector {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async detectAndCorrectRotation(
    imageData: string,
    options: Partial<ImageProcessingOptions> = {}
  ): Promise<RotationResult> {
    const startTime = Date.now();
    
    const defaultOptions: ImageProcessingOptions = {
      enableBinarization: true,
      thresholdValue: 128,
      enableGaussianBlur: true,
      blurRadius: 1,
      detectionMethods: ['projection', 'text-orientation', 'edge-detection']
    };

    const config = { ...defaultOptions, ...options };
    
    try {
      // Load and preprocess image
      const img = await this.loadImage(imageData);
      this.canvas.width = img.width;
      this.canvas.height = img.height;
      this.ctx.drawImage(img, 0, 0);

      // Apply preprocessing
      let processedImageData = this.ctx.getImageData(0, 0, img.width, img.height);
      
      if (config.enableGaussianBlur) {
        processedImageData = this.applyGaussianBlur(processedImageData, config.blurRadius);
      }

      if (config.enableBinarization) {
        processedImageData = this.applyBinarization(processedImageData, config.thresholdValue);
      }

      // Detect rotation using multiple methods
      const rotationCandidates = await this.detectRotationAngles(processedImageData, config);
      
      // Select best rotation angle
      const bestRotation = this.selectBestRotation(rotationCandidates);
      
      // Apply rotation correction
      const correctedImage = await this.rotateImage(img, bestRotation.angle);
      
      return {
        angle: bestRotation.angle,
        confidence: bestRotation.confidence,
        method: bestRotation.method,
        correctedImage,
        originalImage: imageData,
        processingTimeMs: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('Rotation detection failed:', error);
      return {
        angle: 0,
        confidence: 0,
        method: 'none',
        correctedImage: imageData,
        originalImage: imageData,
        processingTimeMs: Date.now() - startTime
      };
    }
  }

  private async loadImage(imageData: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = imageData;
    });
  }

  private applyGaussianBlur(imageData: ImageData, radius: number): ImageData {
    const { data, width, height } = imageData;
    const output = new ImageData(width, height);
    
    // Simple box blur approximation of Gaussian blur
    const kernel = this.createGaussianKernel(radius);
    const kernelSize = kernel.length;
    const half = Math.floor(kernelSize / 2);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0;
        let totalWeight = 0;
        
        for (let ky = -half; ky <= half; ky++) {
          for (let kx = -half; kx <= half; kx++) {
            const py = y + ky;
            const px = x + kx;
            
            if (py >= 0 && py < height && px >= 0 && px < width) {
              const weight = kernel[ky + half][kx + half];
              const index = (py * width + px) * 4;
              
              r += data[index] * weight;
              g += data[index + 1] * weight;
              b += data[index + 2] * weight;
              a += data[index + 3] * weight;
              totalWeight += weight;
            }
          }
        }
        
        const outIndex = (y * width + x) * 4;
        output.data[outIndex] = r / totalWeight;
        output.data[outIndex + 1] = g / totalWeight;
        output.data[outIndex + 2] = b / totalWeight;
        output.data[outIndex + 3] = a / totalWeight;
      }
    }
    
    return output;
  }

  private createGaussianKernel(radius: number): number[][] {
    const size = 2 * radius + 1;
    const kernel: number[][] = [];
    const sigma = radius / 3;
    let sum = 0;
    
    for (let y = 0; y < size; y++) {
      kernel[y] = [];
      for (let x = 0; x < size; x++) {
        const dx = x - radius;
        const dy = y - radius;
        const value = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
        kernel[y][x] = value;
        sum += value;
      }
    }
    
    // Normalize kernel
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        kernel[y][x] /= sum;
      }
    }
    
    return kernel;
  }

  private applyBinarization(imageData: ImageData, threshold: number): ImageData {
    const { data, width, height } = imageData;
    const output = new ImageData(width, height);
    
    for (let i = 0; i < data.length; i += 4) {
      // Convert to grayscale
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      
      // Apply threshold
      const binary = gray > threshold ? 255 : 0;
      
      output.data[i] = binary;     // R
      output.data[i + 1] = binary; // G
      output.data[i + 2] = binary; // B
      output.data[i + 3] = 255;    // A
    }
    
    return output;
  }

  private async detectRotationAngles(
    imageData: ImageData,
    config: ImageProcessingOptions
  ): Promise<Array<{ angle: number; confidence: number; method: string }>> {
    const results: Array<{ angle: number; confidence: number; method: string }> = [];
    
    for (const method of config.detectionMethods) {
      try {
        let result: { angle: number; confidence: number };
        
        switch (method) {
          case 'projection':
            result = this.detectByProjection(imageData);
            break;
          case 'text-orientation':
            result = this.detectByTextOrientation(imageData);
            break;
          case 'edge-detection':
            result = this.detectByEdgeDetection(imageData);
            break;
          case 'hough':
            result = this.detectByHoughTransform(imageData);
            break;
          default:
            continue;
        }
        
        results.push({
          angle: result.angle,
          confidence: result.confidence,
          method
        });
      } catch (error) {
        console.warn(`Rotation detection method ${method} failed:`, error);
      }
    }
    
    return results;
  }

  private detectByProjection(imageData: ImageData): { angle: number; confidence: number } {
    const { data, width, height } = imageData;
    const angles = [];
    
    // Test angles from -45 to 45 degrees
    for (let angle = -45; angle <= 45; angle += 1) {
      const radians = (angle * Math.PI) / 180;
      const cos = Math.cos(radians);
      const sin = Math.sin(radians);
      
      const projectionSum = this.calculateProjectionSum(data, width, height, cos, sin);
      angles.push({ angle, variance: projectionSum });
    }
    
    // Find angle with maximum variance (sharpest projection)
    const maxVariance = Math.max(...angles.map(a => a.variance));
    const bestAngle = angles.find(a => a.variance === maxVariance);
    
    return {
      angle: bestAngle?.angle || 0,
      confidence: maxVariance > 0 ? Math.min(maxVariance / 1000, 1) : 0
    };
  }

  private calculateProjectionSum(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    cos: number,
    sin: number
  ): number {
    const projections: number[] = [];
    const maxProjection = Math.max(
      Math.abs(width * cos + height * sin),
      Math.abs(width * cos - height * sin)
    );
    
    for (let p = 0; p < maxProjection; p++) {
      let sum = 0;
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const projectedPos = x * cos + y * sin;
          
          if (Math.abs(projectedPos - p) < 1) {
            const index = (y * width + x) * 4;
            const gray = data[index]; // Already binarized
            sum += gray > 127 ? 1 : 0;
          }
        }
      }
      
      projections.push(sum);
    }
    
    // Calculate variance of projections
    const mean = projections.reduce((a, b) => a + b, 0) / projections.length;
    const variance = projections.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / projections.length;
    
    return variance;
  }

  private detectByTextOrientation(imageData: ImageData): { angle: number; confidence: number } {
    // Simple text line detection using horizontal/vertical gradients
    const { data, width, height } = imageData;
    const gradients = [];
    
    for (let angle = -45; angle <= 45; angle += 3) {
      const radians = (angle * Math.PI) / 180;
      const cos = Math.cos(radians);
      const sin = Math.sin(radians);
      
      let gradientSum = 0;
      let pixelCount = 0;
      
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const index = (y * width + x) * 4;
          const current = data[index];
          
          // Calculate gradient in rotation direction
          const dx = Math.round(cos);
          const dy = Math.round(sin);
          
          if (x + dx >= 0 && x + dx < width && y + dy >= 0 && y + dy < height) {
            const nextIndex = ((y + dy) * width + (x + dx)) * 4;
            const next = data[nextIndex];
            
            gradientSum += Math.abs(current - next);
            pixelCount++;
          }
        }
      }
      
      gradients.push({
        angle,
        gradient: pixelCount > 0 ? gradientSum / pixelCount : 0
      });
    }
    
    // Find angle with maximum gradient (text boundaries)
    const maxGradient = Math.max(...gradients.map(g => g.gradient));
    const bestAngle = gradients.find(g => g.gradient === maxGradient);
    
    return {
      angle: bestAngle?.angle || 0,
      confidence: maxGradient > 0 ? Math.min(maxGradient / 50, 1) : 0
    };
  }

  private detectByEdgeDetection(imageData: ImageData): { angle: number; confidence: number } {
    const { data, width, height } = imageData;
    const edges = this.applySobelFilter(data, width, height);
    
    // Find dominant edge angles
    const angleHistogram = new Array(180).fill(0);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = y * width + x;
        const edgeStrength = edges[index];
        
        if (edgeStrength > 50) { // Threshold for significant edges
          // Calculate edge direction
          const dx = edges[index + 1] - edges[index - 1];
          const dy = edges[index + width] - edges[index - width];
          
          const angle = Math.atan2(dy, dx) * 180 / Math.PI;
          const normalizedAngle = Math.round(angle + 90) % 180;
          
          angleHistogram[normalizedAngle] += edgeStrength;
        }
      }
    }
    
    // Find peak in histogram
    const maxValue = Math.max(...angleHistogram);
    const peakAngle = angleHistogram.indexOf(maxValue);
    
    // Convert to rotation angle (-45 to 45 range)
    let rotationAngle = peakAngle - 90;
    if (rotationAngle < -45) rotationAngle += 180;
    if (rotationAngle > 45) rotationAngle -= 180;
    
    return {
      angle: rotationAngle,
      confidence: maxValue > 0 ? Math.min(maxValue / 1000, 1) : 0
    };
  }

  private applySobelFilter(data: Uint8ClampedArray, width: number, height: number): Float32Array {
    const edges = new Float32Array(width * height);
    
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const index = ((y + ky) * width + (x + kx)) * 4;
            const gray = data[index];
            
            const kernelIndex = (ky + 1) * 3 + (kx + 1);
            gx += gray * sobelX[kernelIndex];
            gy += gray * sobelY[kernelIndex];
          }
        }
        
        edges[y * width + x] = Math.sqrt(gx * gx + gy * gy);
      }
    }
    
    return edges;
  }

  private detectByHoughTransform(imageData: ImageData): { angle: number; confidence: number } {
    // Simplified Hough transform for line detection
    const { data, width, height } = imageData;
    const edges = this.applySobelFilter(data, width, height);
    
    const angleResolution = 1; // 1 degree resolution
    const angles = [];
    
    for (let angle = -45; angle <= 45; angle += angleResolution) {
      const radians = (angle * Math.PI) / 180;
      const cos = Math.cos(radians);
      const sin = Math.sin(radians);
      
      let lineStrength = 0;
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = y * width + x;
          if (edges[index] > 50) {
            // Accumulate evidence for lines at this angle
            const rho = x * cos + y * sin;
            lineStrength += edges[index];
          }
        }
      }
      
      angles.push({ angle, strength: lineStrength });
    }
    
    // Find strongest line angle
    const maxStrength = Math.max(...angles.map(a => a.strength));
    const bestAngle = angles.find(a => a.strength === maxStrength);
    
    return {
      angle: bestAngle?.angle || 0,
      confidence: maxStrength > 0 ? Math.min(maxStrength / 10000, 1) : 0.5
    };
  }

  private selectBestRotation(candidates: Array<{ angle: number; confidence: number; method: string }>) {
    if (candidates.length === 0) {
      return { angle: 0, confidence: 0, method: 'none' };
    }
    
    // Weight by confidence and method reliability
    const methodWeights = {
      'projection': 1.0,
      'text-orientation': 0.8,
      'edge-detection': 0.9,
      'hough': 0.7
    };
    
    const weightedCandidates = candidates.map(c => ({
      ...c,
      weightedScore: c.confidence * (methodWeights[c.method as keyof typeof methodWeights] || 0.5)
    }));
    
    // Return candidate with highest weighted score
    return weightedCandidates.reduce((best, current) => 
      current.weightedScore > best.weightedScore ? current : best
    );
  }

  private async rotateImage(img: HTMLImageElement, angle: number): Promise<string> {
    if (Math.abs(angle) < 0.5) {
      // No significant rotation needed
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      return canvas.toDataURL('image/jpeg', 0.95);
    }
    
    const radians = (angle * Math.PI) / 180;
    const cos = Math.abs(Math.cos(radians));
    const sin = Math.abs(Math.sin(radians));
    
    const newWidth = img.width * cos + img.height * sin;
    const newHeight = img.width * sin + img.height * cos;
    
    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext('2d')!;
    
    // Move to center of new canvas
    ctx.translate(newWidth / 2, newHeight / 2);
    
    // Rotate
    ctx.rotate(radians);
    
    // Draw image centered
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    
    return canvas.toDataURL('image/jpeg', 0.95);
  }
}

// Export singleton instance
export const imageRotationDetector = new ImageRotationDetector();