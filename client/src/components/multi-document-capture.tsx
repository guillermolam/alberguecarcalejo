import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Camera, Upload, X, CheckCircle, AlertCircle, FileText, FlipHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { enhancedOCRService, type ComprehensiveOCRResult } from "@/lib/enhanced-ocr";
import { useI18n } from "@/contexts/i18n-context";
import { DOCUMENT_TYPES } from "@/lib/constants";

type DocumentSide = 'front' | 'back';

interface DocumentCaptureResult {
  documentType: string;
  frontOCR: ComprehensiveOCRResult | null;
  backOCR: ComprehensiveOCRResult | null;
  isComplete: boolean;
}

interface MultiDocumentCaptureProps {
  onDocumentProcessed: (result: DocumentCaptureResult) => void;
  onDocumentTypeChange?: (documentType: string) => void;
}

export function MultiDocumentCapture({ onDocumentProcessed, onDocumentTypeChange }: MultiDocumentCaptureProps) {
  const [selectedDocumentType, setSelectedDocumentType] = useState("");
  const [currentSide, setCurrentSide] = useState<DocumentSide>('front');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [frontOCR, setFrontOCR] = useState<ComprehensiveOCRResult | null>(null);
  const [backOCR, setBackOCR] = useState<ComprehensiveOCRResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isUsingCamera, setIsUsingCamera] = useState(false);
  
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const requiresBothSides = (docType: string) => {
    return docType === 'DNI' || docType === 'NIE' || docType === 'OTHER';
  };

  const handleDocumentTypeChange = (value: string) => {
    setSelectedDocumentType(value);
    // Reset everything when document type changes
    setFrontImage(null);
    setBackImage(null);
    setFrontOCR(null);
    setBackOCR(null);
    setCurrentSide('front');
    setError(null);
    onDocumentTypeChange?.(value);
  };

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
        processImage(imageDataUrl);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        processImage(imageDataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (imageDataUrl: string) => {
    if (!selectedDocumentType) {
      setError('Please select document type first');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProcessingProgress(20);

    try {
      // Convert data URL to file for OCR processing
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      const file = new File([blob], `document-${currentSide}.jpg`, { type: 'image/jpeg' });

      setProcessingProgress(40);

      // Process with enhanced OCR with document side context
      const result = await enhancedOCRService.processDocument(file, {
        documentType: selectedDocumentType,
        documentSide: currentSide
      });

      setProcessingProgress(80);

      if (!result.isValid) {
        setError(t('errors.ocr_no_data') + ': ' + result.errors.join(', '));
        setIsProcessing(false);
        return;
      }

      setProcessingProgress(100);

      // Store the result based on current side
      if (currentSide === 'front') {
        setFrontImage(imageDataUrl);
        setFrontOCR(result);
      } else {
        setBackImage(imageDataUrl);
        setBackOCR(result);
      }

      // Check if we're done or need to process the back side
      const needsBackSide = requiresBothSides(selectedDocumentType);
      
      if (currentSide === 'front' && needsBackSide) {
        // Move to back side
        setCurrentSide('back');
        setError(null);
      } else {
        // We're done with all required sides
        const documentResult: DocumentCaptureResult = {
          documentType: selectedDocumentType,
          frontOCR: currentSide === 'front' ? result : frontOCR,
          backOCR: currentSide === 'back' ? result : backOCR,
          isComplete: true
        };
        
        onDocumentProcessed(documentResult);
      }

    } catch (err) {
      console.error('OCR processing error:', err);
      setError(t('errors.ocr_processing') || 'Error processing image. Please try again.');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProcessingProgress(0), 1000);
    }
  };

  const resetCurrentSide = () => {
    if (currentSide === 'front') {
      setFrontImage(null);
      setFrontOCR(null);
    } else {
      setBackImage(null);
      setBackOCR(null);
    }
    setError(null);
    stopCamera();
  };

  const resetAll = () => {
    setFrontImage(null);
    setBackImage(null);
    setFrontOCR(null);
    setBackOCR(null);
    setCurrentSide('front');
    setError(null);
    stopCamera();
  };

  const getCurrentImage = () => currentSide === 'front' ? frontImage : backImage;
  const getCurrentOCR = () => currentSide === 'front' ? frontOCR : backOCR;
  const isCurrentSideComplete = () => getCurrentImage() && getCurrentOCR();

  const getSideTitle = (side: DocumentSide) => {
    if (side === 'front') {
      return selectedDocumentType === 'PASSPORT' ? 'Photo Page' : 'Front Side';
    }
    return 'Back Side';
  };

  const getExpectedFields = (side: DocumentSide) => {
    if (side === 'front') {
      return 'Name, Document Number, Photo, Validity Date';
    }
    return 'Address, Postal Code, Additional Details';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Document Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Document Type Selection - Always First */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Document Type *
          </label>
          <Select value={selectedDocumentType} onValueChange={handleDocumentTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select document type first" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type.code} value={type.code}>
                  {t(`document.${type.code.toLowerCase()}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedDocumentType && (
          <>
            {/* Progress Indicator */}
            {requiresBothSides(selectedDocumentType) && (
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  frontOCR ? 'bg-green-500 text-white' : currentSide === 'front' ? 'bg-blue-500 text-white' : 'bg-gray-300'
                }`}>
                  {frontOCR ? <CheckCircle className="w-4 h-4" /> : '1'}
                </div>
                <div className="flex-1 h-2 bg-gray-200 rounded">
                  <div className={`h-2 rounded transition-all ${frontOCR ? 'bg-green-500 w-full' : 'bg-blue-500 w-1/2'}`} />
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  backOCR ? 'bg-green-500 text-white' : currentSide === 'back' ? 'bg-blue-500 text-white' : 'bg-gray-300'
                }`}>
                  {backOCR ? <CheckCircle className="w-4 h-4" /> : '2'}
                </div>
              </div>
            )}

            {/* Current Side Instructions */}
            <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
              <div className="flex items-center gap-2 mb-2">
                <FlipHorizontal className="w-4 h-4" />
                <span className="font-medium">
                  {getSideTitle(currentSide)}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Expected fields: {getExpectedFields(currentSide)}
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Processing Progress */}
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Processing {getSideTitle(currentSide).toLowerCase()}...</span>
                  <span>{processingProgress}%</span>
                </div>
                <Progress value={processingProgress} className="w-full" />
              </div>
            )}

            {/* Camera/Upload Interface */}
            {!isCurrentSideComplete() && (
              <div className="space-y-4">
                {!isUsingCamera ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={startCamera}
                      variant="outline"
                      className="flex items-center gap-2 h-20"
                      disabled={isProcessing}
                    >
                      <Camera className="w-6 h-6" />
                      <div className="text-left">
                        <div className="font-medium">Use Camera</div>
                        <div className="text-sm text-gray-500">Take photo</div>
                      </div>
                    </Button>

                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="flex items-center gap-2 h-20"
                      disabled={isProcessing}
                    >
                      <Upload className="w-6 h-6" />
                      <div className="text-left">
                        <div className="font-medium">Upload File</div>
                        <div className="text-sm text-gray-500">Choose image</div>
                      </div>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <video
                        ref={videoRef}
                        className="w-full max-w-md mx-auto rounded-lg"
                        autoPlay
                        playsInline
                      />
                      <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                        {getSideTitle(currentSide)}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 justify-center">
                      <Button onClick={capturePhoto} disabled={isProcessing}>
                        <Camera className="w-4 h-4 mr-2" />
                        Capture
                      </Button>
                      <Button onClick={stopCamera} variant="outline">
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}

            {/* Current Side Result */}
            {isCurrentSideComplete() && (
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-green-50">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">{getSideTitle(currentSide)} processed successfully</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <img 
                        src={getCurrentImage()!} 
                        alt={`${getSideTitle(currentSide)}`}
                        className="w-full max-w-xs rounded border"
                      />
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="font-medium">Detected Information:</div>
                      {getCurrentOCR()?.firstName && <div>Name: {getCurrentOCR()?.firstName}</div>}
                      {getCurrentOCR()?.documentNumber && <div>Document: {getCurrentOCR()?.documentNumber}</div>}
                      {getCurrentOCR()?.addressStreet && <div>Address: {getCurrentOCR()?.addressStreet}</div>}
                      {getCurrentOCR()?.addressPostalCode && <div>Postal Code: {getCurrentOCR()?.addressPostalCode}</div>}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button onClick={resetCurrentSide} variant="outline" size="sm">
                      Retake {getSideTitle(currentSide)}
                    </Button>
                    {currentSide === 'front' && requiresBothSides(selectedDocumentType) && (
                      <Button onClick={() => setCurrentSide('back')} size="sm">
                        Continue to Back Side
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  );
}