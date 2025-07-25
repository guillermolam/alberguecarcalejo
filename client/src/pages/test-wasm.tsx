import React from 'react';

const TestWASM: React.FC = () => {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-title mb-8">🦀 WASM Test Page</h1>
      <div className="bg-card p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
        <p className="text-lg mb-4">Test WASM microservices functionality</p>
        <p className="text-muted-foreground">
          WASM services integration will be tested here.
        </p>
      </div>
    </div>
  );
};

export default TestWASM;