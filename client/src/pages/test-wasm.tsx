import { useEffect, useState } from 'react';
import { wasmServices } from '../../../frontend/wasm-services';

export default function TestWASM() {
  const [wasmStatus, setWasmStatus] = useState('Initializing...');
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    async function testWasmServices() {
      try {
        console.log('Testing WASM services...');
        
        // Test initialization
        await wasmServices.initialize();
        setWasmStatus('✅ WASM Services Initialized');
        
        const results: string[] = [];
        
        // Test validation service
        const dniResult = wasmServices.validateDNI('12345678Z');
        results.push(`DNI Validation: ${JSON.stringify(dniResult)}`);
        
        // Test country service
        const countryResult = await wasmServices.getCountryInfo('Spain');
        results.push(`Country Info: ${countryResult}`);
        
        // Test OCR service
        const ocrResult = await wasmServices.processDocument('mock_image_data', 'DNI');
        results.push(`OCR Processing: ${ocrResult}`);
        
        setTestResults(results);
        
      } catch (error) {
        console.error('WASM test failed:', error);
        setWasmStatus(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    testWasmServices();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🦀 Rust WASM Microservices Test
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">WASM Status</h2>
          <p className="text-lg">{wasmStatus}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Service Test Results</h2>
          {testResults.length === 0 ? (
            <p className="text-gray-500">Running tests...</p>
          ) : (
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="bg-gray-100 p-3 rounded">
                  <code className="text-sm">{result}</code>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Architecture Info</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>✓ Zero Express.js server - all logic in WASM</li>
            <li>✓ Client-side document validation and OCR</li>
            <li>✓ Direct WASM service calls from React</li>
            <li>✓ Offline-capable core functionality</li>
            <li>✓ Zero server costs for backend processing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}