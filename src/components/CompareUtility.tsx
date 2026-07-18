import React from 'react';
import { useShop } from '../context/ShopContext';
import { X, ArrowLeftRight, Trash2, ShoppingCart, Star, CheckCircle, Info, TrendingUp, Award, Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CompareUtility: React.FC = () => {
  const {
    comparedProducts,
    removeFromCompare,
    clearCompare,
    isCompareOpen,
    setIsCompareOpen,
    addToCart,
    triggerNotification
  } = useShop();

  // Hide entire utility if empty
  if (comparedProducts.length === 0) return null;

  // Compile list of unique specification keys dynamically across compared items
  const specLabels: string[] = Array.from(
    new Set(
      comparedProducts.flatMap(p => (p.specifications || []).map(s => s.label as string))
    )
  );

  // Calculate comparison scores
  const calculateScore = (product: any) => {
    let score = 0;
    score += product.rating * 10; // Rating weight
    score += product.reviewsCount * 0.5; // Reviews count weight
    score += product.stock > 0 ? 5 : 0; // Stock availability
    score += product.discountPrice ? 10 : 0; // Discount bonus
    score += product.isFeatured ? 5 : 0; // Featured bonus
    score += product.isBestSeller ? 8 : 0; // Best seller bonus
    return Math.round(score);
  };

  const productScores = comparedProducts.map(p => ({ ...p, score: calculateScore(p) }));
  const maxScore = Math.max(...productScores.map(p => p.score), 1);

  const handleAddToCart = (product: any) => {
    // Select first options if available
    const initialVars: { [key: string]: string } = {};
    if (product.variants) {
      product.variants.forEach((v: any) => {
        initialVars[v.name] = v.options[0];
      });
    }
    addToCart(product, 1, initialVars);
  };

  return (
    <>
      {/* 1. FLOATING MINI-TRAY OVERLAY */}
      {!isCompareOpen && (
        <div className="fixed bottom-24 right-6 z-[999] animate-fade-in text-left">
          <div className="bg-neutral-900 border border-neutral-800 text-white rounded-2xl p-4 shadow-2xl space-y-3 max-w-sm w-80 lg:w-96 backdrop-blur-md bg-opacity-95">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider font-display">
                <ArrowLeftRight className="w-4 h-4 text-emerald-400" /> Comparison Deck
              </span>
              <span className="bg-neutral-800 text-[10px] px-2 py-0.5 rounded-full text-gray-300 font-bold font-mono">
                {comparedProducts.length}/3
              </span>
            </div>

            {/* Thumbnail Listing */}
            <div className="flex gap-2.5 items-center bg-neutral-950/40 p-2 rounded-xl border border-neutral-800/40">
              {comparedProducts.map((p) => (
                <div key={p.id} className="relative group w-12 h-12 rounded-lg overflow-hidden bg-neutral-850 flex-shrink-0 border border-neutral-850">
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeFromCompare(p.id)}
                    className="absolute -top-1 -right-1 bg-black text-rose-400 hover:text-rose-500 rounded-full p-0.5 shadow transition-all hover:scale-110"
                    title="Remove from comparison deck"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {comparedProducts.length < 3 && (
                <div className="border border-dashed border-neutral-800 bg-neutral-900/40 w-12 h-12 rounded-lg flex items-center justify-center text-neutral-600 text-[10px] font-semibold text-center italic">
                  + Add
                </div>
              )}
            </div>

            {/* Control triggers */}
            <div className="flex justify-between items-center text-xs pt-1">
              <button
                onClick={clearCompare}
                className="text-gray-400 hover:text-white font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear All
              </button>
              <button
                onClick={() => setIsCompareOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-neutral-950 px-4 py-2 rounded-lg font-extrabold flex items-center gap-1.5 shadow transition-all cursor-pointer"
              >
                Inspect Side-by-Side
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. SPECIFICATION SIDE-BY-SIDE MODAL OVERLAY */}
      {isCompareOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-gray-100 rounded-3xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[90vh] text-left overflow-hidden animate-slide-up">
            
            {/* Header section with Close triggers */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="space-y-1">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 font-mono">
                  <ArrowLeftRight className="w-4 h-4" /> Sovereign Side-by-Side Matrix
                </span>
                <h2 className="font-display font-extrabold text-xl tracking-tight text-gray-900">
                  Comparing Attributes ({comparedProducts.length}/3 selected)
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={clearCompare}
                  className="text-xs text-rose-500 hover:bg-rose-50 px-3 py-2 rounded-xl font-bold transition-all inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear Comparative List
                </button>
                <button
                  onClick={() => setIsCompareOpen(false)}
                  className="bg-black hover:bg-neutral-800 text-white rounded-full p-2 hover:scale-105 transition-all text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dynamic side-by-side grid matrix layout */}
            <div className="flex-grow overflow-x-auto p-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    {/* Left blank category header */}
                    <th className="p-4 w-1/4 text-xs font-bold uppercase tracking-wider text-gray-400 font-mono border-r border-gray-50 bg-gray-50/20">
                      Product Parameters
                    </th>
                    {/* 3 product comparison headers */}
                    {productScores.map((p, idx) => (
                      <th key={p.id} className={`p-4 w-[25%] align-top relative min-w-[220px] ${p.score === maxScore ? 'bg-emerald-50/30' : ''}`}>
                        <button
                          onClick={() => removeFromCompare(p.id)}
                          className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                          title="Eject item"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        {/* Score Badge */}
                        {p.score === maxScore && (
                          <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <Award className="w-3 h-3" /> Best Match
                          </div>
                        )}

                        <div className="space-y-3">
                          <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden w-28 h-28 mx-auto border border-gray-100 shadow-sm">
                            <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-bold text-blue-500 uppercase tracking-widest">{p.brand}</span>
                            <h3 className="font-semibold text-gray-900 text-xs mt-1 leading-snug line-clamp-2 h-8 hover:text-blue-500 transition-colors">
                              <Link to={`/product/${p.slug}`} onClick={() => setIsCompareOpen(false)}>
                                {p.name}
                              </Link>
                            </h3>
                          </div>
                          <div className="space-y-1">
                            {p.discountPrice ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <span className="font-extrabold text-xs text-gray-900">${p.discountPrice}</span>
                                <span className="text-[10.5px] text-gray-400 line-through">${p.price}</span>
                              </div>
                            ) : (
                              <span className="font-extrabold text-xs text-gray-900">${p.price}</span>
                            )}
                          </div>
                          
                          {/* Score Display */}
                          <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-gray-100">
                            <TrendingUp className="w-3 h-3 text-gray-500" />
                            <span className="text-[10px] font-bold text-gray-600">Score: {p.score}</span>
                          </div>
                        </div>
                      </th>
                    ))}
                    {/* Fill blank spaces to show 3 columns strictly */}
                    {comparedProducts.length < 3 && Array.from({ length: 3 - comparedProducts.length }).map((_, index) => (
                      <th key={index} className="p-4 w-[25%] bg-gray-50/30 font-medium italic text-xs text-gray-400 text-center uppercase tracking-widest align-middle min-w-[220px]">
                        <div className="space-y-4 py-8">
                          <div className="border-2 border-dashed border-gray-200 bg-white shadow-sm w-16 h-16 rounded-full flex items-center justify-center mx-auto text-xl text-gray-300">
                            +
                          </div>
                          <p className="text-[10px] font-bold font-sans">Slot For Comparison</p>
                          <Link
                            to="/catalog"
                            onClick={() => setIsCompareOpen(false)}
                            className="inline-block bg-neutral-100 hover:bg-neutral-200 font-semibold px-4 py-1.5 rounded-full text-[10px] text-neutral-700 transition"
                          >
                            Browse Items
                          </Link>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {/* Category Field */}
                  <tr className="border-b border-gray-100 hover:bg-gray-50/40">
                    <td className="p-3.5 font-bold text-gray-600 bg-gray-50/20 border-r border-gray-50 font-mono">Category</td>
                    {productScores.map((p) => (
                      <td key={p.id} className={`p-3.5 font-semibold text-center capitalize ${p.score === maxScore ? 'bg-emerald-50/50' : ''}`}>{p.category}</td>
                    ))}
                    {comparedProducts.length < 3 && Array.from({ length: 3 - comparedProducts.length }).map((_, i) => (
                      <td key={i} className="p-3.5 text-gray-300 text-center italic font-mono">—</td>
                    ))}
                  </tr>

                  {/* Trust Rating Index Row */}
                  <tr className="border-b border-gray-100 hover:bg-gray-50/40">
                    <td className="p-3.5 font-bold text-gray-600 bg-gray-50/20 border-r border-gray-50 font-mono">Customer Rating</td>
                    {productScores.map((p) => (
                      <td key={p.id} className={`p-3.5 text-center ${p.score === maxScore ? 'bg-emerald-50/50' : ''}`}>
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                          <span className="font-bold text-gray-800">{p.rating}</span>
                          <span className="text-[10px] text-gray-400">({p.reviewsCount})</span>
                        </div>
                      </td>
                    ))}
                    {comparedProducts.length < 3 && Array.from({ length: 3 - comparedProducts.length }).map((_, i) => (
                      <td key={i} className="p-3.5 text-gray-300 text-center italic font-mono">—</td>
                    ))}
                  </tr>

                  {/* Availability Index Row */}
                  <tr className="border-b border-gray-100 hover:bg-gray-50/40">
                    <td className="p-3.5 font-bold text-gray-600 bg-gray-50/20 border-r border-gray-50 font-mono">Stock Clearance</td>
                    {productScores.map((p) => (
                      <td key={p.id} className={`p-3.5 text-center font-semibold ${p.score === maxScore ? 'bg-emerald-50/50' : ''}`}>
                        {p.stock > 0 ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold flex items-center justify-center gap-1 w-max mx-auto border border-emerald-100">
                            <CheckCircle className="w-3 h-3" /> In Stock ({p.stock})
                          </span>
                        ) : (
                          <span className="text-red-700 bg-red-50 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold flex items-center justify-center gap-1 w-max mx-auto border border-red-100">
                            Sold Out
                          </span>
                        )}
                      </td>
                    ))}
                    {comparedProducts.length < 3 && Array.from({ length: 3 - comparedProducts.length }).map((_, i) => (
                      <td key={i} className="p-3.5 text-gray-300 text-center italic font-mono">—</td>
                    ))}
                  </tr>

                  {/* DYNAMIC UNION SPECIFICATION KEYS COHORT */}
                  {specLabels.length > 0 ? (
                    specLabels.map((label) => (
                      <tr key={label} className="border-b border-gray-100 hover:bg-gray-50/40">
                        <td className="p-3.5 font-bold text-gray-600 bg-gray-50/20 border-r border-gray-50 font-mono truncate max-w-xs capitalize">
                          {label}
                        </td>
                        {productScores.map((p) => {
                          const matchSpec = p.specifications?.find((s) => (s.label as string).toLowerCase() === (label as string).toLowerCase());
                          return (
                            <td key={p.id} className={`p-3.5 text-center font-semibold leading-relaxed ${p.score === maxScore ? 'bg-emerald-50/50' : ''}`}>
                              {matchSpec ? <span className="text-gray-800">{matchSpec.value}</span> : <span className="text-gray-300 italic">N/A</span>}
                            </td>
                          );
                        })}
                        {comparedProducts.length < 3 && Array.from({ length: 3 - comparedProducts.length }).map((_, i) => (
                          <td key={i} className="p-3.5 text-gray-300 text-center italic font-mono">—</td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-4 font-bold text-gray-400 bg-gray-50/25 border-r border-gray-50 font-mono">Specifications</td>
                      <td colSpan={3} className="p-4 text-center italic text-gray-400">
                        No custom specification details saved for these models.
                      </td>
                    </tr>
                  )}

                  {/* Summary Descriptions */}
                  <tr className="border-b border-gray-100 hover:bg-gray-50/40">
                    <td className="p-3.5 font-bold text-gray-600 bg-gray-50/20 border-r border-gray-50 font-mono align-top">Overview</td>
                    {productScores.map((p) => (
                      <td key={p.id} className={`p-3.5 font-medium leading-relaxed align-top text-xs ${p.score === maxScore ? 'bg-emerald-50/50' : ''}`}>
                        <p className="line-clamp-4 overflow-hidden h-16 text-gray-500">{p.description}</p>
                      </td>
                    ))}
                    {comparedProducts.length < 3 && Array.from({ length: 3 - comparedProducts.length }).map((_, i) => (
                      <td key={i} className="p-3.5 text-gray-300 text-center italic font-mono align-top">—</td>
                    ))}
                  </tr>

                  {/* Core Action Call buttons */}
                  <tr>
                    <td className="p-4 font-bold text-gray-400 bg-gray-50/20 border-r border-gray-50"></td>
                    {productScores.map((p) => (
                      <td key={p.id} className={`p-4 text-center ${p.score === maxScore ? 'bg-emerald-50/50' : ''}`}>
                        <div className="flex flex-col gap-2 max-w-[180px] mx-auto">
                          <button
                            onClick={() => handleAddToCart(p)}
                            disabled={p.stock <= 0}
                            className="bg-black hover:bg-neutral-800 text-white font-extrabold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow transition-all duration-200 active:scale-95 disabled:bg-gray-100 disabled:text-gray-400 disabled:pointer-events-none text-xs"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" /> Quick Add
                          </button>
                          <Link
                            to={`/product/${p.slug}`}
                            onClick={() => setIsCompareOpen(false)}
                            className="text-[11px] text-blue-500 hover:underline font-bold inline-block"
                          >
                            View Product Page
                          </Link>
                        </div>
                      </td>
                    ))}
                    {comparedProducts.length < 3 && Array.from({ length: 3 - comparedProducts.length }).map((_, i) => (
                      <td key={i} className="p-4 text-center">
                        <span className="text-[10px] text-gray-300 uppercase tracking-widest font-bold">Slot Vacant</span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Matrix notes footer code */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-400 font-medium flex items-center gap-2">
              <Info className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span>Select complementary components, accessories, or gears for quick comparing side-by-side. Unify configurations easily.</span>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
