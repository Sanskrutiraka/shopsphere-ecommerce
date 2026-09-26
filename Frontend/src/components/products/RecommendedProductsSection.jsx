import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import api from '../../lib/api';
import ProductCard from './ProductCard';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function RecommendedProductsSection({
  title = 'Recommended For You',
  subtitle = 'Based on your browsing history and recent activity',
  limit = 8,
  wrapperClassName = 'bg-[#FFF7ED] neo-border border-l-0 border-r-0 py-12',
  containerClassName = 'max-w-7xl mx-auto px-4',
  gridClassName = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4',
  showFeedback = true,
  emptyMessage = '',
}) {
  const { user, isCustomer } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedbackPendingId, setFeedbackPendingId] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchRecommendations = async () => {
      if (!user || !isCustomer) {
        if (active) setRecommendations([]);
        return;
      }

      setLoading(true);
      try {
        const { data } = await api.get('/recommendations/', { params: { limit } });
        if (!active) return;
        setRecommendations(data.recommendations || []);
      } catch {
        if (active) setRecommendations([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchRecommendations();

    return () => {
      active = false;
    };
  }, [user, isCustomer, limit]);

  const submitRecommendationFeedback = async (productId, feedbackType) => {
    setFeedbackPendingId(productId);
    try {
      await api.post('/recommendations/feedback/', { product_id: productId, feedback_type: feedbackType });
      toast.success('Thanks for the feedback');
    } catch {
      toast.error('Failed to save feedback');
    } finally {
      setFeedbackPendingId(null);
    }
  };

  if (!user || !isCustomer) {
    if (!emptyMessage) {
      return null;
    }

    return (
      <section className={wrapperClassName}>
        <div className={containerClassName}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-[#F97316]" />
            <div>
              <h2 className="text-2xl font-black">{title}</h2>
              <p className="text-sm text-gray-500 font-medium">{subtitle}</p>
            </div>
            <TrendingUp size={20} className="text-[#F97316] ml-2" />
          </div>
          <div className="neo-card bg-white p-6 text-sm text-gray-500 font-medium">
            {emptyMessage}
          </div>
        </div>
      </section>
    );
  }

  if (!loading && recommendations.length === 0 && !emptyMessage) {
    return null;
  }

  return (
    <section className={wrapperClassName}>
      <div className={containerClassName}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 bg-[#F97316]" />
          <div>
            <h2 className="text-2xl font-black">{title}</h2>
            <p className="text-sm text-gray-500 font-medium">{subtitle}</p>
          </div>
          <TrendingUp size={20} className="text-[#F97316] ml-2" />
        </div>

        {loading ? (
          <div className={gridClassName}>
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="neo-card p-4 animate-pulse">
                <div className="bg-gray-200 aspect-square mb-3" />
                <div className="h-4 bg-gray-200 mb-2" />
                <div className="h-4 bg-gray-200 w-2/3" />
              </div>
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <div className={gridClassName}>
            {recommendations.map((product) => (
              <div key={product.id} className="space-y-2">
                <ProductCard product={product} />
                {showFeedback && (
                  <div className="flex items-center justify-between gap-2 text-[10px] font-black uppercase text-gray-500 px-1">
                    <span>Was this useful?</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={feedbackPendingId === product.id}
                        onClick={() => submitRecommendationFeedback(product.id, 'HELPFUL')}
                        className="neo-btn bg-white px-2 py-1 border text-[10px] disabled:opacity-50"
                      >
                        Helpful
                      </button>
                      <button
                        type="button"
                        disabled={feedbackPendingId === product.id}
                        onClick={() => submitRecommendationFeedback(product.id, 'NOT_HELPFUL')}
                        className="neo-btn bg-white px-2 py-1 border text-[10px] disabled:opacity-50"
                      >
                        Not relevant
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="neo-card bg-white p-6 text-sm text-gray-500 font-medium">
            {emptyMessage || 'Recommendations will appear once we have enough browsing or purchase history.'}
          </div>
        )}
      </div>
    </section>
  );
}