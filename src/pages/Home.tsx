import React, { useState, useEffect, lazy, Suspense, memo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { ArrowRight, Star, ArrowUpRight, Award, Zap, Shield, Sparkles, Flame, TrendingUp, Clock, ShoppingBag, Heart, Eye } from 'lucide-react';
import { formatPrice } from '../utils/currency';
import { HeroSlide, HomeContent } from '../types';


const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'hero-fashion',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80',
    tagline: 'NEW SEASON ARRIVAL',
    title: 'The Golden Ratio Collection',
    description: 'Discover elevated luxury outerwear, modern knit hoodies, and crafted Italian calf suede boots designed for those who demand excellence.'
  },
  {
    id: 'hero-audio',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=80',
    tagline: 'PREMIUM AUDIO EXPERIENCE',
    title: 'AcousticMax Horizon 2',
    description: 'Experience immersive soundscapes with adaptive neural noise cancelling and an uncompromising titanium build for audiophiles.'
  },
  {
    id: 'hero-home',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=80',
    tagline: 'ARTISAN CRAFTSMANSHIP',
    title: 'Warm Basalt Interior Set',
    description: 'Transform your space with sculpted volcanic lava stonewares, organic terracotta planters, and GOTS-certified organic textures.'
  }
];

const DEFAULT_HOME_CONTENT: HomeContent = {
  trending: {
    title: 'Trending Collections',
    description: 'Explore our most popular categories curated for style-conscious shoppers.'
  },
  featured: {
    title: 'Featured Selections',
    description: 'Handpicked premium items that define quality and sophistication.'
  },
  bestSellers: {
    title: 'Customer Favorites',
    description: 'Top-rated products loved by thousands of satisfied customers worldwide.'
  },
  newArrivals: {
    title: 'Just Arrived',
    description: 'Be the first to discover our latest additions from premium brands.'
  },
  promoCards: [
    {
      id: 'promo-referral',
      accent: 'emerald',
      eyebrow: 'Early Subscriber Promotion',
      title: 'Refer a friend & capture 50 store points',
      description: 'Generate custom invite links inside your secure guest dashboard instantly.',
      buttonText: 'Access My Invitation URL',
      buttonUrl: '/dashboard'
    },
    {
      id: 'promo-flash',
      accent: 'amber',
      eyebrow: 'Seasonal Discount Vouchers',
      title: 'Deploy code FLASH20 at active checkout',
      description: 'Unlocks a flat 20% discount off AcousticLabs headphones, bags, and luxury items.',
      buttonText: 'Browse Active Flash Sales',
      buttonUrl: '/catalog'
    }
  ]
};

// Intersection Observer hook for lazy loading sections
const useIntersectionObserver = (options?: IntersectionObserverInit) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (ref.current) observer.unobserve(ref.current);
      }
    }, { threshold: 0.1, ...options });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [options]);

  return [ref, isVisible] as const;
};

