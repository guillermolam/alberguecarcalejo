import React from 'react';

const NotFound: React.FC = () => {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-title mb-8">404 - Page Not Found</h1>
      <p className="text-lg text-muted-foreground">
        The page you're looking for doesn't exist.
      </p>
    </div>
  );
};

export default NotFound;