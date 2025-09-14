import { useState } from 'react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isBefore, startOfToday } from 'date-fns';
import GlassCard from '../ui/GlassCard';

const AvailabilityCalendar = ({ adventure }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  if (!adventure || !adventure.availability) {
    return null;
  }

  const { availability } = adventure;
  const today = startOfToday();

  // Parse availability dates
  const availableDates = availability.available?.map(date => parseISO(date)) || [];
  const bookedDates = availability.booked?.map(date => parseISO(date)) || [];
  const limitedDates = availability.limited?.map(date => parseISO(date)) || [];

  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });

  // Get the start of the week for the first day of the month
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  // Get all days to display (including previous/next month days)
  const endDate = new Date(lastDayOfMonth);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const allDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getDateStatus = (date) => {
    if (isBefore(date, today)) return 'past';
    if (availableDates.some(d => isSameDay(d, date))) return 'available';
    if (bookedDates.some(d => isSameDay(d, date))) return 'booked';
    if (limitedDates.some(d => isSameDay(d, date))) return 'limited';
    return 'unavailable';
  };

  const getDateClasses = (date, status) => {
    const isCurrentMonth = isSameMonth(date, currentMonth);
    const isSelected = selectedDate && isSameDay(date, selectedDate);
    const isToday = isSameDay(date, today);

    let classes = 'w-full h-12 text-sm font-medium rounded-lg transition-all duration-200 ';

    if (!isCurrentMonth) {
      classes += 'text-gray-400 dark:text-gray-600 ';
    }

    if (isSelected) {
      classes += 'ring-2 ring-primary-500 ';
    }

    if (isToday) {
      classes += 'ring-2 ring-blue-400 ';
    }

    switch (status) {
      case 'available':
        classes += isCurrentMonth
          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 cursor-pointer '
          : 'bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 ';
        break;
      case 'limited':
        classes += isCurrentMonth
          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50 cursor-pointer '
          : 'bg-orange-50 dark:bg-orange-900/10 text-orange-600 dark:text-orange-400 ';
        break;
      case 'booked':
        classes += isCurrentMonth
          ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 cursor-not-allowed '
          : 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 cursor-not-allowed ';
        break;
      case 'past':
        classes += 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed ';
        break;
      default:
        classes += isCurrentMonth
          ? 'bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 cursor-not-allowed '
          : 'bg-gray-25 dark:bg-gray-800/25 text-gray-400 dark:text-gray-600 cursor-not-allowed ';
    }

    return classes;
  };

  const handleDateClick = (date, status) => {
    if (status === 'available' || status === 'limited') {
      setSelectedDate(date);
    }
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => direction > 0 ? addMonths(prev, 1) : subMonths(prev, 1));
  };

  // Count available dates in current month
  const availableInMonth = daysInMonth.filter(date => {
    const status = getDateStatus(date);
    return status === 'available' || status === 'limited';
  }).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <GlassCard variant="light">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Availability Calendar
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {availableInMonth} dates available in {format(currentMonth, 'MMMM yyyy')}
              </p>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white min-w-[140px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>

              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-200 dark:bg-green-700 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-200 dark:bg-orange-700 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Limited</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-200 dark:bg-red-700 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Unavailable</span>
            </div>
          </div>

          {/* Calendar */}
          <div className="space-y-2">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {allDays.map((date, index) => {
                const status = getDateStatus(date);
                return (
                  <motion.button
                    key={date.toISOString()}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.01 }}
                    onClick={() => handleDateClick(date, status)}
                    disabled={status === 'booked' || status === 'past' || status === 'unavailable'}
                    className={getDateClasses(date, status)}
                    title={`${format(date, 'MMMM d, yyyy')} - ${status}`}
                  >
                    {format(date, 'd')}
                    {status === 'limited' && (
                      <div className="absolute inset-x-0 bottom-1 flex justify-center">
                        <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Info */}
          {selectedDate && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800"
            >
              <h4 className="font-semibold text-primary-900 dark:text-primary-100 mb-2">
                Selected Date: {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h4>
              <div className="flex items-center justify-between">
                <div className="text-sm text-primary-700 dark:text-primary-300">
                  {getDateStatus(selectedDate) === 'limited' ? 'Limited availability - book soon!' : 'Available for booking'}
                </div>
                <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
                  Book This Date
                </button>
              </div>
            </motion.div>
          )}

          {/* Booking Info */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="mb-2">
                <strong>Booking Information:</strong>
              </p>
              <ul className="space-y-1 text-xs">
                <li>• Tours depart at 8:00 AM local time</li>
                <li>• Minimum 2 people required for booking</li>
                <li>• Free cancellation up to 48 hours before departure</li>
                <li>• Weather-dependent activities may be rescheduled</li>
              </ul>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default AvailabilityCalendar;