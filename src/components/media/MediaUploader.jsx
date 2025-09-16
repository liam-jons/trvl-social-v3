import { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { uploadMultipleFiles, validateFile, SUPPORTED_IMAGE_FORMATS, SUPPORTED_VIDEO_FORMATS, MAX_IMAGE_SIZE, MAX_VIDEO_SIZE } from '../../services/media-service';

const MediaUploader = ({
  onUploadComplete,
  onUploadProgress,
  onError,
  userId,
  maxFiles = 10,
  acceptImages = true,
  acceptVideos = true,
  className = '',
  disabled = false
}) => {
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Create accept object for dropzone
  const accept = {};
  if (acceptImages) {
    SUPPORTED_IMAGE_FORMATS.forEach(format => {
      accept[format] = [];
    });
  }
  if (acceptVideos) {
    SUPPORTED_VIDEO_FORMATS.forEach(format => {
      accept[format] = [];
    });
  }

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (disabled) return;

    // Handle rejected files
    rejectedFiles.forEach(({ file, errors }) => {
      errors.forEach(error => {
        onError?.(`${file.name}: ${error.message}`);
      });
    });

    // Validate accepted files
    const validFiles = [];
    const invalidFiles = [];

    acceptedFiles.forEach(file => {
      const isVideo = SUPPORTED_VIDEO_FORMATS.includes(file.type);
      const isImage = SUPPORTED_IMAGE_FORMATS.includes(file.type);

      let validationErrors = [];
      if (isVideo) {
        validationErrors = validateFile(file, 'video');
      } else if (isImage) {
        validationErrors = validateFile(file, 'image');
      } else {
        validationErrors = ['Unsupported file format'];
      }

      if (validationErrors.length === 0) {
        validFiles.push(file);
      } else {
        invalidFiles.push({ file, errors: validationErrors });
      }
    });

    // Report validation errors
    invalidFiles.forEach(({ file, errors }) => {
      errors.forEach(error => {
        onError?.(`${file.name}: ${error}`);
      });
    });

    // Check total files limit
    if (uploadQueue.length + validFiles.length > maxFiles) {
      onError?.(`Cannot upload more than ${maxFiles} files at once`);
      return;
    }

    // Add valid files to queue
    if (validFiles.length > 0) {
      const newQueueItems = validFiles.map(file => ({
        id: crypto.randomUUID(),
        file,
        status: 'pending',
        progress: 0,
        preview: URL.createObjectURL(file),
        type: SUPPORTED_VIDEO_FORMATS.includes(file.type) ? 'video' : 'image',
      }));

      setUploadQueue(prev => [...prev, ...newQueueItems]);
    }
  }, [uploadQueue.length, maxFiles, disabled, onError]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    disabled: disabled || isUploading,
    multiple: maxFiles > 1,
  });

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    onDrop(files, []);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFromQueue = (id) => {
    setUploadQueue(prev => {
      const updated = prev.filter(item => item.id !== id);
      // Cleanup preview URL
      const item = prev.find(item => item.id === id);
      if (item?.preview) {
        URL.revokeObjectURL(item.preview);
      }
      return updated;
    });
  };

  const clearQueue = () => {
    uploadQueue.forEach(item => {
      if (item.preview) {
        URL.revokeObjectURL(item.preview);
      }
    });
    setUploadQueue([]);
    setOverallProgress(0);
  };

  const startUpload = async () => {
    if (!userId || uploadQueue.length === 0) return;

    setIsUploading(true);
    setOverallProgress(0);

    try {
      const files = uploadQueue.map(item => item.file);

      const handleProgress = (progress) => {
        setOverallProgress(progress);
        onUploadProgress?.(progress);
      };

      const handleFileComplete = (result, completed, total) => {
        setUploadQueue(prev => prev.map(item => {
          if (item.file.name === result.file) {
            return {
              ...item,
              status: result.success ? 'completed' : 'error',
              progress: 100,
              result: result.success ? result.data : null,
              error: result.error || null,
            };
          }
          return item;
        }));
      };

      const results = await uploadMultipleFiles(
        files,
        userId,
        handleProgress,
        handleFileComplete
      );

      // Filter successful uploads
      const successfulUploads = results
        .filter(result => result.success)
        .map(result => result.data);

      if (successfulUploads.length > 0) {
        onUploadComplete?.(successfulUploads);
      }

      // Report any errors
      results.forEach(result => {
        if (!result.success) {
          onError?.(`${result.file}: ${result.error}`);
        }
      });

    } catch (error) {
      onError?.(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getMaxFileSize = (type) => {
    return type === 'video'
      ? formatFileSize(MAX_VIDEO_SIZE)
      : formatFileSize(MAX_IMAGE_SIZE);
  };

  const supportedFormats = [
    ...(acceptImages ? SUPPORTED_IMAGE_FORMATS : []),
    ...(acceptVideos ? SUPPORTED_VIDEO_FORMATS : []),
  ].map(format => format.split('/')[1].toUpperCase()).join(', ');

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Zone */}
      <GlassCard className="p-6">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
            ${isDragActive && !isDragReject
              ? 'border-blue-400 bg-blue-50/10 dark:bg-blue-900/10'
              : isDragReject
              ? 'border-red-400 bg-red-50/10 dark:bg-red-900/10'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50/5'
            }
            ${(disabled || isUploading) ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />

          <div className="space-y-4">
            {/* Upload Icon */}
            <div className="flex justify-center">
              <svg
                className="h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>

            {/* Upload Text */}
            <div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                {isDragActive
                  ? (isDragReject ? 'Invalid file format' : 'Drop files here')
                  : 'Drag and drop files here'
                }
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                or click to browse files
              </p>
            </div>

            {/* File Constraints */}
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p>Supported formats: {supportedFormats}</p>
              {acceptImages && (
                <p>Images: Max {getMaxFileSize('image')} each</p>
              )}
              {acceptVideos && (
                <p>Videos: Max {getMaxFileSize('video')} each</p>
              )}
              <p>Maximum {maxFiles} files at once</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* File Queue */}
      {uploadQueue.length > 0 && (
        <GlassCard className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-700 dark:text-gray-300">
                Files to Upload ({uploadQueue.length})
              </h3>
              <div className="flex gap-2">
                <GlassButton
                  onClick={clearQueue}
                  variant="secondary"
                  size="sm"
                  disabled={isUploading}
                >
                  Clear All
                </GlassButton>
                <GlassButton
                  onClick={startUpload}
                  disabled={isUploading || !userId}
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  {isUploading ? 'Uploading...' : 'Upload Files'}
                </GlassButton>
              </div>
            </div>

            {/* Overall Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Overall Progress</span>
                  <span className="text-gray-600 dark:text-gray-400">{Math.round(overallProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* File List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {uploadQueue.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-white/10 dark:bg-white/5 rounded-lg"
                >
                  {/* Preview */}
                  <div className="flex-shrink-0">
                    {item.type === 'image' ? (
                      <img
                        src={item.preview}
                        alt={item.file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded flex items-center justify-center">
                        <svg className="h-6 w-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {item.file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(item.file.size)} • {item.type}
                    </p>

                    {/* Individual Progress */}
                    {item.status === 'uploading' && (
                      <div className="mt-1">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                          <div
                            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Status Messages */}
                    {item.status === 'completed' && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Upload completed
                      </p>
                    )}
                    {item.status === 'error' && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {item.error || 'Upload failed'}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0">
                    {item.status === 'pending' && (
                      <button
                        onClick={() => removeFromQueue(item.id)}
                        disabled={isUploading}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    {item.status === 'completed' && (
                      <div className="p-1 text-green-500">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                    {item.status === 'error' && (
                      <div className="p-1 text-red-500">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Hidden file input for fallback */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={maxFiles > 1}
        accept={Object.keys(accept).join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default MediaUploader;