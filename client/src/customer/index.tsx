import React from 'react';
import { useI18n } from '@/contexts/i18n-context';

const Customer: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="text-center">
      <h1 className="text-4xl font-title mb-8">{t('welcome')}</h1>
      <p className="text-lg text-muted-foreground mb-8">
        {t('registration')}
      </p>
      <div className="bg-card p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
        <p>Pilgrim registration form will be displayed here.</p>
      </div>
    </div>
  );
};

export default Customer;