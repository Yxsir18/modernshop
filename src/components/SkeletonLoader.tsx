import React from 'react';

interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', height = 'h-4', width = 'w-full' }) => {
  return (
    <div 
      className={`skeleton ${height} ${width} ${className}`}
      aria-hidden="true"
    />
  );
};

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
};

export const ReviewSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
};

export const CategoryCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-5 w-3/4 mx-auto" />
    </div>
  );
};

export const TableRowSkeleton: React.FC = () => {
  return (
    <div className="flex items-center space-x-4 p-4 border-b border-gray-200">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-16 rounded" />
    </div>
  );
};

export const DashboardWidgetSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-12 w-24" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
};
