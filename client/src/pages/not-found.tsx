import React from 'react';
import { useI18n } from '@/contexts/i18n-context';
import { Button } from '@/components/ui/button';

const NotFound: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Página no encontrada</p>
        <Button onClick={() => window.location.href = '/'}>
          Volver al inicio
        </Button>
      </div>
    </div>
  );
};

export default NotFound;