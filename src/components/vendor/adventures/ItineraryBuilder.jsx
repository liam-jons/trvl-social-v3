import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  XMarkIcon,
  ClockIcon,
  MapPinIcon,
  PhotoIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  DocumentDuplicateIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import GlassCard from '../../ui/GlassCard';

const ACTIVITY_TYPES = [
  { value: 'arrival', label: 'Arrival/Check-in', icon: '✈️' },
  { value: 'sightseeing', label: 'Sightseeing', icon: '👀' },
  { value: 'activity', label: 'Activity', icon: '🎯' },
  { value: 'meal', label: 'Meal/Dining', icon: '🍽️' },
  { value: 'accommodation', label: 'Accommodation', icon: '🏨' },
  { value: 'transport', label: 'Transportation', icon: '🚌' },
  { value: 'free-time', label: 'Free Time', icon: '⏰' },
  { value: 'departure', label: 'Departure', icon: '🏁' },
  { value: 'other', label: 'Other', icon: '📝' }
];

const ItineraryBuilder = ({ data, onChange }) => {
  const [expandedDays, setExpandedDays] = useState(new Set([0]));
  const fileInputRef = useRef(null);

  const itinerary = data.itinerary || [];

  const updateItinerary = (newItinerary) => {
    onChange({ itinerary: newItinerary });
  };

  const addDay = () => {
    const newDay = {
      day: itinerary.length + 1,
      title: `Day ${itinerary.length + 1}`,
      summary: '',
      activities: [],
      accommodation: '',
      meals: {
        breakfast: false,
        lunch: false,
        dinner: false
      }
    };

    updateItinerary([...itinerary, newDay]);
    setExpandedDays(prev => new Set([...prev, itinerary.length]));
  };

  const removeDay = (dayIndex) => {
    const updatedItinerary = itinerary.filter((_, index) => index !== dayIndex);
    // Renumber remaining days
    const renumberedItinerary = updatedItinerary.map((day, index) => ({
      ...day,
      day: index + 1,
      title: day.title.includes(`Day ${day.day}`) ? `Day ${index + 1}` : day.title
    }));

    updateItinerary(renumberedItinerary);
    setExpandedDays(prev => {
      const newSet = new Set();
      prev.forEach(dayIndex => {
        if (dayIndex < dayIndex) newSet.add(dayIndex);
        else if (dayIndex > dayIndex) newSet.add(dayIndex - 1);
      });
      return newSet;
    });
  };

  const updateDay = (dayIndex, updates) => {
    const updatedItinerary = itinerary.map((day, index) =>
      index === dayIndex ? { ...day, ...updates } : day
    );
    updateItinerary(updatedItinerary);
  };

  const duplicateDay = (dayIndex) => {
    const dayToCopy = itinerary[dayIndex];
    const duplicatedDay = {
      ...dayToCopy,
      day: itinerary.length + 1,
      title: `Day ${itinerary.length + 1} (Copy)`,
      activities: dayToCopy.activities.map(activity => ({
        ...activity,
        id: Date.now() + Math.random()
      }))
    };

    updateItinerary([...itinerary, duplicatedDay]);
  };

  const addActivity = (dayIndex) => {
    const newActivity = {
      id: Date.now(),
      type: 'activity',
      title: '',
      description: '',
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      notes: ''
    };

    const updatedDay = {
      ...itinerary[dayIndex],
      activities: [...(itinerary[dayIndex].activities || []), newActivity]
    };

    updateDay(dayIndex, updatedDay);
  };

  const updateActivity = (dayIndex, activityId, updates) => {
    const updatedActivities = itinerary[dayIndex].activities.map(activity =>
      activity.id === activityId ? { ...activity, ...updates } : activity
    );

    updateDay(dayIndex, { activities: updatedActivities });
  };

  const removeActivity = (dayIndex, activityId) => {
    const updatedActivities = itinerary[dayIndex].activities.filter(
      activity => activity.id !== activityId
    );

    updateDay(dayIndex, { activities: updatedActivities });
  };

  const moveActivity = (dayIndex, activityIndex, direction) => {
    const activities = [...itinerary[dayIndex].activities];
    const newIndex = direction === 'up' ? activityIndex - 1 : activityIndex + 1;

    if (newIndex >= 0 && newIndex < activities.length) {
      [activities[activityIndex], activities[newIndex]] = [activities[newIndex], activities[activityIndex]];
      updateDay(dayIndex, { activities });
    }
  };

  const toggleDayExpansion = (dayIndex) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dayIndex)) {
        newSet.delete(dayIndex);
      } else {
        newSet.add(dayIndex);
      }
      return newSet;
    });
  };

  const ActivityForm = ({ dayIndex, activity, onUpdate, onRemove }) => {
    const editor = useEditor({
      extensions: [StarterKit],
      content: activity.description || '',
      onUpdate: ({ editor }) => {
        onUpdate(activity.id, { description: editor.getHTML() });
      },
    });

    const activityTypeIcon = ACTIVITY_TYPES.find(type => type.value === activity.type)?.icon || '📝';

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-white/30 dark:bg-gray-800/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">{activityTypeIcon}</span>
            <input
              type="text"
              value={activity.title || ''}
              onChange={(e) => onUpdate(activity.id, { title: e.target.value })}
              placeholder="Activity title..."
              className="font-medium text-gray-900 dark:text-white bg-transparent border-none outline-none text-lg flex-1"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => moveActivity(dayIndex, itinerary[dayIndex].activities.findIndex(a => a.id === activity.id), 'up')}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Move up"
              >
                <ChevronUpIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => moveActivity(dayIndex, itinerary[dayIndex].activities.findIndex(a => a.id === activity.id), 'down')}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Move down"
              >
                <ChevronDownIcon className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => onRemove(activity.id)}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              title="Remove activity"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Activity Type
            </label>
            <select
              value={activity.type || 'activity'}
              onChange={(e) => onUpdate(activity.id, { type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
            >
              {ACTIVITY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={activity.startTime || ''}
                onChange={(e) => onUpdate(activity.id, { startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={activity.endTime || ''}
                onChange={(e) => onUpdate(activity.id, { endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
              <MapPinIcon className="h-4 w-4" />
              Location
            </label>
            <input
              type="text"
              value={activity.location || ''}
              onChange={(e) => onUpdate(activity.id, { location: e.target.value })}
              placeholder="Specific location or meeting point"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duration
            </label>
            <div className="text-sm text-gray-600 dark:text-gray-400 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              {activity.startTime && activity.endTime ? (
                `${Math.abs(
                  new Date(`2000-01-01T${activity.endTime}`) - new Date(`2000-01-01T${activity.startTime}`)
                ) / (1000 * 60)} minutes`
              ) : (
                'Set times to calculate duration'
              )}
            </div>
          </div>
        </div>

        {/* Description Editor */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <EditorContent
              editor={editor}
              className="prose dark:prose-invert max-w-none p-3 min-h-[80px] focus-within:bg-white/50 dark:focus-within:bg-gray-800/50 transition-colors text-sm"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Internal Notes
          </label>
          <textarea
            value={activity.notes || ''}
            onChange={(e) => onUpdate(activity.id, { notes: e.target.value })}
            placeholder="Private notes for planning (not visible to customers)"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-sm"
          />
        </div>
      </motion.div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Itinerary Builder
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create a detailed day-by-day itinerary for your adventure.
          </p>
        </div>

        <button
          onClick={addDay}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Add Day
        </button>
      </div>

      {itinerary.length === 0 ? (
        <GlassCard variant="light" padding="lg" className="text-center">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No itinerary created yet
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Start building your adventure itinerary by adding the first day.
          </p>
          <button
            onClick={addDay}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Create First Day
          </button>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {itinerary.map((day, dayIndex) => (
              <motion.div
                key={dayIndex}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <GlassCard variant="light" padding="none">
                  {/* Day Header */}
                  <div
                    className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer"
                    onClick={() => toggleDayExpansion(dayIndex)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                        {day.day}
                      </div>
                      <div>
                        <input
                          type="text"
                          value={day.title || ''}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateDay(dayIndex, { title: e.target.value });
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="text-lg font-semibold text-gray-900 dark:text-white bg-transparent border-none outline-none"
                          placeholder="Day title..."
                        />
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {day.activities?.length || 0} activities planned
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateDay(dayIndex);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Duplicate day"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDay(dayIndex);
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove day"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                      <div className={`transform transition-transform ${expandedDays.has(dayIndex) ? 'rotate-180' : ''}`}>
                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Day Content */}
                  <AnimatePresence>
                    {expandedDays.has(dayIndex) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 space-y-4">
                          {/* Day Summary */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Day Summary
                            </label>
                            <textarea
                              value={day.summary || ''}
                              onChange={(e) => updateDay(dayIndex, { summary: e.target.value })}
                              placeholder="Brief overview of what happens this day..."
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                            />
                          </div>

                          {/* Accommodation & Meals */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Accommodation
                              </label>
                              <input
                                type="text"
                                value={day.accommodation || ''}
                                onChange={(e) => updateDay(dayIndex, { accommodation: e.target.value })}
                                placeholder="Hotel, lodge, camping..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Meals Included
                              </label>
                              <div className="flex gap-4">
                                {['breakfast', 'lunch', 'dinner'].map((meal) => (
                                  <label key={meal} className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={day.meals?.[meal] || false}
                                      onChange={(e) => updateDay(dayIndex, {
                                        meals: {
                                          ...day.meals,
                                          [meal]: e.target.checked
                                        }
                                      })}
                                      className="text-blue-500 focus:ring-blue-500 rounded"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                                      {meal}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Activities */}
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                Activities
                              </h4>
                              <button
                                onClick={() => addActivity(dayIndex)}
                                className="flex items-center gap-1 px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                              >
                                <PlusIcon className="h-4 w-4" />
                                Add Activity
                              </button>
                            </div>

                            <div className="space-y-3">
                              <AnimatePresence>
                                {day.activities?.map((activity) => (
                                  <ActivityForm
                                    key={activity.id}
                                    dayIndex={dayIndex}
                                    activity={activity}
                                    onUpdate={updateActivity}
                                    onRemove={removeActivity}
                                  />
                                ))}
                              </AnimatePresence>

                              {(!day.activities || day.activities.length === 0) && (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                                  <ClockIcon className="mx-auto h-8 w-8 mb-2" />
                                  <p>No activities planned for this day</p>
                                  <button
                                    onClick={() => addActivity(dayIndex)}
                                    className="mt-2 text-blue-500 hover:text-blue-600 transition-colors"
                                  >
                                    Add your first activity
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default ItineraryBuilder;