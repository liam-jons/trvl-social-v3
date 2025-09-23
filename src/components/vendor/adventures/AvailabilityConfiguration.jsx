import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import GlassCard from '../../ui/GlassCard';
import AvailabilityCalendar from '../../adventure/AvailabilityCalendar';
const AVAILABILITY_TYPES = [
  { value: 'open', label: 'Open Booking', description: 'Available on most dates with advance notice' },
  { value: 'scheduled', label: 'Scheduled Dates', description: 'Specific predetermined dates only' },
  { value: 'on-demand', label: 'On Demand', description: 'Available upon request with flexible scheduling' }
];
const WEEKDAYS = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' }
];
const AvailabilityConfiguration = ({ data, onChange }) => {
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showBlackoutForm, setShowBlackoutForm] = useState(false);
  const availability = data.availability || {
    type: 'open',
    blackoutDates: [],
    schedules: [],
    weeklySchedule: {},
    advanceNotice: 24,
    minGroupSize: 2,
    maxBookingsPerDay: 1
  };
  const updateAvailability = (updates) => {
    onChange({
      availability: {
        ...availability,
        ...updates
      }
    });
  };
  const addScheduledDate = (scheduleData) => {
    const newSchedule = {
      id: Date.now(),
      date: scheduleData.date,
      startTime: scheduleData.startTime,
      endTime: scheduleData.endTime,
      maxParticipants: scheduleData.maxParticipants || data.groupSizeMax || 12,
      price: scheduleData.price || data.basePrice,
      notes: scheduleData.notes || ''
    };
    updateAvailability({
      schedules: [...(availability.schedules || []), newSchedule]
    });
    setShowScheduleForm(false);
  };
  const removeScheduledDate = (scheduleId) => {
    updateAvailability({
      schedules: (availability.schedules || []).filter(s => s.id !== scheduleId)
    });
  };
  const addBlackoutDate = (blackoutData) => {
    const newBlackout = {
      id: Date.now(),
      startDate: blackoutData.startDate,
      endDate: blackoutData.endDate || blackoutData.startDate,
      reason: blackoutData.reason || ''
    };
    updateAvailability({
      blackoutDates: [...(availability.blackoutDates || []), newBlackout]
    });
    setShowBlackoutForm(false);
  };
  const removeBlackoutDate = (blackoutId) => {
    updateAvailability({
      blackoutDates: (availability.blackoutDates || []).filter(b => b.id !== blackoutId)
    });
  };
  const updateWeeklySchedule = (dayOfWeek, isAvailable) => {
    updateAvailability({
      weeklySchedule: {
        ...availability.weeklySchedule,
        [dayOfWeek]: isAvailable
      }
    });
  };
  const ScheduleForm = ({ onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      date: '',
      startTime: '09:00',
      endTime: '17:00',
      maxParticipants: data.groupSizeMax || 12,
      price: data.basePrice || '',
      notes: ''
    });
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <GlassCard variant="light" padding="md" className="space-y-4">
          <h5 className="font-medium text-gray-900 dark:text-white">
            Add Scheduled Date
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Participants
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price (optional)
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || '' })}
                placeholder={`Default: ${data.basePrice || 0}`}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Special requirements, meeting point, etc."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(formData)}
              disabled={!formData.date}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Schedule
            </button>
          </div>
        </GlassCard>
      </motion.div>
    );
  };
  const BlackoutForm = ({ onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      startDate: '',
      endDate: '',
      reason: ''
    });
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <GlassCard variant="light" padding="md" className="space-y-4">
          <h5 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            Add Blackout Period
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                min={formData.startDate}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave empty for single day
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason (optional)
              </label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Holiday, maintenance, personal time..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(formData)}
              disabled={!formData.startDate}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Blackout
            </button>
          </div>
        </GlassCard>
      </motion.div>
    );
  };
  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Availability & Scheduling
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Configure how and when your adventure is available for booking.
        </p>
      </div>
      {/* Availability Type */}
      <GlassCard variant="light" padding="md">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">
          Booking Model
        </h4>
        <div className="space-y-3">
          {AVAILABILITY_TYPES.map((type) => (
            <div key={type.value}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="availabilityType"
                  value={type.value}
                  checked={availability.type === type.value}
                  onChange={(e) => updateAvailability({ type: e.target.value })}
                  className="mt-1 text-blue-500 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {type.label}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {type.description}
                  </div>
                </div>
              </label>
            </div>
          ))}
        </div>
      </GlassCard>
      {/* Booking Settings */}
      <GlassCard variant="light" padding="md">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ClockIcon className="h-5 w-5" />
          Booking Settings
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Advance Notice (hours)
            </label>
            <input
              type="number"
              min="1"
              value={availability.advanceNotice || 24}
              onChange={(e) => updateAvailability({ advanceNotice: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Min Group Size
            </label>
            <input
              type="number"
              min="1"
              value={availability.minGroupSize || data.groupSizeMin || 2}
              onChange={(e) => updateAvailability({ minGroupSize: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Max Bookings/Day
            </label>
            <input
              type="number"
              min="1"
              value={availability.maxBookingsPerDay || 1}
              onChange={(e) => updateAvailability({ maxBookingsPerDay: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </GlassCard>
      {/* Weekly Schedule (for open booking) */}
      {availability.type === 'open' && (
        <GlassCard variant="light" padding="md">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">
            Weekly Availability
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Select which days of the week you typically operate this adventure.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {WEEKDAYS.map((day) => (
              <label key={day.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={availability.weeklySchedule?.[day.value] !== false}
                  onChange={(e) => updateWeeklySchedule(day.value, e.target.checked)}
                  className="text-blue-500 focus:ring-blue-500 rounded"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {day.short}
                </span>
              </label>
            ))}
          </div>
        </GlassCard>
      )}
      {/* Scheduled Dates (for scheduled booking) */}
      {availability.type === 'scheduled' && (
        <GlassCard variant="light" padding="md">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Scheduled Dates
            </h4>
            <button
              onClick={() => setShowScheduleForm(true)}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Add Date
            </button>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {showScheduleForm && (
                <ScheduleForm
                  onSave={addScheduledDate}
                  onCancel={() => setShowScheduleForm(false)}
                />
              )}
            </AnimatePresence>
            {availability.schedules?.length > 0 ? (
              <div className="space-y-2">
                {availability.schedules.map((schedule) => (
                  <motion.div
                    key={schedule.id}
                    layout
                    className="flex items-center justify-between p-3 bg-white/30 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {new Date(schedule.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {schedule.startTime} - {schedule.endTime} •
                        Max {schedule.maxParticipants} participants •
                        {schedule.price ? ` $${schedule.price}` : ' Default price'}
                      </div>
                      {schedule.notes && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                          {schedule.notes}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeScheduledDate(schedule.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm italic text-center py-4">
                No scheduled dates configured. Add specific dates when this adventure is available.
              </p>
            )}
          </div>
        </GlassCard>
      )}
      {/* Blackout Dates */}
      <GlassCard variant="light" padding="md">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            Blackout Dates
          </h4>
          <button
            onClick={() => setShowBlackoutForm(true)}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Blackout
          </button>
        </div>
        <div className="space-y-3">
          <AnimatePresence>
            {showBlackoutForm && (
              <BlackoutForm
                onSave={addBlackoutDate}
                onCancel={() => setShowBlackoutForm(false)}
              />
            )}
          </AnimatePresence>
          {availability.blackoutDates?.length > 0 ? (
            <div className="space-y-2">
              {availability.blackoutDates.map((blackout) => (
                <motion.div
                  key={blackout.id}
                  layout
                  className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                >
                  <div className="flex-1">
                    <div className="font-medium text-red-900 dark:text-red-300">
                      {blackout.endDate && blackout.endDate !== blackout.startDate
                        ? `${new Date(blackout.startDate).toLocaleDateString()} - ${new Date(blackout.endDate).toLocaleDateString()}`
                        : new Date(blackout.startDate).toLocaleDateString()
                      }
                    </div>
                    {blackout.reason && (
                      <div className="text-sm text-red-700 dark:text-red-400">
                        {blackout.reason}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeBlackoutDate(blackout.id)}
                    className="p-1 text-red-400 hover:text-red-600 transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm italic text-center py-4">
              No blackout dates configured. Your adventure will be available according to your booking model.
            </p>
          )}
        </div>
      </GlassCard>
      {/* Calendar View */}
      <GlassCard variant="light" padding="md">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">
          Calendar Preview
        </h4>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <AvailabilityCalendar
            adventureId={data.id || 'preview'}
            availableDates={availability.schedules?.map(s => s.date) || []}
            blackoutDates={availability.blackoutDates?.map(b => ({
              start: b.startDate,
              end: b.endDate || b.startDate
            })) || []}
          />
        </div>
      </GlassCard>
    </div>
  );
};
export default AvailabilityConfiguration;