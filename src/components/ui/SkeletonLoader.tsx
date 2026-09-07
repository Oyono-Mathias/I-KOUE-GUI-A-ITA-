import React from 'react';

export const SkeletonLoader: React.FC<{ count?: number, type?: 'card' | 'list' | 'table' }> = ({ count = 3, type = 'card' }) => {
  return (
    <div className={`grid gap-4 ${type === 'card' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse w-full">
          {type === 'card' && <div className="h-32 bg-gray-200 rounded-lg mb-4 w-full"></div>}
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      ))}
    </div>
  );
};
