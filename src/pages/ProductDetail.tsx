import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { Product, Review, TimerConfig, WarrantyConfig } from '../types';
import { Star, ShoppingBag, Heart, Share2, Shield, Info, Check, Sparkles, ArrowLeftRight, X, Maximize2, Truck, Clock, Ruler, Camera, ThumbsUp, ThumbsDown, Filter, ChevronDown, Verified, MessageSquare, HelpCircle, Send, Image as ImageIcon, Eye, Users, Timer, Award, Leaf, CreditCard, Zap, Package, Shirt, Droplets, Sun, Recycle, Flame } from 'lucide-react';
import { formatPrice } from '../utils/currency';
import { RecentlyViewed } from '../components/RecentlyViewed';
import { SizeGuide } from '../components/SizeGuide';
import { StockNotification } from '../components/StockNotification';
import { ProgressiveImage } from '../components/ProgressiveImage';
import { ProductReviewForm } from '../components/ProductReviewForm';

export const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { addToCart, addToWishlist, wishlist, addReview, triggerNotification, products, addToCompare, user, addToRecentlyViewed, getTimerForProduct, getWarrantyForProduct } = useShop();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [mayAlsoLike, setMayAlsoLike] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [frequentlyBoughtTogether, setFrequentlyBoughtTogether] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timerConfig, setTimerConfig] = useState<TimerConfig | null>(null);
  const [warrantyConfig, setWarrantyConfig] = useState<WarrantyConfig | null>(null);

  // Selections
  const [selectedImage, setSelectedImage] = useState('https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80');
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});
  const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: string }>({});
  const [quantity, setQuantity] = useState(1);
  const [currentStock, setCurrentStock] = useState<number>(0);

  // Review Form
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState('');
  const [reviewAdding, setReviewAdding] = useState(false);
  const [addToCartAnimating, setAddToCartAnimating] = useState(false);
  const [cartAnimationPhase, setCartAnimationPhase] = useState<'idle' | 'moving' | 'added'>('idle');

  // Size Guide Modal
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // Fullscreen Image
  const [showFullscreen, setShowFullscreen] = useState(false);

  // Reviews filtering and sorting
  const [reviewFilter, setReviewFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');
  const [reviewSort, setReviewSort] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);

  // Q&A state
  const [qaQuestions, setQaQuestions] = useState<Array<{ id: string; question: string; answer?: string; author: string; date: string; helpful: number }>>([]);
  const [showQaForm, setShowQaForm] = useState(false);
  const [qaQuestion, setQaQuestion] = useState('');

  // Swipe gesture state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Delivery estimation
  const [pinCode, setPinCode] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>('3-5 business days');
  const [deliveryLocation, setDeliveryLocation] = useState<string>('');

  // Social proof
  const [viewersCount, setViewersCount] = useState(Math.floor(Math.random() * 50) + 10);
  const [recentPurchases, setRecentPurchases] = useState(Math.floor(Math.random() * 20) + 5);

  // Countdown timer for discount
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });

  const minSwipeDistance = 50;

  // Function to get stock for selected variant combination
  const getVariantStock = (variants: { [key: string]: string }) => {
    if (!product) return 0;
    
    // If product has inventory object with variant-specific stock
    if (product.inventory && Object.keys(product.inventory).length > 0) {
      // Create a key for the variant combination
      const variantKeys = Object.entries(variants)
        .map(([name, value]) => `${name}:${value}`)
        .sort()
        .join('|');
      
      // Check if this variant combination exists in inventory
      if (product.inventory[variantKeys] !== undefined) {
        return product.inventory[variantKeys];
      }
      
      // Try alternative key formats
      const altVariantKeys = Object.entries(variants)
        .map(([name, value]) => `${name}:${value}`)
        .join('|');
      
      if (product.inventory[altVariantKeys] !== undefined) {
        return product.inventory[altVariantKeys];
      }
    }
    
    // Fall back to general stock if no variant-specific inventory
    return product.stock || 0;
  };

  // Update current stock when variants change
  useEffect(() => {
    if (product) {
      const stock = getVariantStock(selectedVariants);
      setCurrentStock(stock);
      
      // Reset quantity if it exceeds current stock
      if (quantity > stock && stock > 0) {
        setQuantity(stock);
      }
    }
  }, [selectedVariants, product]);

  // Function to estimate delivery time based on pin code
  const estimateDeliveryTime = (pin: string) => {
    if (!pin || pin.length < 6) {
      setEstimatedDelivery('3-5 business days');
      setDeliveryLocation('');
      return;
    }

    // Simple logic to estimate delivery based on pin code first 2 digits (region)
    const region = parseInt(pin.substring(0, 2));
    let deliveryDays = '3-5 business days';
    let location = 'Standard Delivery';

    // Metro cities (common pin codes starting with these digits)
    const metroPins = ['11', '22', '33', '44', '40', '60', '69', '80', '56'];
    if (metroPins.includes(pin.substring(0, 2))) {
      deliveryDays = '1-2 business days';
      location = 'Metro City';
    }
    // Tier 2 cities
    else if (region >= 10 && region <= 39) {
      deliveryDays = '2-3 business days';
      location = 'Tier 2 City';
    }
    // Tier 3 cities
    else if (region >= 40 && region <= 69) {
      deliveryDays = '3-4 business days';
      location = 'Tier 3 City';
    }
    // Other regions
    else {
      deliveryDays = '4-6 business days';
      location = 'Other Region';
    }

    setEstimatedDelivery(deliveryDays);
    setDeliveryLocation(location);
  };

  const handlePinCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    setPinCode(value);
    if (value.length === 6) {
      estimateDeliveryTime(value);
    }
  };

  // Use user's address if logged in and has addresses
  useEffect(() => {
    if (user && user.addresses && user.addresses.length > 0) {
      const defaultAddress = user.addresses.find(addr => addr.isDefault) || user.addresses[0];
      if (defaultAddress && defaultAddress.zipCode) {
        setPinCode(defaultAddress.zipCode);
        estimateDeliveryTime(defaultAddress.zipCode);
      }
    }
  }, [user]);

  // Countdown timer effect
  useEffect(() => {
    if (!timerConfig) return;

    // Calculate end time based on timer duration
    const durationInHours = timerConfig.duration;
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + durationInHours);

    const timer = setInterval(() => {
      const now = new Date();
      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) {
        // Timer ended
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerConfig]);

  // Simulate live viewer count changes
  useEffect(() => {
    const interval = setInterval(() => {
      setViewersCount(prev => Math.max(5, prev + Math.floor(Math.random() * 5) - 2));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Helper function to generate suggested products
  const generateSuggestedProducts = (currentProduct: Product, allProducts: Product[]) => {
    // Filter out current product
    const otherProducts = allProducts.filter(p => p.id !== currentProduct.id);

    // "You may also like" - same category or brand
    const categoryMatches = otherProducts.filter(p => 
      p.category === currentProduct.category || p.brand === currentProduct.brand
    ).slice(0, 4);
    setMayAlsoLike(categoryMatches);

    // "Trending" - high rated products
    const trending = otherProducts
      .filter(p => p.rating >= 4.5)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 4);
    setTrendingProducts(trending);

    // "Frequently bought together" - similar price range
    const priceRange = currentProduct.price * 0.5;
    const similarPrice = otherProducts.filter(p => 
      Math.abs(p.price - currentProduct.price) <= priceRange
    ).slice(0, 3);
    setFrequentlyBoughtTogether(similarPrice);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (!product) return;

    const colorVariant = product.variants?.find((v: any) => v.name.toLowerCase() === 'color');
    const selectedColor = selectedVariants['Color'] || selectedVariants['color'];
    const colorImages = colorVariant?.images?.[selectedColor] || product.images;
    const currentIndex = colorImages?.indexOf(selectedImage) || 0;
    
    console.log('Swipe gesture - colorVariant:', colorVariant, 'selectedColor:', selectedColor, 'colorImages:', colorImages, 'currentIndex:', currentIndex);

    if (isLeftSwipe && currentIndex < colorImages.length - 1) {
      setSelectedImage(colorImages[currentIndex + 1]);
    }
    if (isRightSwipe && currentIndex > 0) {
      setSelectedImage(colorImages[currentIndex - 1]);
    }
  };

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!slug) {
        console.error('No slug provided');
        setError('No product slug provided');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching product details for slug:', slug);
        const res = await fetch(`/api/products/${slug}`);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('Product detail response:', data);
        
        // Handle different response formats
        let productData = null;
        let reviewsData = [];
        let relatedData = [];

        if (data.product) {
          productData = data.product;
          reviewsData = data.reviews || [];
          relatedData = data.related || [];
        } else if (data.data) {
          // data.data might be the product, or it might contain product/reviews/related
          if (data.data.product) {
            productData = data.data.product;
            reviewsData = data.data.reviews || [];
            relatedData = data.data.related || [];
          } else {
            // data.data is the product itself
            productData = data.data;
            reviewsData = data.reviews || [];
            relatedData = data.related || [];
          }
        } else {
          // Handle case where the response is the product directly
          productData = data;
        }

        if (productData) {
          setProduct(productData);
          setReviews(reviewsData);
          setRelated(relatedData);
          setSelectedImage(productData.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80');
          setCurrentStock(productData.stock || 0);

          // Fetch timer and warranty configs for this product
          const timer = getTimerForProduct(productData.id, productData.category);
          const warranty = getWarrantyForProduct(productData.id, productData.category);
          setTimerConfig(timer);
          setWarrantyConfig(warranty);

          // Generate suggested products based on current product
          generateSuggestedProducts(productData, products);

          // Track recently viewed
          addToRecentlyViewed(productData);

          // Preselect first option of each variant
          const initialVars: { [key: string]: string } = {};
          if (productData.variants && Array.isArray(productData.variants)) {
            productData.variants.forEach((v: any) => {
              if (v.options && v.options.length > 0) {
                initialVars[v.name] = v.options[0];
              }
            });
          }
          setSelectedVariants(initialVars);

          // Set initial images based on selected color variant
          const colorVariant = productData.variants?.find((v: any) => v.name.toLowerCase() === 'color');
          if (colorVariant && colorVariant.images && colorVariant.images[initialVars['Color'] || initialVars['color']]) {
            setSelectedImage(colorVariant.images[initialVars['Color'] || initialVars['color']][0]);
          }
        } else {
          console.error('No product found in response:', data);
          setError('Product not found in response');
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [slug]);

  // Update images when color variant changes
  useEffect(() => {
    if (!product) return;
    
    const colorVariant = product.variants?.find((v: any) => v.name.toLowerCase() === 'color');
    const selectedColor = selectedVariants['Color'] || selectedVariants['color'];
    
    console.log('Color variant changed:', { colorVariant, selectedColor, allVariants: selectedVariants });
    
    if (colorVariant && colorVariant.images && selectedColor && colorVariant.images[selectedColor]) {
      console.log('Setting color image:', colorVariant.images[selectedColor][0]);
      setSelectedImage(colorVariant.images[selectedColor][0]);
    } else if (colorVariant && colorVariant.images) {
      // Try to find the first available color images
      const firstColor = Object.keys(colorVariant.images)[0];
      if (firstColor && colorVariant.images[firstColor]?.length > 0) {
        console.log('Using first color images:', firstColor, colorVariant.images[firstColor][0]);
        setSelectedImage(colorVariant.images[firstColor][0]);
      }
    }
  }, [selectedVariants, product]);

  const handleZoomMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(1.8)'
    });
  };

  const handleZoomLeave = () => {
    setZoomStyle({ transform: 'scale(1)', transformOrigin: 'center' });
  };

  const handleShare = () => {
    // Copy fake url to clipboard
    navigator.clipboard.writeText(window.location.href);
    triggerNotification('Product Shared', 'Direct link successfully copied to your clipboard!', 'success');
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    // Check if user is logged in
    if (!user) {
      triggerNotification('Authentication Required', 'Please log in to add items to your cart', 'warning');
      return;
    }
    
    setCartAnimationPhase('moving');
    addToCart(product, quantity, selectedVariants);
    
    // Animation timeline
    setTimeout(() => {
      setCartAnimationPhase('added');
    }, 800); // Time for cart to move from left to right
    
    // Reset after showing "added" state
    setTimeout(() => {
      setCartAnimationPhase('idle');
    }, 2500);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setReviewAdding(true);

    const res = await addReview(product.id, formRating, formComment);
    setReviewAdding(false);

    if (res.success) {
      setFormComment('');
      setReviewPhotos([]);
      // Refresh reviews list locally
      setReviews(prev => [
        {
          id: `rev_temp_${Date.now()}`,
          productId: product.id,
          userName: 'You (Submitted)',
          rating: formRating,
          comment: formComment,
          date: new Date().toISOString(),
          images: reviewPhotos,
          approved: true
        },
        ...prev
      ]);
    } else {
      triggerNotification('Failed to add Review', res.error || 'Please sign in first.', 'warning');
    }
  };

  const handleQaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !qaQuestion.trim()) return;

    const newQuestion = {
      id: `qa_${Date.now()}`,
      question: qaQuestion,
      author: user?.name || 'Guest',
      date: new Date().toISOString(),
      helpful: 0
    };

    setQaQuestions(prev => [newQuestion, ...prev]);
    setQaQuestion('');
    setShowQaForm(false);
    triggerNotification('Question Submitted', 'Your question has been posted successfully!', 'success');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-20 animate-pulse grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl h-[450px]" />
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-8 rounded w-2/3" />
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-4 rounded w-1/3" />
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-24 rounded" />
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-10 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
          <span className="text-4xl">❌</span>
          <h2 className="font-display font-semibold text-lg">Error Loading Product</h2>
          <p className="text-xs text-gray-500">{error}</p>
          <Link to="/catalog" className="bg-gradient-to-r from-black to-gray-800 text-white px-6 py-2.5 rounded-full text-xs font-semibold inline-block">Return to Catalog</Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
          <span className="text-4xl">😿</span>
          <h2 className="font-display font-semibold text-lg">Product file missing</h2>
          <p className="text-xs text-gray-500">We could not locate the specifics of this product ID in our storage schemas.</p>
          <Link to="/catalog" className="bg-gradient-to-r from-black to-gray-800 text-white px-6 py-2.5 rounded-full text-xs font-semibold inline-block">Return to Catalog</Link>
        </div>
      </div>
    );
  }

  // Validate product has minimum required fields
  if (!product.id && !product.name) {
    console.error('Invalid product data - missing both id and name:', product);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
          <span className="text-4xl">⚠️</span>
          <h2 className="font-display font-semibold text-lg">Invalid product data</h2>
          <p className="text-xs text-gray-500">The product data is incomplete or corrupted.</p>
          <Link to="/catalog" className="bg-gradient-to-r from-black to-gray-800 text-white px-6 py-2.5 rounded-full text-xs font-semibold inline-block">Return to Catalog</Link>
        </div>
      </div>
    );
  }

  const inWishlist = wishlist.some(w => w.id === product.id);

  // Filter reviews based on selected rating
  const filteredReviews = reviewFilter === 'all'
    ? reviews
    : reviews.filter(r => r.rating === parseInt(reviewFilter));

  // Sort reviews based on selected sort option
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (reviewSort) {
      case 'newest':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'oldest':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      default:
        return 0;
    }
  });

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100 : 0
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 pb-24 lg:pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-left items-start">
        
        {/* Left Side: Images & Zoom Panel */}
        <div className="space-y-4">
          <div
            className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200/60 rounded-3xl overflow-hidden relative cursor-zoom-in shadow-sm touch-pan-y"
            onMouseMove={handleZoomMove}
            onMouseLeave={handleZoomLeave}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <ProgressiveImage
              src={selectedImage}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-100"
              style={zoomStyle}
            />
            <button
              onClick={() => setShowFullscreen(true)}
              className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
              title="View fullscreen"
            >
              <Maximize2 className="w-4 h-4 text-gray-700" />
            </button>
            {product.stock !== undefined && product.stock < 5 && (
              <span className="absolute top-4 left-4 bg-red-100 text-red-800 text-[9px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider backdrop-blur-sm">
                Only {product.stock} items remaining
              </span>
            )}
          </div>

          {/* Thumbnails row */}
          {(() => {
            const colorVariant = product.variants?.find((v: any) => v.name.toLowerCase() === 'color');
            const selectedColor = selectedVariants['Color'] || selectedVariants['color'];
            const colorImages = colorVariant?.images?.[selectedColor] || product.images;
            
            return colorImages && colorImages.length > 1 ? (
              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {colorImages.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-16 sm:w-20 aspect-square flex-shrink-0 rounded-2xl overflow-hidden border-2 bg-gradient-to-br from-gray-50 to-gray-100 transition-all card-micro ${selectedImage === img ? 'border-black shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <ProgressiveImage src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null;
          })()}
        </div>

        {/* Right Side: Attributes, Selections & Adders */}
        <div className="space-y-6">
          
          {/* Breadcrumb / Brand */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest bg-blue-50/80 backdrop-blur-sm px-2.5 py-1 rounded-md border border-blue-200">{product.brand || 'Unknown Brand'}</span>
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="p-2.5 rounded-full border border-gray-100 hover:bg-gray-50 transition-colors"
                title="Share link"
              >
                <Share2 className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={() => inWishlist ? null : addToWishlist(product)}
                className={`p-2.5 rounded-full border transition-all ${inWishlist ? 'bg-red-50 border-red-200 text-red-500' : 'border-gray-100 hover:bg-gray-50 text-gray-500'}`}
                title="Save product to wishlist"
              >
                <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* Name & price */}
          <div className="space-y-2">
            <h1 className="font-display font-extrabold text-2xl sm:text-3.5xl tracking-tight text-gray-900 leading-tight">
              {product.name || 'Product Name'}
            </h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center text-yellow-500 font-semibold text-sm">
                ★ {product.rating || 0} <span className="text-gray-300 text-xs mx-1.5">|</span> <span className="text-gray-400 text-xs font-medium font-sans">{reviews.length} customer reviews</span>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Price breakdown */}
          <div className="space-y-1">
            {product.discountPrice ? (
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-gray-900">{formatPrice(product.discountPrice)}</span>
                <span className="text-lg text-gray-400 line-through">{formatPrice(product.price)}</span>
                <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                  Save {formatPrice(product.price - product.discountPrice)} (-{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%)
                </span>
              </div>
            ) : (
              <span className="text-3xl font-extrabold text-gray-900">{formatPrice(product.price)}</span>
            )}
            <p className="text-[10px] text-gray-400 font-medium">GST and shipping calculations applied at active checkout steps.</p>
          </div>

          {/* Countdown Timer for Discount */}
          {timerConfig && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-3 border border-red-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-red-600 animate-pulse" />
                  <span className="text-xs font-bold text-red-700">{timerConfig.name || 'Limited Time Offer'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-mono font-bold">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </div>
                  <span className="text-red-600 font-bold">:</span>
                  <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-mono font-bold">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </div>
                  <span className="text-red-600 font-bold">:</span>
                  <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-mono font-bold">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </div>
                </div>
              </div>
              {timerConfig.description && (
                <p className="text-[10px] text-red-600 mt-1">{timerConfig.description}</p>
              )}
            </div>
          )}

          {/* Social Proof Indicators */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-gray-600">
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-medium">{viewersCount}</span>
              <span className="text-gray-400">viewing now</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600">
              <Users className="w-3.5 h-3.5 text-green-500" />
              <span className="font-medium">{recentPurchases}</span>
              <span className="text-gray-400">bought recently</span>
            </div>
          </div>

          {/* Stock Availability */}
          {currentStock !== undefined && (
            <>
              <div className={`p-3 rounded-xl ${currentStock > 10 ? 'bg-emerald-50 border border-emerald-200' : currentStock > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${currentStock > 10 ? 'bg-emerald-500' : currentStock > 0 ? 'bg-amber-500' : 'bg-red-500'} ${currentStock === 0 ? 'animate-pulse' : ''}`} />
                  <span className={`text-xs font-semibold ${currentStock > 10 ? 'text-emerald-700' : currentStock > 0 ? 'text-amber-700' : 'text-red-700'}`}>
                    {currentStock > 10 ? 'In Stock' : currentStock > 0 ? `Low Stock - Only ${currentStock} left` : 'Out of Stock'}
                  </span>
                </div>
                {currentStock > 0 && currentStock <= 10 && (
                  <p className="text-[10px] text-gray-600 mt-1">Order soon before it sells out!</p>
                )}
              </div>
              
              {/* Stock Notification for out of stock items */}
              {currentStock === 0 && (
                <StockNotification
                  productId={product.id}
                  productName={product.name}
                  isInStock={false}
                />
              )}
            </>
          )}

          {/* Description */}
          <p className="text-sm text-gray-600 leading-relaxed">
            {product.richDescription || product.description}
          </p>

          {/* Product Highlights/Benefits Cards */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
              <Award className="w-5 h-5 text-blue-600 mb-1" />
              <p className="text-[11px] font-bold text-gray-800">Premium Quality</p>
              <p className="text-[10px] text-gray-600">Certified authentic materials</p>
            </div>
            {warrantyConfig ? (
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-3 border border-emerald-100">
                <Shield className="w-5 h-5 text-emerald-600 mb-1" />
                <p className="text-[11px] font-bold text-gray-800">{warrantyConfig.name || `${warrantyConfig.duration}-Month Warranty`}</p>
                <p className="text-[10px] text-gray-600">{warrantyConfig.description || warrantyConfig.coverage?.join(', ') || 'Full coverage protection'}</p>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-3 border border-emerald-100">
                <Shield className="w-5 h-5 text-emerald-600 mb-1" />
                <p className="text-[11px] font-bold text-gray-800">1-Year Warranty</p>
                <p className="text-[10px] text-gray-600">Full coverage protection</p>
              </div>
            )}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-100">
              <Zap className="w-5 h-5 text-purple-600 mb-1" />
              <p className="text-[11px] font-bold text-gray-800">Fast Shipping</p>
              <p className="text-[10px] text-gray-600">Express delivery available</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-3 border border-orange-100">
              <Package className="w-5 h-5 text-orange-600 mb-1" />
              <p className="text-[11px] font-bold text-gray-800">Secure Packaging</p>
              <p className="text-[10px] text-gray-600">Damage-free delivery</p>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-gray-600" />
              <span className="text-xs font-bold text-gray-800">Accepted Payment Methods</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="bg-white px-3 py-2 rounded-lg border border-gray-200 flex items-center gap-2">
                <div className="w-8 h-5 bg-gradient-to-r from-green-500 to-green-700 rounded flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">UPI</span>
                </div>
              </div>
              <div className="bg-white px-3 py-2 rounded-lg border border-gray-200 flex items-center gap-2">
                <div className="w-8 h-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">APP</span>
                </div>
              </div>
              <div className="bg-white px-3 py-2 rounded-lg border border-gray-200 flex items-center gap-2">
                <div className="w-8 h-5 bg-gradient-to-r from-purple-500 to-purple-700 rounded flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">COD</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Variant Selectors */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-4 pt-2">
              {product.variants.map((v) => (
                <div key={v.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">{v.name}:</span>
                    {v.name.toLowerCase().includes('size') && (
                      <button
                        onClick={() => setShowSizeGuide(true)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        <Ruler className="w-3 h-3" /> Size Guide
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {v.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setSelectedVariants(p => ({ ...p, [v.name]: opt }))}
                        className={`text-xs px-4 py-3 rounded-xl font-medium transition-all border-2 min-h-[44px] ${selectedVariants[v.name] === opt ? 'bg-black border-black text-white shadow-lg scale-105' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300 text-gray-700'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Multi-item adjustments */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Quantity</span>
              <div className="border border-gray-100 rounded-xl px-2 py-2 flex items-center bg-gray-50 w-32 justify-between min-h-[44px]">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="p-2 px-3 hover:bg-gray-100 rounded text-gray-500 font-bold transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  -
                </button>
                <span className="text-sm font-semibold font-mono">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(currentStock || 999, q + 1))}
                  className="p-2 px-3 hover:bg-gray-100 rounded text-gray-500 font-bold transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  disabled={currentStock === 0}
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className={`flex-1 bg-black text-white hover:bg-neutral-800 font-semibold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-98 self-end relative overflow-hidden min-h-[44px] button-ripple ${cartAnimationPhase === 'added' ? 'bg-emerald-600' : ''} ${currentStock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={cartAnimationPhase !== 'idle' || currentStock === 0}
            >
              {cartAnimationPhase === 'moving' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <img
                    src="/assets/AddtoCart.svg"
                    alt="Adding to cart"
                    className="w-32 h-16"
                  />
                </div>
              )}
              {cartAnimationPhase === 'idle' && (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  Add To Cart
                </>
              )}
              {cartAnimationPhase === 'added' && (
                <>
                  <Check className="w-5 h-5" />
                  Added!
                </>
              )}
            </button>

            <button
              onClick={() => addToCompare(product)}
              className="bg-gray-105 hover:bg-gray-200 text-gray-750 hover:text-black font-bold p-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-98 self-end min-w-[44px] min-h-[44px]"
              title="Compare configurations side-by-side"
            >
              <ArrowLeftRight className="w-4 h-4" /> Compare
            </button>
          </div>

          {/* Secured indicators */}
          <div className="grid grid-cols-2 gap-4 pt-4 mt-2">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 border border-gray-100">
              <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div className="text-[11px]">
                <p className="font-semibold text-gray-800">1-Year Warranty</p>
                <p className="text-gray-400">Authorized replacement</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 border border-gray-100">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div className="text-[11px]">
                <p className="font-semibold text-gray-800">Return Locker ready</p>
                <p className="text-gray-400">Refunds inside 48 hours</p>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100 mt-4">
            <div className="flex items-center gap-3 mb-3">
              <Truck className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="text-[11px]">
                <p className="font-semibold text-gray-800">Free Delivery</p>
                <p className="text-gray-600">Enter your pin code for accurate delivery estimate</p>
              </div>
            </div>
            
            {/* Pin Code Input */}
            <div className="mb-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter 6-digit pin code"
                  value={pinCode}
                  onChange={handlePinCodeChange}
                  maxLength={6}
                  className="flex-1 bg-white border border-blue-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                />
                {user && user.addresses && user.addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const defaultAddress = user.addresses.find(addr => addr.isDefault) || user.addresses[0];
                      if (defaultAddress && defaultAddress.zipCode) {
                        setPinCode(defaultAddress.zipCode);
                        estimateDeliveryTime(defaultAddress.zipCode);
                      }
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Use My Address
                  </button>
                )}
              </div>
            </div>

            {/* Delivery Estimate */}
            {pinCode.length === 6 && (
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <p className="text-xs font-semibold text-gray-800">
                    Estimated Delivery: {estimatedDelivery}
                  </p>
                </div>
                {deliveryLocation && (
                  <p className="text-[10px] text-gray-600">
                    Location: {deliveryLocation}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-blue-200">
              <Clock className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              <div className="text-[11px]">
                <p className="font-semibold text-gray-800">Order within 2 hours</p>
                <p className="text-gray-600">Get it by tomorrow with express shipping</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Sticky Add to Cart Bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200/60 p-4 z-40 lg:hidden safe-area-inset-bottom">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            {product.discountPrice ? (
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-extrabold text-gray-900">{formatPrice(product.discountPrice)}</span>
                <span className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</span>
              </div>
            ) : (
              <span className="text-lg font-extrabold text-gray-900">{formatPrice(product.price)}</span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            className={`flex-1 bg-black text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 min-h-[44px] button-ripple ${cartAnimationPhase === 'added' ? 'bg-emerald-600' : ''}`}
            disabled={cartAnimationPhase !== 'idle'}
          >
            {cartAnimationPhase === 'idle' && (
              <>
                <ShoppingBag className="w-5 h-5" />
                Add to Cart
              </>
            )}
            {cartAnimationPhase === 'added' && (
              <>
                <Check className="w-5 h-5" />
                Added!
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs / Specifications & Review Sections */}
      <hr className="border-gray-100 my-16" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 text-left">
        
        {/* Specs Table */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-display font-bold text-lg text-gray-900 border-b border-gray-100 pb-2">Technical Properties</h3>
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <tbody>
                {product.specifications && product.specifications.length > 0 ? (
                  product.specifications.map((spec, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-4 py-3 font-semibold text-gray-500 w-1/3">{spec.label}</td>
                      <td className="px-4 py-3 text-gray-800">{spec.value}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-gray-400 text-center">No specifications available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reviews Board Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="font-display font-bold text-lg text-gray-900">Ratings Review Panel ({reviews.length})</h3>
            <span className="text-yellow-600 font-semibold text-sm">★ {product.rating} Average Rating</span>
          </div>

          {/* Rating Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="text-5xl font-extrabold text-gray-900">{product.rating || 0}</div>
                <div>
                  <div className="flex text-yellow-500 text-lg">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-5 h-5 ${i < (product.rating || 0) ? 'fill-current' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{reviews.length} reviews</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-600 w-3">{rating}</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 transition-all duration-300" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Review Filter and Sort */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setReviewFilter('all')}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${reviewFilter === 'all' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                All ({reviews.length})
              </button>
              {[5, 4, 3, 2, 1].map(rating => (
                <button
                  key={rating}
                  onClick={() => setReviewFilter(rating.toString() as any)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${reviewFilter === rating.toString() ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {rating}★ ({reviews.filter(r => r.rating === rating).length})
                </button>
              ))}
            </div>
            
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={reviewSort}
                onChange={(e) => setReviewSort(e.target.value as any)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-black cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
              </select>
            </div>
          </div>

          {/* Form to submit review */}
          <ProductReviewForm
            productId={product.id}
            productName={product.name}
            onSubmit={async (rating, comment, photos) => {
              const res = await addReview(product.id, rating, comment, photos);
              if (res.success) {
                setReviews(prev => [
                  {
                    id: `rev_temp_${Date.now()}`,
                    productId: product.id,
                    userName: 'You (Submitted)',
                    rating,
                    comment,
                    date: new Date().toISOString(),
                    images: photos,
                    approved: true
                  },
                  ...prev
                ]);
              }
              return res;
            }}
            isSubmitting={reviewAdding}
          />

          {/* Active Reviews Loop */}
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
            {sortedReviews.length > 0 ? (
              sortedReviews.map((rev) => (
                <div key={rev.id} className="border border-gray-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={rev.userAvatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80'}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover border border-gray-100"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-800">{rev.userName}</span>
                          {rev.approved && (
                            <span className="bg-emerald-100 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
                              <Verified className="w-2.5 h-2.5" /> Verified
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-gray-400">{new Date(rev.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex text-yellow-500 font-bold text-xs gap-0.5">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed font-medium">"{rev.comment}"</p>
                  
                  {/* Review Photos */}
                  {rev.images && rev.images.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {rev.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Review photo ${idx + 1}`}
                          className="w-16 h-16 rounded-lg object-cover border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(img, '_blank')}
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Helpful Voting */}
                  <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                    <span className="text-[10px] text-gray-400">Was this helpful?</span>
                    <button className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-black transition-colors">
                      <ThumbsUp className="w-3 h-3" /> Yes
                    </button>
                    <button className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-black transition-colors">
                      <ThumbsDown className="w-3 h-3" /> No
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic text-center py-6">
                {reviewFilter === 'all' ? 'Be the initial customer to publish a rating for this item!' : `No ${reviewFilter}★ reviews yet`}
              </p>
            )}
          </div>

        </div>

      </div>

      {/* Related Products Row */}
      {related.length > 0 && (
        <div className="mt-20 space-y-6 text-left">
          <div>
            <h3 className="font-display font-bold text-lg text-gray-900 border-b border-gray-100 pb-2">Frequently viewed together</h3>
            <p className="text-xs text-gray-500 mt-1">Recommended complementaries and related collection additions.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((p) => (
              <Link
                key={p.id}
                to={`/product/${p.slug || p.id}`}
                className="group p-3 border border-gray-50 rounded-2xl block hover:shadow-md transition-all bg-white card-micro"
              >
                <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden">
                  <ProgressiveImage 
                    src={p.images && p.images[0] ? p.images[0] : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'} 
                    alt={p.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                  />
                </div>
                <h4 className="text-xs font-semibold text-gray-800 line-clamp-1 mt-3 group-hover:text-blue-500 transition-colors">{p.name}</h4>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400 font-medium font-mono uppercase">{p.brand}</span>
                  <span className="text-xs font-bold text-gray-900">{formatPrice(p.discountPrice || p.price)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* You May Also Like */}
      {mayAlsoLike.length > 0 && (
        <div className="mt-16 space-y-6 text-left">
          <div>
            <h3 className="font-display font-bold text-lg text-gray-900 border-b border-gray-100 pb-2">You May Also Like</h3>
            <p className="text-xs text-gray-500 mt-1">Similar products in {product?.category || 'this category'} or from {product?.brand || 'this brand'}</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {mayAlsoLike.map((p) => (
              <Link
                key={p.id}
                to={`/product/${p.slug || p.id}`}
                className="group p-3 border border-gray-50 rounded-2xl block hover:shadow-md transition-all bg-white card-micro"
              >
                <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden relative">
                  <ProgressiveImage 
                    src={p.images && p.images[0] ? p.images[0] : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'} 
                    alt={p.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                  />
                  {p.discountPrice && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                      -{Math.round(((p.price - p.discountPrice) / p.price) * 100)}%
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-semibold text-gray-800 line-clamp-1 mt-3 group-hover:text-blue-500 transition-colors">{p.name}</h4>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] text-yellow-500">★ {p.rating}</span>
                  <span className="text-[10px] text-gray-400">({p.reviewsCount || 0})</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400 font-medium font-mono uppercase">{p.brand}</span>
                  <span className="text-xs font-bold text-gray-900">{formatPrice(p.discountPrice || p.price)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Trending Products */}
      {trendingProducts.length > 0 && (
        <div className="mt-16 space-y-6 text-left">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-lg text-gray-900 border-b border-gray-100 pb-2">Trending Now</h3>
            <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full animate-pulse">HOT</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Popular products loved by customers</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingProducts.map((p) => (
              <Link
                key={p.id}
                to={`/product/${p.slug || p.id}`}
                className="group p-3 border border-gray-50 rounded-2xl block hover:shadow-md transition-all bg-white card-micro relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden">
                  <ProgressiveImage 
                    src={p.images && p.images[0] ? p.images[0] : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'} 
                    alt={p.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                  />
                </div>
                <h4 className="text-xs font-semibold text-gray-800 line-clamp-1 mt-3 group-hover:text-orange-500 transition-colors">{p.name}</h4>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] text-yellow-500">★ {p.rating}</span>
                  <span className="text-[10px] text-gray-400">({p.reviewsCount || 0})</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400 font-medium font-mono uppercase">{p.brand}</span>
                  <span className="text-xs font-bold text-gray-900">{formatPrice(p.discountPrice || p.price)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Frequently Bought Together */}
      {frequentlyBoughtTogether.length > 0 && (
        <div className="mt-16 space-y-6 text-left">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-lg text-gray-900 border-b border-gray-100 pb-2">Frequently Bought Together</h3>
              <p className="text-xs text-gray-500 mt-1">Complete your setup with these complementary items</p>
            </div>
            <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Flame className="w-3 h-3" /> Bundle Deal
            </span>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {frequentlyBoughtTogether.map((p, idx) => (
                <div key={p.id} className="relative">
                  <Link
                    to={`/product/${p.slug || p.id}`}
                    className="group block bg-white rounded-xl p-3 hover:shadow-lg transition-all card-micro"
                  >
                    <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-3 relative">
                      <ProgressiveImage 
                        src={p.images && p.images[0] ? p.images[0] : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'} 
                        alt={p.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      />
                      {p.discountPrice && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                          -{Math.round(((p.price - p.discountPrice) / p.price) * 100)}%
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-semibold text-gray-800 line-clamp-1 group-hover:text-blue-500 transition-colors">{p.name}</h4>
                    <div className="flex items-center gap-1 mt-1">
                      {p.discountPrice ? (
                        <>
                          <span className="text-xs font-bold text-gray-900">{formatPrice(p.discountPrice)}</span>
                          <span className="text-[10px] text-gray-400 line-through">{formatPrice(p.price)}</span>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-gray-900">{formatPrice(p.price)}</span>
                      )}
                    </div>
                  </Link>
                  {idx < frequentlyBoughtTogether.length - 1 && (
                    <div className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">+</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs text-gray-600">Individual Total:</span>
                  <span className="text-sm font-bold text-gray-500 line-through ml-2">
                    {formatPrice(
                      frequentlyBoughtTogether.reduce((sum, p) => sum + p.price, 0)
                    )}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-600">Bundle Price:</span>
                  <span className="text-lg font-bold text-emerald-600 ml-2">
                    {formatPrice(
                      frequentlyBoughtTogether.reduce((sum, p) => sum + (p.discountPrice || p.price), 0)
                    )}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full">
                    Save {formatPrice(
                      frequentlyBoughtTogether.reduce((sum, p) => sum + p.price, 0) - frequentlyBoughtTogether.reduce((sum, p) => sum + (p.discountPrice || p.price), 0)
                    )}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    ({Math.round(
                      ((frequentlyBoughtTogether.reduce((sum, p) => sum + p.price, 0) - frequentlyBoughtTogether.reduce((sum, p) => sum + (p.discountPrice || p.price), 0)) / frequentlyBoughtTogether.reduce((sum, p) => sum + p.price, 0)) * 100
                    )}% off)
                  </span>
                </div>
                <button 
                  onClick={() => {
                    frequentlyBoughtTogether.forEach(p => addToCart(p, 1, {}));
                    triggerNotification('Bundle Added', 'All items added to cart successfully!', 'success');
                  }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all button-ripple flex items-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" /> Add All to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recently Viewed Products */}
      <RecentlyViewed />

      {/* Product Q&A Section */}
      <div className="mt-16 space-y-6 text-left">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-gray-600" />
            <h3 className="font-display font-bold text-lg text-gray-900">Questions & Answers</h3>
          </div>
          <button
            onClick={() => setShowQaForm(!showQaForm)}
            className="text-xs font-semibold bg-gradient-to-r from-gray-50 to-white hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 hover:border-blue-200 px-4 py-2.5 rounded-xl border border-gray-200 transition-all shadow-sm hover:shadow-md flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Ask a Question
          </button>
        </div>

        {/* Q&A Form */}
        {showQaForm && (
          <form onSubmit={handleQaSubmit} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" /> Post a question
            </h4>
            <textarea
              rows={3}
              placeholder="e.g., Is this product compatible with Mac devices? What's the warranty period?"
              value={qaQuestion}
              onChange={(e) => setQaQuestion(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:border-black"
              required
            />
            <button
              type="submit"
              className="bg-black text-white hover:bg-neutral-800 px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors"
            >
              Submit Question
            </button>
          </form>
        )}

        {/* Q&A List */}
        <div className="space-y-4">
          {qaQuestions.length > 0 ? (
            qaQuestions.map((qa) => (
              <div key={qa.id} className="border border-gray-100 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <HelpCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-800">{qa.author}</span>
                      <span className="text-[9px] text-gray-400">{new Date(qa.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-gray-700 font-medium">{qa.question}</p>
                    
                    {qa.answer && (
                      <div className="mt-3 pt-3 border-t border-gray-50">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Seller Response</span>
                        </div>
                        <p className="text-xs text-gray-600">{qa.answer}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-50">
                      <button className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-black transition-colors">
                        <ThumbsUp className="w-3 h-3" /> Helpful ({qa.helpful})
                      </button>
                      {!qa.answer && (
                        <span className="text-[10px] text-gray-400 italic">Awaiting seller response</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-400 italic text-center py-6">
              No questions yet. Be the first to ask about this product!
            </p>
          )}
        </div>
      </div>

    </div>

    {/* Size Guide Modal */}
    <SizeGuide
      isOpen={showSizeGuide}
      onClose={() => setShowSizeGuide(false)}
      category="clothing"
    />

    {/* Fullscreen Image Modal */}
    {showFullscreen && (
      <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
        <button
          onClick={() => setShowFullscreen(false)}
          className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        <img
          src={selectedImage}
          alt={product?.name}
          className="max-w-full max-h-full object-contain"
        />
        {product?.images && product.images.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(img)}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 ${selectedImage === img ? 'border-white' : 'border-white/30 opacity-60'}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    )}

    {/* Mobile Sticky Add to Cart Button */}
    <div className="lg:hidden fixed bottom-20 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 p-4 shadow-2xl z-40">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-[10px] text-gray-500 font-medium">Total Price</p>
          <p className="text-lg font-extrabold text-gray-900">
            {product ? formatPrice((product.discountPrice || product.price) * quantity) : formatPrice(0)}
          </p>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={cartAnimationPhase !== 'idle' || currentStock === 0}
          className={`flex-1 bg-black hover:bg-neutral-800 text-white font-semibold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 min-h-[48px] ${cartAnimationPhase === 'added' ? 'bg-emerald-600' : ''} ${currentStock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {cartAnimationPhase === 'idle' && (
            <>
              <ShoppingBag className="w-5 h-5" />
              Add to Cart
            </>
          )}
          {cartAnimationPhase === 'moving' && (
            <span className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Adding...
            </span>
          )}
          {cartAnimationPhase === 'added' && (
            <>
              <Check className="w-5 h-5" />
              Added!
            </>
          )}
        </button>
      </div>
    </div>
    </div>
  );
};
