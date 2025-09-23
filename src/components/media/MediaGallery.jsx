import { useState } from 'react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { deleteMedia } from '../../services/media-service';
const MediaGallery = ({
  mediaItems = [],
  onDelete,
  onReorder,
  onPreview,
  editable = true,
  maxHeight = '400px',
  className = ''
}) => {
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const handleSelectItem = (itemId, selected) => {
    const newSelected = new Set(selectedItems);
    if (selected) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };
  const handleSelectAll = () => {
    if (selectedItems.size === mediaItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(mediaItems.map(item => item.id)));
    }
  };
  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) return;
    setIsDeleting(true);
    const itemsToDelete = mediaItems.filter(item => selectedItems.has(item.id));
    try {
      // Delete files from storage
      for (const item of itemsToDelete) {
        await deleteMedia(item.filePath, item.thumbnailPath);
      }
      // Notify parent component
      onDelete?.(Array.from(selectedItems));
      // Clear selection
      setSelectedItems(new Set());
    } catch (error) {
      // You might want to show an error message to the user
    } finally {
      setIsDeleting(false);
    }
  };
  const handleDragStart = (e, index) => {
    if (!editable) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex || !editable) return;
    onReorder?.(draggedIndex, dropIndex);
    setDraggedIndex(null);
  };
  const handlePreview = (item) => {
    setPreviewItem(item);
    onPreview?.(item);
  };
  const formatFileSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  if (mediaItems.length === 0) {
    return (
      <GlassCard className={`p-8 text-center ${className}`}>
        <div className="space-y-3">
          <div className="flex justify-center">
            <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400">No media files uploaded yet</p>
        </div>
      </GlassCard>
    );
  }
  return (
    <div className={className}>
      {/* Gallery Header */}
      {editable && (
        <GlassCard className="p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedItems.size === mediaItems.length && mediaItems.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Select All ({selectedItems.size}/{mediaItems.length})
                </span>
              </label>
            </div>
            <div className="flex gap-2">
              {selectedItems.size > 0 && (
                <GlassButton
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  variant="secondary"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  {isDeleting ? 'Deleting...' : `Delete (${selectedItems.size})`}
                </GlassButton>
              )}
            </div>
          </div>
        </GlassCard>
      )}
      {/* Media Grid */}
      <GlassCard className="p-4">
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto"
          style={{ maxHeight }}
        >
          {mediaItems.map((item, index) => (
            <div
              key={item.id}
              draggable={editable}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={`
                relative group aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden
                ${editable ? 'cursor-move' : 'cursor-pointer'}
                ${selectedItems.has(item.id) ? 'ring-2 ring-blue-500' : ''}
                ${draggedIndex === index ? 'opacity-50' : ''}
                transition-all duration-200 hover:shadow-lg
              `}
            >
              {/* Media Content */}
              <div
                className="w-full h-full flex items-center justify-center"
                onClick={() => handlePreview(item)}
              >
                {item.type === 'image' ? (
                  <img
                    src={item.thumbnailUrl || item.url}
                    alt={item.fileName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="relative w-full h-full">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.fileName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <svg className="h-8 w-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}
                    {/* Video Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="bg-white/90 rounded-full p-2">
                        <svg className="h-4 w-4 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Overlay with Controls */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  {/* File Info */}
                  <div className="text-white text-xs space-y-1">
                    <p className="font-medium truncate">{item.fileName}</p>
                    <div className="flex justify-between items-center">
                      <span>{formatFileSize(item.fileSize)}</span>
                      <span>{formatDate(item.uploadedAt)}</span>
                    </div>
                  </div>
                </div>
                {/* Selection Checkbox */}
                {editable && (
                  <div className="absolute top-2 left-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectItem(item.id, e.target.checked);
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                  </div>
                )}
                {/* Action Buttons */}
                <div className="absolute top-2 right-2 flex gap-1">
                  {/* Preview Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(item);
                    }}
                    className="p-1 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors"
                    title="Preview"
                  >
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  {/* Download Button */}
                  <a
                    href={item.url}
                    download={item.fileName}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors"
                    title="Download"
                  >
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                  {/* Delete Button */}
                  {editable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectItem(item.id, true);
                        handleDeleteSelected();
                      }}
                      className="p-1 bg-red-500/70 hover:bg-red-500/90 rounded-full backdrop-blur-sm transition-colors"
                      title="Delete"
                    >
                      <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
      {/* Preview Modal */}
      {previewItem && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewItem(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setPreviewItem(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* Media Content */}
            <div className="relative max-w-full max-h-full">
              {previewItem.type === 'image' ? (
                <img
                  src={previewItem.url}
                  alt={previewItem.fileName}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <video
                  src={previewItem.url}
                  controls
                  className="max-w-full max-h-full object-contain"
                >
                  Your browser does not support the video tag.
                </video>
              )}
              {/* Media Info */}
              <div className="absolute bottom-4 left-4 bg-black/70 text-white p-3 rounded-lg backdrop-blur-sm">
                <p className="font-medium">{previewItem.fileName}</p>
                <p className="text-sm opacity-75">
                  {formatFileSize(previewItem.fileSize)} • {formatDate(previewItem.uploadedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default MediaGallery;