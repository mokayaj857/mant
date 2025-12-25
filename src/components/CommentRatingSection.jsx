import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Send, X, User, Calendar } from 'lucide-react';

const CommentRatingSection = ({ 
  eventId, 
  eventName, 
  canComment = false, 
  showPreview = false,
  onCommentAdded,
  onRatingAdded 
}) => {
  const [comments, setComments] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCommentsAndRatings();
  }, [eventId]);

  const fetchCommentsAndRatings = async () => {
    try {
      // Mock API call - replace with actual backend call
      // const response = await fetch(`/api/events/${eventId}/comments-ratings`);
      // const data = await response.json();
      
      // Mock data from localStorage
      const storedComments = localStorage.getItem(`comments_${eventId}`);
      const storedRatings = localStorage.getItem(`ratings_${eventId}`);
      
      const mockComments = storedComments ? JSON.parse(storedComments) : [
        {
          id: 1,
          userName: 'Alice Johnson',
          userWallet: '0x1234...5678',
          comment: 'Amazing event! The organization was top-notch and the speakers were incredible.',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          verified: true
        },
        {
          id: 2,
          userName: 'Bob Smith',
          userWallet: '0x8765...4321',
          comment: 'Great networking opportunities. Would definitely attend again!',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          verified: true
        }
      ];

      const mockRatings = storedRatings ? JSON.parse(storedRatings) : [
        { id: 1, userName: 'Alice Johnson', rating: 5, createdAt: new Date().toISOString() },
        { id: 2, userName: 'Bob Smith', rating: 4, createdAt: new Date().toISOString() },
        { id: 3, userName: 'Carol White', rating: 5, createdAt: new Date().toISOString() }
      ];

      setComments(mockComments);
      setRatings(mockRatings);
      
      // Calculate average rating
      if (mockRatings.length > 0) {
        const avg = mockRatings.reduce((sum, r) => sum + r.rating, 0) / mockRatings.length;
        setAverageRating(avg);
      }
    } catch (error) {
      console.error('Error fetching comments and ratings:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      // Mock API call - replace with actual backend call
      // await fetch(`/api/events/${eventId}/comments`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ comment: newComment })
      // });

      const comment = {
        id: Date.now(),
        userName: 'Current User',
        userWallet: '0xYour...Wallet',
        comment: newComment,
        createdAt: new Date().toISOString(),
        verified: true
      };

      const updatedComments = [...comments, comment];
      setComments(updatedComments);
      localStorage.setItem(`comments_${eventId}`, JSON.stringify(updatedComments));
      
      setNewComment('');
      setShowCommentModal(false);
      
      if (onCommentAdded) onCommentAdded(comment);
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitRating = async () => {
    if (newRating === 0) return;
    
    setIsSubmitting(true);
    try {
      // Mock API call - replace with actual backend call
      // await fetch(`/api/events/${eventId}/ratings`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ rating: newRating })
      // });

      const rating = {
        id: Date.now(),
        userName: 'Current User',
        rating: newRating,
        createdAt: new Date().toISOString()
      };

      const updatedRatings = [...ratings, rating];
      setRatings(updatedRatings);
      localStorage.setItem(`ratings_${eventId}`, JSON.stringify(updatedRatings));
      
      // Recalculate average
      const avg = updatedRatings.reduce((sum, r) => sum + r.rating, 0) / updatedRatings.length;
      setAverageRating(avg);
      
      setNewRating(0);
      setShowRatingModal(false);
      
      if (onRatingAdded) onRatingAdded(rating);
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderStars = (rating, interactive = false, size = 'w-5 h-5') => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`${size} ${
          (interactive ? (hoveredStar || newRating) : rating) > index
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-600'
        } ${interactive ? 'cursor-pointer transition-all' : ''}`}
        onClick={interactive ? () => setNewRating(index + 1) : undefined}
        onMouseEnter={interactive ? () => setHoveredStar(index + 1) : undefined}
        onMouseLeave={interactive ? () => setHoveredStar(0) : undefined}
      />
    ));
  };

  // Limit comments shown in preview mode
  const displayedComments = showPreview ? comments.slice(0, 3) : comments;

  return (
    <div className="space-y-4">
      {/* Rating Summary */}
      <div className={`${showPreview ? 'bg-transparent border-0 p-0' : 'bg-gray-900/50 backdrop-blur-xl rounded-xl border border-purple-500/30 p-6'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`${showPreview ? 'text-lg' : 'text-xl'} font-bold text-white flex items-center`}>
            <Star className={`${showPreview ? 'w-5 h-5' : 'w-6 h-6'} text-yellow-400 mr-2`} />
            {showPreview ? 'Rating' : 'Event Rating'}
          </h3>
          {canComment && !showPreview && (
            <button
              onClick={() => setShowRatingModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white rounded-lg transition-all duration-300 flex items-center space-x-2 text-sm"
            >
              <Star className="w-4 h-4" />
              <span>Rate Organizer</span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className={showPreview ? '' : 'text-center'}>
            <div className={`${showPreview ? 'text-2xl' : 'text-4xl'} font-bold text-yellow-400`}>
              {averageRating.toFixed(1)}
            </div>
            <div className={`flex items-center ${showPreview ? '' : 'justify-center'} mt-1`}>
              {renderStars(averageRating, false, showPreview ? 'w-4 h-4' : 'w-5 h-5')}
            </div>
            <div className={`${showPreview ? 'text-xs' : 'text-sm'} text-gray-400 mt-1`}>
              {ratings.length} {showPreview ? 'ratings' : 'total ratings'}
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className={`${showPreview ? 'bg-transparent border-0 p-0' : 'bg-gray-900/50 backdrop-blur-xl rounded-xl border border-purple-500/30 p-6'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`${showPreview ? 'text-lg' : 'text-xl'} font-bold text-white flex items-center`}>
            <MessageSquare className={`${showPreview ? 'w-5 h-5' : 'w-6 h-6'} text-purple-400 mr-2`} />
            Comments ({comments.length})
          </h3>
          {canComment && !showPreview && (
            <button
              onClick={() => setShowCommentModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg transition-all duration-300 flex items-center space-x-2 text-sm"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Add Comment</span>
            </button>
          )}
        </div>

        {/* Comments List */}
        <div className={`space-y-3 ${showPreview ? 'max-h-64' : 'max-h-96'} overflow-y-auto`}>
          {displayedComments.length > 0 ? (
            <>
              {displayedComments.map((comment) => (
                <div
                  key={comment.id}
                  className={`${showPreview ? 'p-3' : 'p-4'} bg-black/40 backdrop-blur-xl rounded-lg border border-purple-500/20`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`${showPreview ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center`}>
                        <User className={`${showPreview ? 'w-3 h-3' : 'w-4 h-4'} text-white`} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`${showPreview ? 'text-sm' : 'text-base'} font-semibold text-white`}>
                            {comment.userName}
                          </span>
                          {comment.verified && (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                              Verified
                            </span>
                          )}
                        </div>
                        {!showPreview && (
                          <span className="text-xs text-gray-400 font-mono">{comment.userWallet}</span>
                        )}
                      </div>
                    </div>
                    {!showPreview && (
                      <div className="flex items-center text-xs text-gray-400">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(comment.createdAt)}
                      </div>
                    )}
                  </div>
                  <p className={`text-gray-300 ${showPreview ? 'text-xs ml-8 line-clamp-2' : 'text-sm ml-10'}`}>
                    {comment.comment}
                  </p>
                </div>
              ))}
              {showPreview && comments.length > 3 && (
                <div className="text-center py-2">
                  <span className="text-sm text-purple-400">
                    +{comments.length - 3} more comments
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <MessageSquare className={`${showPreview ? 'w-8 h-8' : 'w-12 h-12'} mx-auto mb-2 opacity-50`} />
              <p className={showPreview ? 'text-sm' : ''}>
                {showPreview ? 'No comments yet' : 'No comments yet. Be the first to share your experience!'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-2xl border border-purple-500/50 max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Add Your Comment</h3>
              <button
                onClick={() => setShowCommentModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your experience at this event..."
              className="w-full bg-gray-800/50 border border-purple-500/30 rounded-lg p-4 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all resize-none"
              rows="5"
            />

            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowCommentModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg transition-all duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-2xl border border-purple-500/50 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Rate the Organizer</h3>
              <button
                onClick={() => setShowRatingModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="text-center py-6">
              <p className="text-gray-300 mb-4">How would you rate this event?</p>
              <div className="flex justify-center space-x-2">
                {renderStars(newRating, true, 'w-10 h-10')}
              </div>
              {newRating > 0 && (
                <p className="text-yellow-400 mt-4 text-lg font-semibold">
                  {newRating} {newRating === 1 ? 'Star' : 'Stars'}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowRatingModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={newRating === 0 || isSubmitting}
                className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white rounded-lg transition-all duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Star className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Rating'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentRatingSection;

