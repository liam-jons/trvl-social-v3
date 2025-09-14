import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  TableCellsIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import GlassModal from '../ui/GlassModal';

const ExportModal = ({ isOpen, onClose, onExport, collectionName = 'All Items' }) => {
  const [selectedFormat, setSelectedFormat] = useState('json');
  const [isExporting, setIsExporting] = useState(false);

  const exportFormats = [
    {
      id: 'json',
      name: 'JSON',
      description: 'Machine-readable format for importing into other apps',
      icon: DocumentTextIcon,
      extension: '.json'
    },
    {
      id: 'csv',
      name: 'CSV (Spreadsheet)',
      description: 'Open in Excel, Google Sheets, or other spreadsheet apps',
      icon: TableCellsIcon,
      extension: '.csv'
    }
  ];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(selectedFormat);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <ArrowDownTrayIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Export Wishlist
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Collection Info */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="font-medium text-gray-900 dark:text-white mb-1">
            Exporting: {collectionName}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Your wishlist data will be downloaded to your device
          </p>
        </div>

        {/* Format Selection */}
        <div className="space-y-4 mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Choose Export Format
          </h3>

          <div className="space-y-2">
            {exportFormats.map((format) => (
              <label
                key={format.id}
                className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <input
                  type="radio"
                  name="exportFormat"
                  value={format.id}
                  checked={selectedFormat === format.id}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="mt-1 text-green-600 focus:ring-green-500"
                  disabled={isExporting}
                />
                <format.icon className="w-6 h-6 text-gray-600 dark:text-gray-300 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    {format.name}
                    <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                      {format.extension}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {format.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Export Info */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start gap-2">
            <DocumentArrowDownIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">What's included in the export:</p>
              <ul className="list-disc list-inside space-y-0.5 text-blue-700 dark:text-blue-300">
                <li>Adventure details (title, location, price, etc.)</li>
                <li>Date added to wishlist</li>
                <li>Collection information (if any)</li>
                <li>Adventure ratings and reviews</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="w-4 h-4" />
                Export {selectedFormat.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </GlassModal>
  );
};

export default ExportModal;