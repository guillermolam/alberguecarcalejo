import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Camera,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  FileText,
  IdCard,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ocrBFFClient,
  type OCRResponse,
  type ExtractedDocumentData,
} from "@/lib/ocr-bff-client";
import { useI18n } from "@/contexts/i18n-context";
import { DOCUMENT_TYPES } from "@/lib/constants";

// Import custom document type icons
import DniFrontIcon from "@assets/custom-icons/dni/front.svg";
import DniBackIcon from "@assets/custom-icons/dni/back.svg";
import PassportIcon from "@assets/custom-icons/passport/passport.svg";
import OtherIcon from "@assets/custom-icons/other/other_documents.svg";

type DocumentSide = "front" | "back";

interface DocumentCaptureResult {
  documentType: string;
  frontOCR: OCRResponse | null;
  backOCR: OCRResponse | null;
  isComplete: boolean;
}

interface MultiDocumentCaptureProps {
  onDocumentProcessed: (result: DocumentCaptureResult) => void;
  onDocumentTypeChange?: (documentType: string) => void;
  selectedDocumentType?: string;
}

function MultiDocumentCapture({
  onDocumentProcessed,
  onDocumentTypeChange,
  selectedDocumentType: propDocumentType,
}: MultiDocumentCaptureProps) {
  const [selectedDocumentType, setSelectedDocumentType] = useState(propDocumentType || "NIF"); // Default to DNI/NIF
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [frontOCR, setFrontOCR] = useState<OCRResponse | null>(null);
  const [backOCR, setBackOCR] = useState<OCRResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isUsingCamera, setIsUsingCamera] = useState(false);
  const [currentSide, setCurrentSide] = useState<DocumentSide>("front");

  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const requiresBothSides = (docType: string) => {
    return docType === "NIF" || docType === "NIE";
  };

  // Update internal state when prop changes
  useEffect(() => {
    if (propDocumentType && propDocumentType !== selectedDocumentType) {
      setSelectedDocumentType(propDocumentType);
      // Reset everything when document type changes via prop
      setFrontImage(null);
      setBackImage(null);
      setFrontOCR(null);
      setBackOCR(null);
      setError(null);
      setProcessingProgress(0);
      setCurrentSide("front");
    }
  }, [propDocumentType]); // Only depend on prop changes

  // Initialize with default document type on mount (only if no prop provided)
  useEffect(() => {
    if (!propDocumentType) {
      onDocumentTypeChange?.("NIF"); // Propagate default to parent
    }
  }, [onDocumentTypeChange, propDocumentType]);

  const handleDocumentTypeChange = (value: string) => {
    setSelectedDocumentType(value);
    // Reset everything when document type changes
    setFrontImage(null);
    setBackImage(null);
    setFrontOCR(null);
    setBackOCR(null);
    setError(null);
    setProcessingProgress(0);
    setCurrentSide("front");

    // Notify parent component
    onDocumentTypeChange?.(value);
  };

  const startCameraForSide = async (side: DocumentSide) => {
    setCurrentSide(side);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera on mobile
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsUsingCamera(true);
      }
    } catch (err) {
      setError("Unable to access camera. Please use file upload instead.");
    }
  };

  const triggerFileUpload = (side: DocumentSide) => {
    console.log("Triggering file upload for side:", side);
    setCurrentSide(side);

    // Reset the file input value to allow re-upload of the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    } else {
      console.error("File input ref not found");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsUsingCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        const imageDataUrl = canvas.toDataURL("image/jpeg");
        processImage(imageDataUrl);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File upload triggered:", event.target.files);
    const file = event.target.files?.[0];
    if (file) {
      console.log("File selected:", file.name, file.type, file.size);
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        console.log("File read as data URL, length:", imageDataUrl.length);
        processImage(imageDataUrl);
      };
      reader.readAsDataURL(file);
    } else {
      console.log("No file selected");
    }

    // Reset the input value for next upload
    event.target.value = "";
  };

  const processImage = async (imageDataUrl: string) => {
    if (!selectedDocumentType) {
      setError("Please select document type first");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProcessingProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProcessingProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      console.log(
        "Starting OCR processing for document type:",
        selectedDocumentType,
        "side:",
        currentSide,
      );

      // Process with BFF OCR
      const result = await ocrBFFClient.processDocumentWithImage(
        imageDataUrl,
        selectedDocumentType,
        currentSide,
      );

      clearInterval(progressInterval);

      console.log("OCR processing completed, result:", result);
      console.log(
        "OCR extracted data:",
        JSON.stringify(result.extractedData, null, 2),
      );

      if (!result.success) {
        console.error("OCR processing failed:", result.errors);
        setError(result.errors?.[0] || "Failed to process document");
        setIsProcessing(false);
        return;
      }

      setProcessingProgress(100);

      // Update state based on current side
      if (currentSide === "front") {
        setFrontImage(imageDataUrl);
        setFrontOCR(result);
      } else {
        setBackImage(imageDataUrl);
        setBackOCR(result);
      }

      // Check if processing is complete
      const currentFrontOCR = currentSide === "front" ? result : frontOCR;
      const currentBackOCR = currentSide === "back" ? result : backOCR;
      const needsBackSide = requiresBothSides(selectedDocumentType);

      const isComplete =
        currentFrontOCR && (needsBackSide ? currentBackOCR : true);

      if (isComplete) {
        const documentResult: DocumentCaptureResult = {
          documentType: selectedDocumentType,
          frontOCR: currentFrontOCR,
          backOCR: currentBackOCR,
          isComplete: true,
        };

        onDocumentProcessed(documentResult);
      }
    } catch (err) {
      console.error("OCR processing error:", err);
      setError(
        t("errors.ocr_processing") ||
          "Error processing image. Please try again.",
      );
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProcessingProgress(0), 1000);
    }
  };

  const getSideTitle = (side: DocumentSide) => {
    if (side === "front") {
      return selectedDocumentType === "PAS"
        ? "Passport Main Page"
        : "Front Side";
    }
    return "Back Side";
  };

  const getDocumentIcon = (docType: string, side: DocumentSide) => {
    if (docType === "PAS") return PassportIcon;
    if (docType === "OTRO") return OtherIcon;
    if (side === "front") return DniFrontIcon;
    return DniBackIcon;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IdCard className="w-5 h-5" />
          {t("document.upload_title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {selectedDocumentType && (
          <>
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
                  <span>Processing document...</span>
                  <span>{processingProgress}%</span>
                </div>
                <Progress value={processingProgress} className="w-full" />
              </div>
            )}

            {/* Upload Areas - Layout depends on document type */}
            {selectedDocumentType === "OTRO" || selectedDocumentType === "PAS" ? (
              // Single upload area for Other Documents and Passports
              <div className="max-w-md mx-auto">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 space-y-4">
                  <h3 className="font-medium text-lg flex items-center gap-2">
                    <IdCard className="w-5 h-5" />
                    {selectedDocumentType === "PAS" ? "Upload Passport" : "Upload Document"}
                    {frontOCR && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </h3>

                  {frontImage ? (
                    <div className="space-y-3">
                      <img
                        src={frontImage}
                        alt="Document"
                        className="w-full h-32 object-cover rounded"
                      />
                      {frontOCR && (
                        <div className="text-sm text-green-600 bg-green-50 p-2 rounded space-y-1">
                          <div>✓ {t("document.processed_successfully")}</div>
                          {frontOCR.rotationCorrection && (
                            <div className="text-xs text-blue-600">
                              📐 Rotation corrected:{" "}
                              {frontOCR.rotationCorrection.originalAngle.toFixed(
                                1,
                              )}
                              ° ({frontOCR.rotationCorrection.rotationMethod},
                              {(
                                frontOCR.rotationCorrection.rotationConfidence *
                                100
                              ).toFixed(0)}
                              % confidence)
                            </div>
                          )}
                        </div>
                      )}
                      <Button
                        onClick={() => {
                          setFrontImage(null);
                          setFrontOCR(null);
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-center mb-4">
                        <img 
                          src={getDocumentIcon(selectedDocumentType, "front")} 
                          alt="Document type icon" 
                          className="w-16 h-16 mx-auto opacity-60 mb-2"
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          type="button"
                          onClick={() => triggerFileUpload("front")}
                          variant="outline"
                          className="flex items-center gap-2"
                          disabled={isProcessing}
                        >
                          <Upload className="w-4 h-4" />
                          {t("document.upload")}
                        </Button>
                        <Button
                          type="button"
                          onClick={() => startCameraForSide("front")}
                          variant="outline"
                          className="flex items-center gap-2"
                          disabled={isProcessing}
                        >
                          <Camera className="w-4 h-4" />
                          {t("document.take_photo")}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        {selectedDocumentType === "PAS" 
                          ? "Accepted files: JPG, PNG, PDF, DOCX"
                          : "Accepted files: DOC, DOCX, PDF, ODT, OTT, RTF"
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Dual upload areas for DNI/NIE/Passport
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Front Side Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 space-y-4">
                  <h3 className="font-medium text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {selectedDocumentType === "PAS"
                      ? t("document.main_page")
                      : t("document.front_side")}
                    {frontOCR && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </h3>

                  {frontImage ? (
                    <div className="space-y-3">
                      <img
                        src={frontImage}
                        alt="Front side"
                        className="w-full h-32 object-cover rounded"
                      />
                      {frontOCR && (
                        <div className="text-sm text-green-600 bg-green-50 p-2 rounded space-y-1">
                          <div>✓ {t("document.processed_successfully")}</div>
                          {frontOCR.rotationCorrection && (
                            <div className="text-xs text-blue-600">
                              📐 Rotation corrected:{" "}
                              {frontOCR.rotationCorrection.originalAngle.toFixed(
                                1,
                              )}
                              ° ({frontOCR.rotationCorrection.rotationMethod},
                              {(
                                frontOCR.rotationCorrection.rotationConfidence *
                                100
                              ).toFixed(0)}
                              % confidence)
                            </div>
                          )}
                        </div>
                      )}
                      <Button
                        onClick={() => {
                          setFrontImage(null);
                          setFrontOCR(null);
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-center mb-4">
                        <img 
                          src={getDocumentIcon(selectedDocumentType, "front")} 
                          alt="Document front side icon" 
                          className="w-16 h-16 mx-auto opacity-60 mb-2"
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          type="button"
                          onClick={() => startCameraForSide("front")}
                          variant="outline"
                          className="flex items-center gap-2"
                          disabled={isProcessing}
                        >
                          <Camera className="w-4 h-4" />
                          {t("document.take_photo")}
                        </Button>
                        <Button
                          type="button"
                          onClick={() => triggerFileUpload("front")}
                          variant="outline"
                          className="flex items-center gap-2"
                          disabled={isProcessing}
                        >
                          <Upload className="w-4 h-4" />
                          {t("document.upload")}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        {t("document.expected_front")}
                      </p>
                    </div>
                  )}
                </div>

                {/* Back Side Upload - Only for DNI/NIE */}
                {requiresBothSides(selectedDocumentType) && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 space-y-4">
                    <h3 className="font-medium text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {t("document.back_side")}
                      {backOCR && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </h3>

                    {backImage ? (
                      <div className="space-y-3">
                        <img
                          src={backImage}
                          alt="Back side"
                          className="w-full h-32 object-cover rounded"
                        />
                        {backOCR && (
                          <div className="text-sm text-green-600 bg-green-50 p-2 rounded space-y-1">
                            <div>✓ {t("document.processed_successfully")}</div>
                            {backOCR.rotationCorrection && (
                              <div className="text-xs text-blue-600">
                                📐 Rotation corrected:{" "}
                                {backOCR.rotationCorrection.originalAngle.toFixed(
                                  1,
                                )}
                                ° ({backOCR.rotationCorrection.rotationMethod},
                                {(
                                  backOCR.rotationCorrection
                                    .rotationConfidence * 100
                                ).toFixed(0)}
                                % confidence)
                              </div>
                            )}
                          </div>
                        )}
                        <Button
                          type="button"
                          onClick={() => {
                            setBackImage(null);
                            setBackOCR(null);
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <X className="w-4 h-4 mr-2" />
                          {t("document.remove")}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-center mb-4">
                          <img 
                            src={getDocumentIcon(selectedDocumentType, "back")} 
                            alt="Document back side icon" 
                            className="w-16 h-16 mx-auto opacity-60 mb-2"
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          <Button
                            type="button"
                            onClick={() => startCameraForSide("back")}
                            variant="outline"
                            className="flex items-center gap-2"
                            disabled={isProcessing}
                          >
                            <Camera className="w-4 h-4" />
                            {t("document.take_photo")}
                          </Button>
                          <Button
                            type="button"
                            onClick={() => triggerFileUpload("back")}
                            variant="outline"
                            className="flex items-center gap-2"
                            disabled={isProcessing}
                          >
                            <Upload className="w-4 h-4" />
                            {t("document.upload")}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                          {t("document.expected_back")}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Camera Interface (when active) */}
            {isUsingCamera && (
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
                  <Button
                    type="button"
                    onClick={capturePhoto}
                    disabled={isProcessing}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Capture
                  </Button>
                  <Button type="button" onClick={stopCamera} variant="outline">
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Complete document processing notification */}
            {frontOCR &&
              (selectedDocumentType === "PAS" ||
                selectedDocumentType === "OTRO" ||
                backOCR) && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">
                      Document processing complete!
                    </span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    All required document sides have been processed
                    successfully.
                  </p>
                </div>
              )}

            {/* Hidden file inputs for each side */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept={
                selectedDocumentType === "OTRO"
                  ? ".doc,.docx,.pdf,.odt,.ott,.rtf,image/*"
                  : selectedDocumentType === "PAS"
                  ? "image/*,.pdf,.docx"
                  : "image/*,.pdf,.docx"
              }
              onChange={handleFileUpload}
            />
            <canvas ref={canvasRef} className="hidden" />
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default MultiDocumentCapture;