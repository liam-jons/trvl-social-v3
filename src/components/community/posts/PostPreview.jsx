import GlassCard from '../../ui/GlassCard';
import MediaGallery from '../../media/MediaGallery';

const PostPreview = ({ title, content, tags = [], category, author = 'You', mediaItems = [] }) => {
  const formatDate = (date = new Date()) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <GlassCard className="max-w-none">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {author.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {author}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate()} • Preview
            </div>
          </div>
        </div>

        {category && (
          <span className="px-2 py-1 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium">
            {category}
          </span>
        )}
      </div>

      {/* Post Title */}
      {title && (
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {title}
        </h1>
      )}

      {/* Post Content */}
      <div
        className="prose prose-sm dark:prose-invert max-w-none mb-4"
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {/* Media Gallery */}
      {mediaItems.length > 0 && (
        <div className="mb-4">
          <MediaGallery
            mediaItems={mediaItems}
            editable={false}
            maxHeight="400px"
          />
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-200/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 rounded text-xs"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Mock Interaction Buttons */}
      <div className="flex items-center gap-6 pt-4 border-t border-white/10">
        <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="text-sm">Like</span>
        </button>

        <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-sm">Comment</span>
        </button>

        <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
          <span className="text-sm">Share</span>
        </button>
      </div>
    </GlassCard>
  );
};

export default PostPreview;