import React, { useState, useCallback } from 'react';
import { Upload, Camera, FileCheck, AlertCircle, RotateCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';

interface CapturedDocument {
  id: string;
  type: 'front' | 'back';
  file: File;
  preview: string;
  confidence?: number;
  extractedData?: any;
}

interface MultiDocumentCaptureProps {
  onDocumentsCapture: (documents: CapturedDocument[]) => void;
  requiredDocuments?: Array<'front' | 'back'>;
  maxFileSize?: number;
  acceptedTypes?: string[];
  className?: string;
}

export default function MultiDocumentCapture({
  onDocumentsCapture,
  requiredDocuments = ['front', 'back'],
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className
}: MultiDocumentCaptureProps) {
  const [documents, setDocuments] = useState<CapturedDocument[]>([]);
  const [dragActive, setDragActive] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleFiles = useCallback(async (files: FileList, type: 'front' | 'back') => {
    const file = files[0];
    if (!file) return;

    // Validate file
    if (!acceptedTypes.includes(file.type)) {
      setErrors(prev => [...prev, `Tipo de archivo no válido. Usa: ${acceptedTypes.join(', ')}`]);
      return;
    }

    if (file.size > maxFileSize) {
      setErrors(prev => [...prev, `Archivo demasiado grande. Máximo: ${maxFileSize / 1024 / 1024}MB`]);
      return;
    }

    setProcessing(true);
    setErrors([]);

    try {
      const preview = URL.createObjectURL(file);
      const newDocument: CapturedDocument = {
        id: `${type}-${Date.now()}`,
        type,
        file,
        preview,
        confidence: Math.random() * 40 + 60, // Simulate OCR confidence
      };

      // Simulate OCR processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      setDocuments(prev => {
        const filtered = prev.filter(doc => doc.type !== type);
        const updated = [...filtered, newDocument];
        onDocumentsCapture(updated);
        return updated;
      });
    } catch (error) {
      setErrors(prev => [...prev, 'Error al procesar el documento']);
    } finally {
      setProcessing(false);
    }
  }, [acceptedTypes, maxFileSize, onDocumentsCapture]);

  const handleDrop = useCallback((e: React.DragEvent, type: 'front' | 'back') => {
    e.preventDefault();
    setDragActive(null);
    handleFiles(e.dataTransfer.files, type);
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    if (e.target.files) {
      handleFiles(e.target.files, type);
    }
  }, [handleFiles]);

  const removeDocument = useCallback((type: 'front' | 'back') => {
    setDocuments(prev => {
      const updated = prev.filter(doc => doc.type !== type);
      onDocumentsCapture(updated);
      return updated;
    });
  }, [onDocumentsCapture]);

  const getDocumentByType = (type: 'front' | 'back') => {
    return documents.find(doc => doc.type === type);
  };

  const renderCaptureArea = (type: 'front' | 'back') => {
    const document = getDocumentByType(type);
    const isDragActive = dragActive === type;
    const title = type === 'front' ? 'Anverso del Documento' : 'Reverso del Documento';

    return (
      <Card className={`relative ${isDragActive ? 'border-blue-500 bg-blue-50' : ''}`}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {document ? <FileCheck className="w-4 h-4 text-green-600" /> : <Camera className="w-4 h-4" />}
            {title}
            {document && document.confidence && (
              <span className={`text-xs px-2 py-1 rounded ${
                document.confidence > 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {Math.round(document.confidence)}% confianza
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {document ? (
            <div className="space-y-3">
              <div className="relative">
                <img
                  src={document.preview}
                  alt={`${title} capturado`}
                  className="w-full h-48 object-cover rounded border"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => removeDocument(type)}
                >
                  ×
                </Button>
              </div>
              {document.confidence && document.confidence < 80 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Baja confianza de OCR. Verifica que el documento sea legible.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={(e) => handleDrop(e, type)}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => setDragActive(type)}
              onDragLeave={() => setDragActive(null)}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Arrastra la imagen aquí o
                </p>
                <label htmlFor={`file-${type}`}>
                  <Button variant="outline" size="sm" asChild>
                    <span>Seleccionar archivo</span>
                  </Button>
                  <input
                    id={`file-${type}`}
                    type="file"
                    className="hidden"
                    accept={acceptedTypes.join(',')}
                    onChange={(e) => handleFileInput(e, type)}
                  />
                </label>
                <p className="text-xs text-gray-500">
                  PNG, JPG, WEBP hasta {maxFileSize / 1024 / 1024}MB
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {requiredDocuments.map(type => (
          <div key={type}>
            {renderCaptureArea(type)}
          </div>
        ))}
      </div>

      {processing && (
        <div className="flex items-center justify-center py-4">
          <RotateCw className="w-4 h-4 animate-spin mr-2" />
          <span className="text-sm text-gray-600">Procesando documentos...</span>
        </div>
      )}

      <div className="text-center text-sm text-gray-500">
        <p>
          Asegúrate de que los documentos sean legibles y estén bien iluminados.
          Los datos se extraerán automáticamente usando OCR.
        </p>
      </div>
    </div>
  );
}