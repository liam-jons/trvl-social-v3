import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import vendorPerformanceService from '../../services/vendor-performance-service';
/**
 * Rating Management Component - Manage customer reviews and ratings
 */
const RatingManagement = ({ vendorId }) => {
  const [reviews, setReviews] = useState([]);
  const [ratingStats, setRatingStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    rating: 'all',
    period: '30',
    status: 'all',
    hasResponse: 'all'
  });
  const [responseTexts, setResponseTexts] = useState({});
  const [submittingResponse, setSubmittingResponse] = useState(null);
  useEffect(() => {
    loadReviewData();
  }, [vendorId, filters]);
  const loadReviewData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Get rating metrics
      const performanceResult = await vendorPerformanceService.calculatePerformanceMetrics(vendorId, parseInt(filters.period));
      if (performanceResult.error) {
        throw new Error(performanceResult.error);
      }
      setRatingStats(performanceResult.data.metrics.reviews);
      // In a real implementation, this would fetch actual reviews from the database
      // For now, we'll simulate some review data
      const mockReviews = generateMockReviews(vendorId, filters);
      setReviews(mockReviews);
    } catch (err) {
      console.error('Load review data error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const generateMockReviews = (vendorId, filters) => {
    // This would normally come from the database
    const mockData = [
      {
        id: '1',
        customer: { name: 'Sarah Johnson', avatar: null },
        rating: 5,
        review: 'Amazing experience! The guide was knowledgeable and the scenery was breathtaking. Highly recommended!',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        adventure: 'Mountain Hiking Adventure',
        hasResponse: false,
        sentiment: 'positive'
      },
      {
        id: '2',
        customer: { name: 'Mike Chen', avatar: null },
        rating: 4,
        review: 'Great trip overall. The equipment was good and the route was well planned. Only minor issue was the weather but that\'s not controllable.',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        adventure: 'Rock Climbing Experience',
        hasResponse: true,
        response: 'Thank you for the feedback! We\'re glad you enjoyed the adventure. Weather can be unpredictable but we always prioritize safety.',
        responseDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        sentiment: 'positive'
      },
      {
        id: '3',
        customer: { name: 'Emily Davis', avatar: null },
        rating: 2,
        review: 'The adventure was disappointing. The guide seemed unprepared and we had to cut the trip short due to equipment issues.',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        adventure: 'Kayaking Tour',
        hasResponse: false,
        sentiment: 'negative',
        flagged: true
      },
      {
        id: '4',
        customer: { name: 'David Wilson', avatar: null },
        rating: 5,
        review: 'Absolutely perfect! Every detail was handled professionally. This exceeded all our expectations.',
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        adventure: 'Wildlife Safari',
        hasResponse: true,
        response: 'Thank you so much for this wonderful review! It means a lot to our team.',
        responseDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        sentiment: 'positive'
      },
      {
        id: '5',
        customer: { name: 'Lisa Brown', avatar: null },
        rating: 3,
        review: 'It was okay. The adventure itself was nice but the organization could be better. Communication was lacking.',
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        adventure: 'Desert Tour',
        hasResponse: false,
        sentiment: 'neutral'
      }
    ];
    // Apply filters
    return mockData.filter(review => {
      if (filters.rating !== 'all' && review.rating !== parseInt(filters.rating)) return false;
      if (filters.hasResponse !== 'all') {
        if (filters.hasResponse === 'responded' && !review.hasResponse) return false;
        if (filters.hasResponse === 'no-response' && review.hasResponse) return false;
      }
      return true;
    });
  };
  const submitResponse = async (reviewId) => {
    try {
      setSubmittingResponse(reviewId);
      const responseText = responseTexts[reviewId];
      if (!responseText || responseText.trim().length === 0) {
        throw new Error('Response text is required');
      }
      // In a real implementation, this would submit to the database
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Update local state
      setReviews(reviews.map(review =>
        review.id === reviewId
          ? {
              ...review,
              hasResponse: true,
              response: responseText,
              responseDate: new Date().toISOString()
            }
          : review
      ));
      setResponseTexts({ ...responseTexts, [reviewId]: '' });
    } catch (err) {
      console.error('Submit response error:', err);
      setError(err.message);
    } finally {
      setSubmittingResponse(null);
    }
  };
  const getSentimentBadge = (sentiment) => {
    const variants = {
      positive: 'bg-green-100 text-green-800',
      neutral: 'bg-yellow-100 text-yellow-800',
      negative: 'bg-red-100 text-red-800'
    };
    const labels = {
      positive: 'Positive',
      neutral: 'Neutral',
      negative: 'Negative'
    };
    return (
      <Badge className={variants[sentiment]}>
        {labels[sentiment]}
      </Badge>
    );
  };
  const getRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded-md mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rating Management</h2>
          <p className="text-gray-500 mt-1">
            Monitor customer reviews and manage your reputation
          </p>
        </div>
        <Button onClick={loadReviewData} variant="outline">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>
      {/* Rating Statistics */}
      {ratingStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">Average Rating</h3>
              <div className="flex items-center space-x-1">
                {getRatingStars(Math.round(ratingStats.averageRating))}
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {ratingStats.averageRating.toFixed(1)}
            </div>
            <div className="text-sm text-gray-500">
              From {ratingStats.totalReviews} reviews
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">Satisfaction Rate</h3>
              <Badge className="bg-green-100 text-green-800">
                {ratingStats.satisfactionRate.toFixed(1)}%
              </Badge>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {ratingStats.excellentReviews + ratingStats.goodReviews}
            </div>
            <div className="text-sm text-gray-500">
              Positive reviews
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">Review Velocity</h3>
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {ratingStats.reviewVelocity.toFixed(1)}
            </div>
            <div className="text-sm text-gray-500">
              Reviews per day
            </div>
          </Card>
        </div>
      )}
      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
            <select
              value={filters.rating}
              onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <select
              value={filters.period}
              onChange={(e) => setFilters({ ...filters, period: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Response Status</label>
            <select
              value={filters.hasResponse}
              onChange={(e) => setFilters({ ...filters, hasResponse: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Reviews</option>
              <option value="responded">Responded</option>
              <option value="no-response">Needs Response</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => setFilters({
                rating: 'all',
                period: '30',
                status: 'all',
                hasResponse: 'all'
              })}
              variant="outline"
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>
      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-2.66-.4l-5.934 2.371L7.65 17.54A7.968 7.968 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Found</h3>
            <p className="text-gray-500">No reviews match your current filters.</p>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className={`p-6 ${review.flagged ? 'border-red-200 bg-red-50' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {review.customer.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{review.customer.name}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex items-center space-x-1">
                        {getRatingStars(review.rating)}
                      </div>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">{formatDate(review.date)}</span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-600">{review.adventure}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getSentimentBadge(review.sentiment)}
                  {review.flagged && (
                    <Badge className="bg-red-100 text-red-800">
                      Flagged
                    </Badge>
                  )}
                  {review.hasResponse && (
                    <Badge className="bg-blue-100 text-blue-800">
                      Responded
                    </Badge>
                  )}
                </div>
              </div>
              <div className="mb-4">
                <p className="text-gray-700">{review.review}</p>
              </div>
              {/* Existing Response */}
              {review.hasResponse && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4">
                  <div className="flex items-center mb-2">
                    <svg className="w-4 h-4 text-blue-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span className="text-sm font-medium text-blue-800">Your Response</span>
                    <span className="text-xs text-blue-600 ml-2">
                      {formatDate(review.responseDate)}
                    </span>
                  </div>
                  <p className="text-blue-700 text-sm">{review.response}</p>
                </div>
              )}
              {/* Response Form */}
              {!review.hasResponse && (
                <div className="border-t pt-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Write a response
                      </label>
                      <textarea
                        value={responseTexts[review.id] || ''}
                        onChange={(e) => setResponseTexts({
                          ...responseTexts,
                          [review.id]: e.target.value
                        })}
                        placeholder="Thank the customer and address any concerns..."
                        rows={3}
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        {responseTexts[review.id] ? responseTexts[review.id].length : 0}/500 characters
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => setResponseTexts({
                            ...responseTexts,
                            [review.id]: review.rating >= 4
                              ? `Thank you so much for your wonderful review! We're thrilled that you enjoyed your ${review.adventure.toLowerCase()}. Your feedback means a lot to our team and motivates us to continue providing exceptional experiences.`
                              : `Thank you for your feedback about your ${review.adventure.toLowerCase()}. We take all reviews seriously and would love to discuss how we can improve. Please feel free to contact us directly so we can address your concerns.`
                          })}
                          variant="outline"
                          size="sm"
                        >
                          Use Template
                        </Button>
                        <Button
                          onClick={() => submitResponse(review.id)}
                          disabled={!responseTexts[review.id] || submittingResponse === review.id}
                          size="sm"
                        >
                          {submittingResponse === review.id ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Responding...
                            </>
                          ) : (
                            'Post Response'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
      {/* Error Display */}
      {error && (
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.966-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-red-800">{error}</span>
          </div>
        </Card>
      )}
    </div>
  );
};
export default RatingManagement;