import React from 'react';

interface FaitLogoProps {
  className?: string;
}

const FaitLogo: React.FC<FaitLogoProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="font-bold text-primary">
        Build<span className="text-secondary">Smart</span> <span className="text-sm font-medium text-gray-600">by FAIT</span>
      </div>
    </div>
  );
};

export default FaitLogo;
