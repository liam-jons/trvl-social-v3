import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BellIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { format, addDays, isAfter, isBefore } from 'date-fns';
import useVideoStreamStore from '../../stores/videoStreamStore';
import notificationService from '../../services/notification-service';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';

const StreamScheduler = ({ vendorId, className = "" }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingStream, setEditingStream] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledDate: '',
    scheduledTime: '',
    duration: 60, // minutes
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notifyBefore: 30, // minutes
    tags: [],
    maxViewers: 100,
    enableRecording: true,
    enableChat: true
  });

  const {
    scheduledStreams,
    addScheduledStream,
    removeScheduledStream,
    updateScheduledStream,
    isLoading
  } = useVideoStreamStore();

  // Filter streams for current vendor
  const vendorStreams = scheduledStreams.filter(stream => stream.vendorId === vendorId);

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      scheduledDate: '',
      scheduledTime: '',
      duration: 60,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      notifyBefore: 30,
      tags: [],
      maxViewers: 100,
      enableRecording: true,
      enableChat: true
    });
    setEditingStream(null);
    setShowCreateForm(false);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);

      if (isBefore(scheduledDateTime, new Date())) {
        alert('Cannot schedule stream in the past');
        return;
      }

      const streamData = {
        ...formData,
        vendorId,
        scheduledDateTime: scheduledDateTime.toISOString(),
        createdAt: new Date().toISOString()
      };

      if (editingStream) {
        updateScheduledStream(editingStream.id, streamData);
      } else {
        addScheduledStream(streamData);

        // Schedule notification
        if (formData.notifyBefore > 0) {
          const notifyTime = new Date(scheduledDateTime.getTime() - (formData.notifyBefore * 60 * 1000));

          await notificationService.scheduleNotification({
            title: 'Upcoming Stream',
            message: `"${formData.title}" starts in ${formData.notifyBefore} minutes`,
            scheduledTime: notifyTime.toISOString(),
            type: 'stream_reminder'
          });
        }
      }

      resetForm();
    } catch (error) {
      console.error('Failed to schedule stream:', error);
      alert('Failed to schedule stream. Please try again.');
    }
  };

  // Handle edit stream
  const handleEditStream = (stream) => {
    const scheduledDate = new Date(stream.scheduledDateTime);

    setFormData({
      title: stream.title,
      description: stream.description || '',
      scheduledDate: format(scheduledDate, 'yyyy-MM-dd'),
      scheduledTime: format(scheduledDate, 'HH:mm'),
      duration: stream.duration || 60,
      timezone: stream.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      notifyBefore: stream.notifyBefore || 30,
      tags: stream.tags || [],
      maxViewers: stream.maxViewers || 100,
      enableRecording: stream.enableRecording !== false,
      enableChat: stream.enableChat !== false
    });

    setEditingStream(stream);
    setShowCreateForm(true);
  };

  // Handle delete stream
  const handleDeleteStream = (streamId) => {
    if (window.confirm('Are you sure you want to delete this scheduled stream?')) {
      removeScheduledStream(streamId);
    }
  };

  // Get stream status
  const getStreamStatus = (stream) => {
    const scheduledTime = new Date(stream.scheduledDateTime);
    const now = new Date();
    const endTime = new Date(scheduledTime.getTime() + (stream.duration * 60 * 1000));

    if (isBefore(now, scheduledTime)) {
      return 'scheduled';
    } else if (isAfter(now, scheduledTime) && isBefore(now, endTime)) {
      return 'live';
    } else {
      return 'ended';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'text-blue-500';
      case 'live': return 'text-red-500';
      case 'ended': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Stream Scheduler</h2>
        <GlassButton
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Schedule Stream</span>
        </GlassButton>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold mb-4">
              {editingStream ? 'Edit Scheduled Stream' : 'Schedule New Stream'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Stream Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter stream title..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your stream content..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Duration (minutes)
                  </label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                    <option value={180}>3 hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Notify Before (minutes)
                  </label>
                  <select
                    value={formData.notifyBefore}
                    onChange={(e) => setFormData(prev => ({ ...prev, notifyBefore: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>No notification</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                    <option value={1440}>1 day</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.enableRecording}
                    onChange={(e) => setFormData(prev => ({ ...prev, enableRecording: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Enable Recording</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.enableChat}
                    onChange={(e) => setFormData(prev => ({ ...prev, enableChat: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Enable Chat</span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <GlassButton
                  type="button"
                  variant="secondary"
                  onClick={resetForm}
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  type="submit"
                  disabled={isLoading}
                >
                  {editingStream ? 'Update Stream' : 'Schedule Stream'}
                </GlassButton>
              </div>
            </form>
          </GlassCard>
        </motion.div>
      )}

      {/* Scheduled Streams List */}
      <div className="space-y-4">
        {vendorStreams.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
              No Scheduled Streams
            </h3>
            <p className="text-gray-500 mb-4">
              Schedule your first stream to start building your audience
            </p>
            <GlassButton onClick={() => setShowCreateForm(true)}>
              Schedule Stream
            </GlassButton>
          </GlassCard>
        ) : (
          vendorStreams.map((stream) => {
            const status = getStreamStatus(stream);
            const scheduledDate = new Date(stream.scheduledDateTime);

            return (
              <motion.div
                key={stream.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GlassCard className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold">{stream.title}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)} bg-current bg-opacity-10`}>
                          {status.toUpperCase()}
                        </span>
                      </div>

                      {stream.description && (
                        <p className="text-gray-600 dark:text-gray-300 mb-3">
                          {stream.description}
                        </p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="h-4 w-4 text-gray-500" />
                          <span>{format(scheduledDate, 'MMM dd, yyyy')}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <ClockIcon className="h-4 w-4 text-gray-500" />
                          <span>{format(scheduledDate, 'HH:mm')}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <GlobeAltIcon className="h-4 w-4 text-gray-500" />
                          <span>{stream.duration} min</span>
                        </div>
                      </div>

                      {stream.notifyBefore > 0 && (
                        <div className="flex items-center space-x-2 mt-2 text-sm text-gray-500">
                          <BellIcon className="h-4 w-4" />
                          <span>Notify {stream.notifyBefore} minutes before</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEditStream(stream)}
                        className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
                        disabled={status === 'live' || status === 'ended'}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteStream(stream.id)}
                        className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                        disabled={status === 'live'}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StreamScheduler;