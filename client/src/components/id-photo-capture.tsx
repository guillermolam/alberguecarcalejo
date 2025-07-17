import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, Upload, X, CheckCircle } from "lucide-react";
import { ocrService, OCRResult } from "@/lib/ocr";
import { useI18n } from "@/contexts/i18n-context";

interface IdPhotoCaptureProps {
  onPhotoProcessed: (ocrResult: OCRResult) => void;
}

export function IdPhotoCapture({ onPhotoProcessed }: IdPhotoCaptureProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const { t } = useI18n();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isUsingCamera, setIsUsingCamera] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsUsingCamera(true);
        setError(null);
      }
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsUsingCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageDataUrl);
        stopCamera();
        
        // Convert to file and process
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], 'id-photo.jpg', { type: 'image/jpeg' });
            await processImage(file);
          }
        }, 'image/jpeg');
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      await processImage(file);
    }
  };

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await ocrService.processDocument(file);
      setOcrResult(result);
      onPhotoProcessed(result);
    } catch (err) {
      setError('Error processing image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetCapture = () => {
    setCapturedImage(null);
    setOcrResult(null);
    setError(null);
    stopCamera();
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="text-sm font-medium text-gray-700 mb-2">
            {t('registration.photo_capture')} *
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!capturedImage && !isUsingCamera && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
              <div className="space-y-4">
                <Camera className="mx-auto h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    {t('registration.photo_instructions')}
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button
                      type="button"
                      onClick={startCamera}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {t('registration.take_photo')}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {t('registration.upload_photo')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isUsingCamera && (
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full rounded-lg"
                  autoPlay
                  playsInline
                />
                <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none"></div>
              </div>
              <div className="flex justify-center space-x-4">
                <Button
                  type="button"
                  onClick={capturePhoto}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Camera className="w-4 h-4 mr-2" />
{t('registration.take_photo')}
                </Button>
                <Button
                  type="button"
                  onClick={stopCamera}
                  variant="outline"
                >
                  <X className="w-4 h-4 mr-2" />
{t('common.cancel')}
                </Button>
              </div>
            </div>
          )}

          {capturedImage && (
            <div className="space-y-4">
              <div className="relative">
                <img 
                  src={capturedImage} 
                  alt="Captured ID" 
                  className="w-full max-w-md mx-auto rounded-lg"
                />
                <Button
                  type="button"
                  onClick={resetCapture}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {isProcessing && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">{t('registration.processing_ocr')}</p>
                </div>
              )}
              
              {ocrResult && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-800">
                    {t('registration.ocr_success')}
                    {ocrResult.extractedData?.documentNumber && (
                      <span className="ml-2">
                        Document: {ocrResult.extractedData.documentNumber}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </CardContent>
    </Card>
  );
}
