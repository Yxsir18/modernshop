import React, { useState } from 'react';
import { Star, Camera, X, Upload, Image as ImageIcon } from 'lucide-react';

interface ProductReviewFormProps {
  productId: string;
  productName: string;
  onSubmit: (rating: number, comment: string, photos: string[]) => Promise<{ success: boolean; error?: string }>;
  isSubmitting: boolean;
}

export const ProductReviewForm: React.FC<ProductReviewFormProps> = ({
  productId,
  productName,
  onSubmit,
  isSubmitting
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleStarClick = (star: number) => {
    setRating(star);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('productId', productId);

        const res = await fetch('/api/reviews/upload-photo', {
          method: 'POST',
          body: formData
        });

        const data = await res.json();
        if (data.success) {
          return data.url;
        }
        throw new Error('Upload failed');
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setPhotos(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error('Photo upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    await onSubmit(rating, comment, photos);
    setComment('');
    setPhotos([]);
    setRating(5);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Star Rating */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
          Your Rating
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="transition-transform star-animate"
            >
              <Star
                className={`w-6 h-6 ${
                  star <= (hoverRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
          Your Review
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product..."
          rows={4}
          className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none input-underline"
          required
        />
      </div>

      {/* Photo Upload */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
          Photos (Optional)
        </label>
        
        {/* Photo Preview Grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-3">
            {photos.map((photo, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                <img
                  src={photo}
                  alt={`Review photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all">
          {isUploading ? (
            <>
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-600">Uploading...</span>
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {photos.length > 0 ? 'Add more photos' : 'Upload photos'}
              </span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
            disabled={isUploading}
          />
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !comment.trim()}
        className="w-full bg-black text-white font-semibold py-3 px-6 rounded-xl hover:bg-neutral-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed button-ripple flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Submitting Review...</span>
          </>
        ) : (
          <>
            <Star className="w-4 h-4 fill-current" />
            <span>Submit Review</span>
          </>
        )}
      </button>
    </form>
  );
};
