import React from 'react';
import { useI18n } from '@/contexts/i18n-context';

const Admin: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="text-center">
      <h1 className="text-4xl font-title mb-8">{t('nav.admin')}</h1>
      <div className="bg-card p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
        <p>Admin dashboard will be displayed here.</p>
      </div>
    </div>
  );
};

export default Admin;