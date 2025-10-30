import React from 'react';

const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-gray-800/50 p-4 rounded-lg animate-pulse">
      <div className="h-4 bg-gray-700 rounded w-3/4 mb-3"></div>
      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
    </div>
  );
};

export default SkeletonCard;