export const Home: React.FC = () => {
  const { products, categories, wishlist, addToWishlist, removeFromWishlist, headerConfig, addToCart, triggerNotification } = useShop();
  const [activeSlide, setActiveSlide] = useState(0);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const heroSlides = headerConfig?.heroSlides?.length ? headerConfig.heroSlides : DEFAULT_HERO_SLIDES;
  const homeContent = headerConfig?.homeContent || DEFAULT_HOME_CONTENT;

  // Auto rotate hero slide every 7s
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(p => (p + 1) % heroSlides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    if (activeSlide >= heroSlides.length) setActiveSlide(0);
  }, [activeSlide, heroSlides.length]);

  const featuredProducts = headerConfig?.homeContent?.featuredProductIds?.length
    ? products.filter(p => headerConfig.homeContent.featuredProductIds?.includes(p.id)).slice(0, 4)
    : products.filter(p => p.isFeatured).slice(0, 4);
  const bestSellers = headerConfig?.homeContent?.bestSellerProductIds?.length
    ? products.filter(p => headerConfig.homeContent.bestSellerProductIds?.includes(p.id)).slice(0, 4)
    : products.filter(p => p.isBestSeller).slice(0, 4);
  const newArrivals = headerConfig?.homeContent?.newArrivalProductIds?.length
    ? products.filter(p => headerConfig.homeContent.newArrivalProductIds?.includes(p.id)).slice(0, 4)
    : products.filter(p => p.isNewArrival).slice(0, 4);

  const handleQuickAddToCart = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  // Skeleton loading component for product cards
  const ProductCardSkeleton = memo(() => (
    <div className="bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-sm animate-pulse">
      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20 flex flex-col gap-2">
        <div className="bg-gray-200 p-2 sm:p-2.5 rounded-full min-w-[44px] min-h-[44px]" />
        <div className="bg-gray-200 p-2 sm:p-2.5 rounded-full min-w-[44px] min-h-[44px]" />
      </div>
      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl" />
      <div className="mt-3 sm:mt-4 text-left">
        <div className="h-3 bg-gray-200 rounded w-1/3 mb-1" />
        <div className="h-4 bg-gray-200 rounded w-3/4 mt-1" />
        <div className="h-3 bg-gray-200 rounded w-1/2 mt-2" />
      </div>
      <div className="mt-3 sm:mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
        <div className="h-5 bg-gray-200 rounded w-1/3" />
        <div className="h-8 bg-gray-200 rounded-full w-20" />
      </div>
    </div>
  ));

  // Memoize product card component to prevent unnecessary re-renders
  const ProductCard = memo(({ product, inWishlist, isHovered }: { product: any, inWishlist: boolean, isHovered: boolean }) => (
    <div 
      className="bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-2xl p-3 sm:p-4 flex flex-col justify-between hover:shadow-2xl transition-all duration-500 group relative shadow-sm"
      onMouseEnter={() => setHoveredProduct(product.id)}
      onMouseLeave={() => setHoveredProduct(null)}
    >
      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20 flex flex-col gap-2">
        <button
          onClick={() => inWishlist ? removeFromWishlist(product.id) : addToWishlist(product)}
          className="bg-white hover:bg-red-50 p-2 sm:p-2.5 rounded-full shadow-md transition-all hover:scale-110 border border-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`w-4 h-4 sm:w-4 sm:h-4 ${inWishlist ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}`} />
        </button>
        <Link
          to={`/product/${product.slug}`}
          className="bg-white hover:bg-blue-50 p-2 sm:p-2.5 rounded-full shadow-md transition-all hover:scale-110 border border-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="View product details"
        >
          <Eye className="w-4 h-4 sm:w-4 sm:h-4 text-gray-400 hover:text-blue-500" />
        </Link>
      </div>
      <div className="relative">
        {product.discountPrice && (
          <div className="absolute top-0 left-0 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-br-lg rounded-tl-lg animate-pulse">
            SALE
          </div>
        )}
        <Link to={`/product/${product.slug}`} className="block">
          <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden relative border border-gray-100">
            <picture>
              <source 
                srcSet={`${product.images[0]}?w=400&format=webp 400w, ${product.images[0]}?w=800&format=webp 800w`}
                type="image/webp"
              />
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                loading="lazy"
                sizes="(max-width: 640px) 400px, 800px"
                srcSet={`${product.images[0]}?w=400 400w, ${product.images[0]}?w=800 800w`}
              />
            </picture>
            {isHovered && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                <button
                  onClick={(e) => handleQuickAddToCart(e, product)}
                  className="bg-white text-gray-900 p-3 sm:p-4 rounded-full hover:bg-emerald-500 hover:text-white transition-all hover:scale-110 shadow-lg min-w-[48px] min-h-[48px] flex items-center justify-center"
                  aria-label="Quick add to cart"
                >
                  <ShoppingBag className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </Link>
      </div>
      <div className="mt-3 sm:mt-4 text-left">
        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{product.brand}</span>
        <h3 className="font-semibold text-gray-800 text-sm mt-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">{product.name}</h3>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-xs font-semibold text-yellow-500 flex items-center gap-0.5">
            <Star className="w-3 h-3 fill-current" /> {product.rating}
          </span>
          <span className="text-gray-300 text-xs">|</span>
          <span className="text-gray-400 text-xs">{product.reviewsCount} reviews</span>
        </div>
      </div>
      <div className="mt-3 sm:mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
        <div className="text-left">
          {product.discountPrice ? (
            <>
              <span className="font-bold text-gray-900 text-base">{formatPrice(product.discountPrice)}</span>
              <span className="text-xs text-gray-400 line-through ml-2">{formatPrice(product.price)}</span>
            </>
          ) : (
            <span className="font-bold text-gray-900 text-base">{formatPrice(product.price)}</span>
          )}
        </div>
        <Link
          to={`/product/${product.slug}`}
          className="bg-gradient-to-r from-black to-gray-800 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-semibold px-3 sm:px-4 py-2 sm:py-2 rounded-full transition-all hover:shadow-lg min-h-[40px] flex items-center justify-center"
        >
          View Options
        </Link>
      </div>
    </div>
  ));

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setIsSubscribing(true);
    
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail })
      });

      const data = await response.json();

      if (response.ok) {
        triggerNotification(
          'Newsletter Subscribed',
          'You are now on our premium promo list for upcoming drops!',
          'success'
        );
        setNewsletterEmail('');
      } else if (response.status === 409) {
        triggerNotification(
          'Already Subscribed',
          'This email is already on our newsletter list.',
          'warning'
        );
      } else {
        triggerNotification(
          'Subscription Failed',
          data.error || 'Failed to subscribe. Please try again.',
          'error'
        );
      }
    } catch (error) {
      triggerNotification(
        'Subscription Failed',
        'Network error. Please try again.',
        'error'
      );
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 space-y-20 pb-20 relative scroll-smooth">
      {/* Floating decorative elements */}
      <div className="fixed top-20 right-10 w-20 h-20 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="fixed bottom-40 left-10 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
      <div className="fixed top-1/2 right-20 w-16 h-16 bg-purple-500/5 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
      
      {/* Hero Interactive Slider */}
      <section className="relative w-full h-[500px] sm:h-[600px] md:h-[700px] lg:h-[750px] bg-neutral-800 overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
          {/* Floating particles */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/20 rounded-full animate-bounce" style={{ animationDuration: '3s' }} />
          <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-emerald-400/20 rounded-full animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
          <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-blue-400/20 rounded-full animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1s' }} />
        </div>

        {heroSlides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${idx === activeSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'}`}
          >
            {/* Light gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-black/30 z-10" />
            
            {/* Image with enhanced parallax and zoom effect */}
            <div className="absolute inset-0 overflow-hidden">
              <img
                src={slide.image}
                alt={slide.title}
                className={`w-full h-full transition-transform duration-[12000ms] ease-out ${idx === activeSlide ? 'scale-110' : 'scale-105'}`}
                loading={idx === 0 ? 'eager' : 'lazy'}
                style={{
                  objectFit: slide.imageSizing?.objectFit || 'cover',
                  objectPosition: slide.imageSizing?.objectPosition || 'center'
                }}
              />
            </div>

            {/* Subtle gradient overlay with shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10" />
            <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent z-10 transition-transform duration-[2000ms] ${idx === activeSlide ? 'translate-x-0' : '-translate-x-full'}`} />

            {/* Slide Details with enhanced animations */}
            <div className="absolute inset-y-0 left-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-20 flex flex-col justify-center text-white col-span-3">
              <div className={`space-y-4 sm:space-y-6 transition-all duration-700 ${idx === activeSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                {/* Enhanced tagline with glass effect and glow */}
                <div className="inline-flex items-center gap-2">
                  <div className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                  <span className="text-[9px] sm:text-[11px] font-mono font-bold tracking-[0.2em] sm:tracking-[0.3em] text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full backdrop-blur-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300 cursor-default">
                    {slide.tagline}
                  </span>
                  <div className="h-px w-8 sm:w-12 bg-gradient-to-l from-transparent to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                </div>

                {/* Enhanced title with gradient text and glow */}
                <h1 className="font-display font-extrabold text-2xl sm:text-4xl md:text-6xl lg:text-8xl tracking-tight max-w-3xl leading-none">
                  <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                    {slide.title}
                  </span>
                </h1>

                {/* Enhanced description with better typography and glass effect */}
                <p className="text-gray-100 text-xs sm:text-sm md:text-lg lg:text-xl max-w-2xl leading-relaxed backdrop-blur-sm bg-black/10 p-3 sm:p-5 rounded-2xl border border-white/20 shadow-lg hidden sm:block">
                  {slide.description}
                </p>

                {/* Enhanced buttons with improved hover effects */}
                <div className="flex flex-wrap gap-3 sm:gap-4 mt-2 sm:mt-4">
                  <Link
                    to="/catalog"
                    className="group relative bg-white text-black hover:bg-neutral-100 font-semibold px-6 sm:px-9 py-3 sm:py-4 rounded-full flex items-center gap-2 sm:gap-3 transition-all duration-500 shadow-2xl shadow-white/20 hover:shadow-white/40 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 overflow-hidden text-sm sm:text-base"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Explore Catalog
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Link>
                  <Link
                    to="/catalog?discount=true"
                    className="group relative bg-black/40 hover:bg-black/60 text-white border border-white/30 hover:border-emerald-400 font-semibold px-6 sm:px-9 py-3 sm:py-4 rounded-full transition-all duration-500 backdrop-blur-xl hover:shadow-2xl hover:shadow-emerald-500/30 hover:shadow-[0_0_40px_rgba(52,211,153,0.2)] active:scale-95 overflow-hidden text-sm sm:text-base"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400 group-hover:animate-pulse group-hover:text-emerald-300 transition-colors" />
                      Shop Sales
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Link>
                </div>
              </div>

              {/* Enhanced Stats/Info bar with hover effects */}
              <div className={`flex flex-wrap gap-4 sm:gap-6 mt-6 sm:mt-8 pt-4 sm:pt-8 border-t border-white/10 transition-all duration-700 delay-100 ${idx === activeSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-300 group cursor-default hover:text-white transition-colors duration-300">
                  <div className="p-1.5 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors duration-300">
                    <Award className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <span className="font-medium">Premium Quality</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-300 group cursor-default hover:text-white transition-colors duration-300">
                  <div className="p-1.5 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors duration-300">
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <span className="font-medium">Secure Checkout</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-300 group cursor-default hover:text-white transition-colors duration-300">
                  <div className="p-1.5 bg-yellow-500/10 rounded-lg group-hover:bg-yellow-500/20 transition-colors duration-300">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <span className="font-medium">Fast Delivery</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Progress bar for auto-rotation */}
        <div className="absolute bottom-0 left-0 right-0 z-30 h-1 bg-white/10">
          <div 
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-100 ease-linear"
            style={{ width: `${((activeSlide + 1) / heroSlides.length) * 100}%` }}
          />
        </div>

        {/* Enhanced Hero dots indicator with glow effect */}
        <div className="absolute bottom-8 left-0 right-0 z-30 flex justify-center gap-3">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`relative h-2.5 rounded-full transition-all duration-500 ${idx === activeSlide ? 'w-14 bg-emerald-400 shadow-lg shadow-emerald-400/50 hover:shadow-emerald-400/70' : 'w-2.5 bg-white/40 hover:bg-white/60 hover:w-4 hover:shadow-lg'}`}
            >
              {idx === activeSlide && (
                <>
                  <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75" />
                  <div className="absolute inset-0 bg-emerald-300 rounded-full animate-pulse opacity-50" />
                </>
              )}
            </button>
          ))}
        </div>

        {/* Enhanced slide counter with glass effect */}
        <div className="absolute bottom-8 right-8 z-30 text-white/70 text-xs font-mono font-semibold backdrop-blur-md bg-black/40 px-4 py-2 rounded-full border border-white/15 shadow-lg hover:bg-black/50 hover:border-white/25 transition-all duration-300 cursor-default">
          <span className="text-emerald-400">{activeSlide + 1}</span> / {heroSlides.length}
        </div>

        {/* Enhanced navigation arrows with glow effects */}
        <button
          onClick={() => setActiveSlide(p => (p - 1 + heroSlides.length) % heroSlides.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 hover:border-white/40 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-white/20 group"
        >
          <ArrowRight className="w-5 h-5 rotate-180 group-hover:-translate-x-0.5 transition-transform duration-300" />
          <div className="absolute inset-0 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
        <button
          onClick={() => setActiveSlide(p => (p + 1) % heroSlides.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 hover:border-white/40 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-white/20 group"
        >
          <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform duration-300" />
          <div className="absolute inset-0 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">

        {/* Trending Categories Section */}
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full animate-pulse" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-600">Explore</span>
              </div>
              <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight text-gray-900">{homeContent.trending.title}</h2>
              <p className="text-sm text-gray-600 mt-2 font-medium">{homeContent.trending.description}</p>
            </div>
            <Link to="/catalog" className="text-sm font-semibold flex items-center gap-2 hover:underline text-black hover:text-emerald-600 transition-colors bg-white/80 backdrop-blur-sm px-5 py-3 rounded-full border border-gray-200 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/10 group self-start">
              View all collections <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {categories.slice(0, 5).map((cat, idx) => (
              <Link
                key={cat.id}
                to={`/catalog?category=${cat.slug}`}
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-neutral-100 block shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-emerald-300 transform hover:-translate-y-1"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 transition-all duration-300 group-hover:from-black/95" />
                <picture>
                  <source 
                    srcSet={`${cat.image}?w=300&format=webp 300w, ${cat.image}?w=600&format=webp 600w`}
                    type="image/webp"
                  />
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                    sizes="(max-width: 640px) 150px, 300px"
                    srcSet={`${cat.image}?w=300 300w, ${cat.image}?w=600 600w`}
                  />
                </picture>
                <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/10 transition-colors duration-300 z-5" />
                <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 z-20 text-white text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-bold text-sm sm:text-base leading-tight group-hover:text-emerald-300 transition-colors">{cat.name}</h3>
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-emerald-400" />
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-gray-300 font-medium line-clamp-1 mt-0.5">{cat.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Products (Refined Bento Grid styled layout) */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-600">Curated</span>
              </div>
              <h2 className="font-display font-bold text-4xl md:text-5xl tracking-tight text-gray-900">{homeContent.featured.title}</h2>
              <p className="text-sm text-gray-600 mt-2 font-medium">{homeContent.featured.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.length > 0 ? featuredProducts.map((prod) => {
              const inWishlist = wishlist.some(w => w.id === prod.id);
              const isHovered = hoveredProduct === prod.id;
              return <ProductCard key={prod.id} product={prod} inWishlist={inWishlist} isHovered={isHovered} />;
            }) : [1, 2, 3, 4].map(i => <ProductCardSkeleton key={i} />)}
          </div>
        </section>

        {/* Promotional Banner Row */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {homeContent.promoCards.slice(0, 2).map((card, idx) => {
            const isAmber = card.accent === 'amber';
            const Icon = isAmber ? Shield : Zap;
            return (
              <div key={card.id || idx} className={`${isAmber ? 'bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200' : 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200'} rounded-3xl p-8 flex flex-col justify-between border relative overflow-hidden text-left min-h-[240px] hover:shadow-2xl transition-all duration-500 shadow-sm group`}>
                <div className="max-w-xs z-10 space-y-2">
                  <span className={`${isAmber ? 'text-amber-700' : 'text-emerald-600'} text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1`}>
                    {isAmber ? <TrendingUp className="w-3 h-3" /> : <Flame className="w-3 h-3" />} {card.eyebrow}
                  </span>
                  <h3 className="font-display font-extrabold text-xl tracking-tight text-gray-900">{card.title}</h3>
                  <p className="text-neutral-500 text-xs">{card.description}</p>
                </div>
                <Link to={card.buttonUrl} className={`${isAmber ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800' : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800'} text-white text-xs font-bold px-5 py-2.5 rounded-full w-fit z-10 transition-all hover:shadow-lg mt-6 shadow-md hover:scale-105`}>
                  {card.buttonText}
                </Link>
                <Icon className={`absolute right-6 bottom-6 w-24 h-24 ${isAmber ? 'text-amber-500/10' : 'text-emerald-500/10'} stroke-1 group-hover:scale-110 transition-transform duration-500`} />
              </div>
            );
          })}
        </section>

        {/* Best Sellers and New Arrivals side-by-side grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          <section className="space-y-6 text-left">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-xl">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-0.5 w-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full" />
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-orange-600">Popular</span>
                </div>
                <h2 className="font-display font-bold text-2xl tracking-tight text-gray-900">{homeContent.bestSellers.title}</h2>
                <p className="text-xs text-gray-500">{homeContent.bestSellers.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bestSellers.map(p => (
                <Link key={p.id} to={`/product/${p.slug}`} className="flex gap-4 p-4 bg-white border border-gray-50 rounded-xl hover:shadow-xl hover:border-emerald-300 transition-all duration-500 group">
                  <img src={p.images[0]} alt={p.name} className="w-16 h-16 object-cover rounded-lg bg-gray-50 flex-shrink-0 group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                  <div className="flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-800 line-clamp-1 group-hover:text-emerald-600 transition-colors">{p.name}</h4>
                      <span className="text-[9px] text-gray-400 tracking-wider font-mono uppercase">{p.brand}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-900">{formatPrice(p.discountPrice || p.price)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="space-y-6 text-left">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-0.5 w-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" />
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-blue-600">Fresh</span>
                </div>
                <h2 className="font-display font-bold text-2xl tracking-tight text-gray-900">{homeContent.newArrivals.title}</h2>
                <p className="text-xs text-gray-500">{homeContent.newArrivals.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {newArrivals.map(p => (
                <Link key={p.id} to={`/product/${p.slug}`} className="flex gap-4 p-4 bg-white border border-gray-50 rounded-xl hover:shadow-xl hover:border-blue-300 transition-all duration-500 group">
                  <img src={p.images[0]} alt={p.name} className="w-16 h-16 object-cover rounded-lg bg-gray-50 flex-shrink-0 group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                  <div className="flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-800 line-clamp-1 group-hover:text-blue-600 transition-colors">{p.name}</h4>
                      <span className="text-[9px] text-gray-400 tracking-wider font-mono uppercase">{p.brand}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-900">{formatPrice(p.discountPrice || p.price)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

        </div>

        {/* Newsletter Signup Section */}
        {headerConfig?.homeContent?.newsletter?.enabled !== false && (
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 md:p-12 text-center">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-emerald-300 uppercase">Stay Updated</span>
              </div>
              <h2 className="font-display font-extrabold text-3xl md:text-4xl text-white mb-3">{headerConfig?.homeContent?.newsletter?.title || 'Get Exclusive Deals'}</h2>
              <p className="text-gray-400 text-sm mb-8">{headerConfig?.homeContent?.newsletter?.description || 'Subscribe to our newsletter and be the first to know about new arrivals, exclusive offers, and style tips.'}</p>
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubscribing}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isSubscribing ? 'Subscribing...' : 'Subscribe'}
                </button>
              </form>
              <p className="text-gray-500 text-xs mt-4">No spam, unsubscribe at any time.</p>
            </div>
          </section>
        )}

        {/* Global Clients & Brand Showcase */}
        {headerConfig?.homeContent?.brandShowcase?.enabled !== false && (
          <section className="border-t border-gray-100 pt-12 text-center space-y-6">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-gray-400">Authorized Brand Partners</span>
            <div className="flex flex-wrap justify-center items-center gap-10 opacity-40 grayscale hover:grayscale-0 transition-all duration-300">
              {(headerConfig?.homeContent?.brandShowcase?.brands || ['ACOUSTICLABS', 'APEXSYS', 'FOLIAGE', 'AURASOLID', 'NORDENTAILORS']).map((brand, idx) => (
                <span key={idx} className="font-display font-bold text-lg tracking-widest text-neutral-800">{brand}</span>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};
