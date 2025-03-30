import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xl h-8',
    md: 'text-2xl h-10',
    lg: 'text-3xl h-12'
  };

  return (
    <div className={`flex items-center ${sizeClasses[size]}`}>
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-md shadow-md"></div>
        <div className="relative px-3 py-1 font-bold text-white">
          CleanFS
          <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-400"></span>
          </span>
        </div>
      </div>
      {size === 'md' || size === 'lg' ? (
        <div className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
          Open Source
        </div>
      ) : null}
    </div>
  );
};

export default Logo;
