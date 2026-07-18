import React, { useState } from 'react';
import { X, Ruler, Info } from 'lucide-react';

interface SizeGuideProps {
  isOpen: boolean;
  onClose: () => void;
  category?: string;
}

interface SizeData {
  size: string;
  chest: string;
  waist: string;
  hips: string;
  length: string;
}

const clothingSizes: SizeData[] = [
  { size: 'XS', chest: '34-36', waist: '28-30', hips: '34-36', length: '26' },
  { size: 'S', chest: '36-38', waist: '30-32', hips: '36-38', length: '27' },
  { size: 'M', chest: '38-40', waist: '32-34', hips: '38-40', length: '28' },
  { size: 'L', chest: '40-42', waist: '34-36', hips: '40-42', length: '29' },
  { size: 'XL', chest: '42-44', waist: '36-38', hips: '42-44', length: '30' },
  { size: 'XXL', chest: '44-46', waist: '38-40', hips: '44-46', length: '31' },
];

const shoeSizes = [
  { size: 'US 6', uk: 'EU 39', cm: '24.5' },
  { size: 'US 7', uk: 'EU 40', cm: '25.5' },
  { size: 'US 8', uk: 'EU 41', cm: '26.0' },
  { size: 'US 9', uk: 'EU 42', cm: '27.0' },
  { size: 'US 10', uk: 'EU 43', cm: '28.0' },
  { size: 'US 11', uk: 'EU 44', cm: '28.5' },
  { size: 'US 12', uk: 'EU 45', cm: '29.5' },
];

export const SizeGuide: React.FC<SizeGuideProps> = ({ isOpen, onClose, category = 'clothing' }) => {
  const [activeTab, setActiveTab] = useState<'clothing' | 'shoes'>('clothing');
  const [hoveredSize, setHoveredSize] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Ruler className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-gray-900">Size Guide</h2>
              <p className="text-xs text-gray-500">Find your perfect fit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('clothing')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
              activeTab === 'clothing'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Clothing
          </button>
          <button
            onClick={() => setActiveTab('shoes')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
              activeTab === 'shoes'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Shoes
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'clothing' ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Measurements are in inches. For best results, measure yourself and compare with the chart.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 rounded-l-lg">Size</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Chest</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Waist</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Hips</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 rounded-r-lg">Length</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clothingSizes.map((size) => (
                      <tr
                        key={size.size}
                        className={`border-b border-gray-100 transition-all cursor-pointer ${
                          hoveredSize === size.size ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onMouseEnter={() => setHoveredSize(size.size)}
                        onMouseLeave={() => setHoveredSize(null)}
                      >
                        <td className="px-4 py-3 font-semibold text-gray-900">{size.size}</td>
                        <td className="px-4 py-3 text-gray-600">{size.chest}</td>
                        <td className="px-4 py-3 text-gray-600">{size.waist}</td>
                        <td className="px-4 py-3 text-gray-600">{size.hips}</td>
                        <td className="px-4 py-3 text-gray-600">{size.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {hoveredSize && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 animate-fade-in">
                  <p className="text-sm font-semibold text-blue-900">
                    Size {hoveredSize} Details
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    This size typically fits people with measurements in the ranges shown above.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Shoe sizes may vary by brand. We recommend trying on shoes if possible.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 rounded-l-lg">US Size</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">UK/EU Size</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 rounded-r-lg">CM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shoeSizes.map((size) => (
                      <tr
                        key={size.size}
                        className={`border-b border-gray-100 transition-all cursor-pointer ${
                          hoveredSize === size.size ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onMouseEnter={() => setHoveredSize(size.size)}
                        onMouseLeave={() => setHoveredSize(null)}
                      >
                        <td className="px-4 py-3 font-semibold text-gray-900">{size.size}</td>
                        <td className="px-4 py-3 text-gray-600">{size.uk}</td>
                        <td className="px-4 py-3 text-gray-600">{size.cm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {hoveredSize && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 animate-fade-in">
                  <p className="text-sm font-semibold text-blue-900">
                    {hoveredSize} Details
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Foot length in centimeters: {shoeSizes.find(s => s.size === hoveredSize)?.cm}cm
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-black text-white font-semibold py-3 px-6 rounded-xl hover:bg-neutral-800 transition-all button-ripple"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
