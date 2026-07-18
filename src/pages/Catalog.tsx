import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { Grid, List, SlidersHorizontal, ArrowUpDown, RefreshCw, Star, Percent, ArrowLeftRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { formatPrice } from '../utils/currency';
import { ProgressiveImage } from '../components/ProgressiveImage';
import { ProductCardSkeleton } from '../components/SkeletonLoader';

export const Catalog: React.FC = () => {
  const { products, categories, fetchProducts, addToCompare } = useShop();
  const [searchParams, setSearchParams] = useSearchParams();

  // Mode: list or grid
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mobile filter slide-over state
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 6;

  // Local filters syncing with searchParams
  const categoryParam = searchParams.get('category') || 'all';
  const brandParam = searchParams.get('brand') || 'all';
  const searchParam = searchParams.get('search') || '';
  const sortParam = searchParams.get('sort') || 'rating';
  const discountParam = searchParams.get('discount') === 'true';

  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(150000);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  // Trigger search on parameter adjustment
  useEffect(() => {
    fetchProducts({
      category: categoryParam,
      brand: brandParam,
      search: searchParam,
      sort: sortParam,
      minPrice: minPrice > 0 ? minPrice.toString() : undefined,
      maxPrice: maxPrice < 150000 ? maxPrice.toString() : undefined,
      rating: selectedRating ? selectedRating.toString() : undefined,
      discount: discountParam
    });
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [categoryParam, brandParam, searchParam, sortParam, minPrice, maxPrice, selectedRating, discountParam]);

  // Handle URL updates
  const updateURLParam = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value === 'all' || !value) {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }
    setSearchParams(nextParams);
  };

  const handleResetFilters = () => {
    setMinPrice(0);
    setMaxPrice(150000);
    setSelectedRating(null);
    setSearchParams(new URLSearchParams());
    setCurrentPage(1);
  };

  // Compile list of unique brands
  const allBrandsSet = new Set(products.map(p => p.brand));
  const uniqueBrands = Array.from(allBrandsSet);

  // Pagination logic
  const totalPages = Math.ceil(products.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Search Result Banner */}
      <div className="mb-8 border-b border-gray-200/60 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div>
          <h1 className="font-display font-extrabold text-4xl tracking-tight text-gray-900 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            {searchParam ? `Search matches for "${searchParam}"` : 'Store Catalog'}
          </h1>
          <p className="text-sm text-gray-600 mt-2 font-medium">
            Discover {products.length} sophisticated items matching your preferences.
          </p>
        </div>

        {/* View Toggle and Reset keys */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 text-xs font-semibold bg-gradient-to-r from-gray-50 to-white hover:from-emerald-50 hover:to-emerald-100 hover:text-emerald-700 hover:border-emerald-200 px-4 py-2.5 rounded-xl border border-gray-200 ml-auto transition-all shadow-sm hover:shadow-md min-h-[44px] button-ripple"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Clear Filters
          </button>

          {/* Mobile Filter Button */}
          <button
            onClick={() => setShowMobileFilters(true)}
            className="lg:hidden flex items-center gap-1.5 text-xs font-semibold bg-black text-white px-4 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg min-h-[44px] button-ripple"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
          </button>

          <div className="bg-white border border-gray-200 p-1 rounded-xl flex items-center gap-1 shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center button-ripple ${viewMode === 'grid' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black hover:bg-gray-50'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center button-ripple ${viewMode === 'list' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black hover:bg-gray-50'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* Mobile Filter Slide-over Overlay */}
        {showMobileFilters && (
          <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setShowMobileFilters(false)} />
        )}

        {/* Mobile Filter Slide-over */}
        <div className={`fixed inset-y-0 left-0 right-0 z-50 bg-white shadow-2xl transform transition-transform duration-300 lg:hidden ${showMobileFilters ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="h-full flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Filters</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-24">
              {/* Mobile Filter Content - Same as desktop sidebar */}
              <div className="flex items-center gap-2 font-display font-bold text-sm uppercase tracking-wider text-gray-700">
                <SlidersHorizontal className="w-4 h-4 text-black" /> Filter Options
              </div>

              <hr className="border-gray-200/60" />

              {/* Categories Selector */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase text-gray-800 tracking-wider">Collections</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => { updateURLParam('category', 'all'); setShowMobileFilters(false); }}
                    className={`w-full text-left text-xs px-3 py-2.5 rounded-lg transition-all min-h-[44px] flex items-center ${categoryParam === 'all' ? 'bg-black text-white font-semibold shadow-md' : 'hover:bg-gray-50 text-gray-600 hover:shadow-sm'}`}
                  >
                    All Departments
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { updateURLParam('category', cat.slug); setShowMobileFilters(false); }}
                      className={`w-full text-left text-xs px-3 py-2.5 rounded-lg transition-all min-h-[44px] flex items-center ${categoryParam === cat.slug ? 'bg-black text-white font-semibold shadow-md' : 'hover:bg-gray-50 text-gray-600 hover:shadow-sm'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <hr className="border-gray-200/60" />

              {/* Price Range Slider */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase text-gray-800 tracking-wider">Price Ceiling (₹)</h3>
                  <span className="text-xs font-bold text-gray-400">₹{maxPrice.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150000"
                  step="5000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="bg-gray-50 border border-gray-100 p-1.5 rounded-lg text-xs font-mono w-full text-center">
                    Min: <span className="font-bold">₹{minPrice.toLocaleString()}</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 p-1.5 rounded-lg text-xs font-mono w-full text-center">
                    Max: <span className="font-bold">₹{maxPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Core Brand Filter list */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase text-gray-800 tracking-wider">Brand Partners</h3>
                <select
                  value={brandParam}
                  onChange={(e) => updateURLParam('brand', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 outline-none focus:border-black min-h-[44px]"
                >
                  <option value="all">All Brands</option>
                  {uniqueBrands.map((brand, idx) => (
                    <option key={idx} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              <hr className="border-gray-100" />

              {/* Rating filter list */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase text-gray-800 tracking-wider">Minimum Rating</h3>
                <div className="flex items-center gap-1">
                  {[4, 4.5, 4.8].map(r => (
                    <button
                      key={r}
                      onClick={() => setSelectedRating(selectedRating === r ? null : r)}
                      className={`border px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all min-h-[44px] ${selectedRating === r ? 'bg-yellow-500 text-white border-yellow-500 shadow-md' : 'bg-white hover:bg-gray-50 text-gray-600 border-gray-200 hover:shadow-sm'}`}
                    >
                      <Star className="w-3 h-3 fill-current" /> {r}+
                    </button>
                  ))}
                </div>
              </div>

              {/* Seasonal Promotions check */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    const nextParams = new URLSearchParams(searchParams);
                    if (discountParam) {
                      nextParams.delete('discount');
                    } else {
                      nextParams.set('discount', 'true');
                    }
                    setSearchParams(nextParams);
                  }}
                  className={`w-full flex items-center justify-center gap-2 p-3 text-xs font-bold rounded-xl border transition-all min-h-[44px] ${discountParam ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-800 border-emerald-300 shadow-md' : 'bg-white text-gray-600 hover:text-black hover:border-emerald-300 border-gray-200 hover:shadow-sm'}`}
                >
                  <Percent className="w-4 h-4" /> Only Discounted Items
                </button>
              </div>

              <button
                onClick={() => { handleResetFilters(); setShowMobileFilters(false); }}
                className="w-full flex items-center justify-center gap-2 p-3 text-xs font-bold rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all min-h-[44px]"
              >
                <RefreshCw className="w-4 h-4" /> Reset All Filters
              </button>
            </div>
            
            {/* Sticky Apply Button for Mobile */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 mt-auto">
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full bg-black hover:bg-neutral-800 text-white font-semibold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg min-h-[48px]"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters Sidebar - Desktop */}
        <aside className="hidden lg:block w-72 space-y-6 flex-shrink-0 bg-white/80 backdrop-blur-xl border border-gray-200/60 p-6 rounded-2xl text-left shadow-sm sticky top-24 h-fit">
          
          {/* Header Title */}
          <div className="flex items-center gap-2 font-display font-bold text-sm uppercase tracking-wider text-gray-700">
            <SlidersHorizontal className="w-4 h-4 text-black" /> Filter Options
          </div>

          <hr className="border-gray-200/60" />

          {/* Categories Selector */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-gray-800 tracking-wider">Collections</h3>
            <div className="space-y-1">
              <button
                onClick={() => updateURLParam('category', 'all')}
                className={`w-full text-left text-xs px-3 py-2.5 rounded-lg transition-all ${categoryParam === 'all' ? 'bg-black text-white font-semibold shadow-md' : 'hover:bg-gray-50 text-gray-600 hover:shadow-sm'}`}
              >
                All Departments
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => updateURLParam('category', cat.slug)}
                  className={`w-full text-left text-xs px-3 py-2.5 rounded-lg transition-all ${categoryParam === cat.slug ? 'bg-black text-white font-semibold shadow-md' : 'hover:bg-gray-50 text-gray-600 hover:shadow-sm'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-gray-200/60" />

          {/* Price Range Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase text-gray-800 tracking-wider">Price Ceiling (₹)</h3>
              <span className="text-xs font-bold text-gray-400">₹{maxPrice.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="0"
              max="150000"
              step="5000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value))}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
            />
            <div className="flex items-center justify-between gap-2">
              <div className="bg-gray-50 border border-gray-100 p-1.5 rounded-lg text-xs font-mono w-full text-center">
                Min: <span className="font-bold">₹{minPrice.toLocaleString()}</span>
              </div>
              <div className="bg-gray-50 border border-gray-100 p-1.5 rounded-lg text-xs font-mono w-full text-center">
                Max: <span className="font-bold">₹{maxPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Core Brand Filter list */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-gray-800 tracking-wider">Brand Partners</h3>
            <select
              value={brandParam}
              onChange={(e) => updateURLParam('brand', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 outline-none focus:border-black"
            >
              <option value="all">All Brands</option>
              {uniqueBrands.map((brand, idx) => (
                <option key={idx} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          <hr className="border-gray-100" />

          {/* Rating filter list */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-gray-800 tracking-wider">Minimum Rating</h3>
            <div className="flex items-center gap-1">
              {[4, 4.5, 4.8].map(r => (
                <button
                  key={r}
                  onClick={() => setSelectedRating(selectedRating === r ? null : r)}
                  className={`border px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all button-ripple ${selectedRating === r ? 'bg-yellow-500 text-white border-yellow-500 shadow-md' : 'bg-white hover:bg-gray-50 text-gray-600 border-gray-200 hover:shadow-sm'}`}
                >
                  <Star className="w-3 h-3 fill-current star-animate" /> {r}+
                </button>
              ))}
            </div>
          </div>

          {/* Seasonal Promotions check */}
          <div className="pt-2">
            <button
              onClick={() => {
                const nextParams = new URLSearchParams(searchParams);
                if (discountParam) {
                  nextParams.delete('discount');
                } else {
                  nextParams.set('discount', 'true');
                }
                setSearchParams(nextParams);
              }}
              className={`w-full flex items-center justify-center gap-2 p-3 text-xs font-bold rounded-xl border transition-all button-ripple ${discountParam ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-800 border-emerald-300 shadow-md' : 'bg-white text-gray-600 hover:text-black hover:border-emerald-300 border-gray-200 hover:shadow-sm'}`}
            >
              <Percent className="w-4 h-4" /> Only Discounted Items
            </button>
          </div>

        </aside>

        {/* Dynamic products list/grid visual box */}
        <main className="flex-1 space-y-6">

          {/* Sorting and result metrics bars */}
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-sm text-left">
            <span className="text-gray-600">
              Showing <span className="font-bold text-black">{startIndex + 1}-{Math.min(endIndex, products.length)}</span> of <span className="font-bold text-black">{products.length}</span> items
            </span>

            {/* Sorting List select */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-gray-400 font-medium flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" /> Sort By:
              </span>
              <select
                value={sortParam}
                onChange={(e) => updateURLParam('sort', e.target.value)}
                className="bg-transparent border-none font-bold text-gray-800 outline-none p-1 text-xs cursor-pointer focus:ring-0"
              >
                <option value="rating">Highest Rated ★</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Recent Introductions</option>
              </select>
            </div>
          </div>

          {/* Actual items mapping loop */}
          {currentProducts.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 items-stretch">
                {currentProducts.map((prod) => (
                  <div key={prod.id} className="bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-3xl p-4 flex flex-col hover:shadow-2xl hover:border-emerald-300/50 transition-all duration-500 group relative overflow-hidden card-micro min-h-[420px]">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="absolute top-6 left-6 z-10 bg-gradient-to-r from-emerald-500/10 to-emerald-100/10 backdrop-blur-md text-emerald-700 font-mono text-[9px] font-bold px-2.5 py-1 rounded-full uppercase border border-emerald-200/50">
                      {prod.category}
                    </span>
                    <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden relative">
                      <ProgressiveImage
                        src={prod.images[0]}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>

                    <div className="mt-4 text-left flex-1 flex flex-col">
                      <div className="flex-1">
                        <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase tracking-widest">{prod.brand}</span>
                        <h3 className="font-semibold text-gray-800 text-sm mt-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">{prod.name}</h3>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed h-8">{prod.description}</p>
                      </div>

                      <div className="mt-auto">
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-xs font-semibold text-yellow-500">★ {prod.rating}</span>
                          <span className="text-gray-300 text-xs">|</span>
                          <span className="text-gray-400 text-xs">{prod.reviewsCount} reviews</span>
                        </div>

                        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-100/60 pt-3">
                          <div className="text-left">
                            {prod.discountPrice ? (
                              <>
                                <span className="font-extrabold text-gray-900 text-base">{formatPrice(prod.discountPrice)}</span>
                                <span className="text-xs text-gray-400 line-through ml-2">{formatPrice(prod.price)}</span>
                              </>
                            ) : (
                              <span className="font-extrabold text-gray-900 text-base">{formatPrice(prod.price)}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                addToCompare(prod);
                              }}
                              className="bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 text-gray-600 p-2 rounded-full transition-all border border-gray-200 hover:border-emerald-300 inline-flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] hover:scale-110 button-ripple flex-shrink-0"
                              title="Compare specs side-by-side"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                            </button>
                            <Link
                              to={`/product/${prod.slug}`}
                              className="flex-1 sm:flex-none bg-gradient-to-r from-black to-gray-800 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-semibold px-3 sm:px-4 py-2.5 rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-105 min-h-[44px] flex items-center justify-center button-ripple text-center"
                            >
                              View
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {currentProducts.map((prod) => (
                  <div key={prod.id} className="bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-3xl p-5 flex flex-col sm:flex-row gap-6 hover:shadow-2xl hover:border-emerald-300/50 transition-all group duration-500 text-left relative overflow-hidden card-micro">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="w-full sm:w-48 aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden flex-shrink-0 relative">
                      <ProgressiveImage
                        src={prod.images[0]}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-widest">{prod.brand}</span>
                        <h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors line-clamp-1">{prod.name}</h3>
                        <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{prod.richDescription || prod.description}</p>
                        
                        <div className="flex items-center gap-1.5 pt-2">
                          <span className="text-xs font-semibold text-yellow-500">★ {prod.rating}</span>
                          <span className="text-gray-300 text-xs">|</span>
                          <span className="text-gray-400 text-xs">{prod.reviewsCount} verified reviews</span>
                          <span className="text-gray-300 text-xs">|</span>
                          <span className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 ${prod.stock > 10 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {prod.stock > 10 ? 'In Stock' : 'Low Stock'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          {prod.discountPrice ? (
                            <div className="flex items-baseline gap-2">
                              <span className="font-extrabold text-gray-900 text-xl">{formatPrice(prod.discountPrice)}</span>
                              <span className="text-xs text-gray-400 line-through">{formatPrice(prod.price)}</span>
                            </div>
                          ) : (
                            <span className="font-extrabold text-gray-900 text-xl">{formatPrice(prod.price)}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              addToCompare(prod);
                            }}
                            className="bg-gray-50 hover:bg-neutral-100 hover:text-black text-gray-600 px-4 py-2 rounded-full transition-all border border-gray-200 inline-flex items-center gap-1.5 font-bold text-xs hover:scale-105 flex-shrink-0"
                            title="Compare specs side-by-side"
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" /> Compare
                          </button>
                          <Link
                            to={`/product/${prod.slug}`}
                            className="flex-1 sm:flex-none bg-gradient-to-r from-black to-gray-800 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-semibold px-4 sm:px-6 py-3 rounded-full transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 text-center"
                          >
                            Details & Customizations
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="bg-white border border-gray-50 p-20 rounded-3xl text-center space-y-4">
              <span className="text-4xl">🔍</span>
              <h3 className="font-display font-semibold text-lg text-gray-900">No matching search entries</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                We couldn't locate any products in our databases matching your filter values. Try resetting filters or adjust sliders!
              </p>
              <button
                onClick={handleResetFilters}
                className="bg-black text-white px-5 py-2.5 rounded-full text-xs font-semibold active:scale-95 transition-all"
              >
                Clear All Search Filters
              </button>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-semibold border border-gray-200"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${
                      currentPage === page
                        ? 'bg-black text-white shadow-lg shadow-black/20'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-semibold border border-gray-200"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </main>

      </div>
    </div>
    </div>
  );
};
