import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import GlassCard from '../../ui/GlassCard';
import { bulkOperationsService } from '../../../services/bulk-operations-service';

const CSVImportExport = ({ vendorId, onActionComplete }) => {
  const [activeTab, setActiveTab] = useState('export');
  const [isLoading, setIsLoading] = useState(false);
  const [exportType, setExportType] = useState('adventures');
  const [importType, setImportType] = useState('adventures');
  const [importFile, setImportFile] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [exportFilters, setExportFilters] = useState({
    status: [],
    dateRange: { start: '', end: '' }
  });

  const fileInputRef = useRef(null);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      let result;

      switch (exportType) {
        case 'adventures':
          result = await bulkOperationsService.exportAdventuresToCSV(vendorId, {
            isActive: exportFilters.status.length > 0 ? exportFilters.status.includes('published') : undefined
          });
          break;

        case 'bookings':
          result = await bulkOperationsService.exportBookingsToCSV(vendorId, {
            dateRange: exportFilters.dateRange.start && exportFilters.dateRange.end
              ? exportFilters.dateRange
              : undefined
          });
          break;

        default:
          throw new Error('Invalid export type');
      }

      if (result.error) {
        throw new Error(result.error);
      }

      // Create and download the file
      const blob = new Blob([result.data.csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Log the action
      await bulkOperationsService.logBulkAction(vendorId, {
        type: 'csv_export',
        targetType: exportType,
        targetCount: result.data.count,
        details: { exportType, filters: exportFilters },
        results: { exported: result.data.count }
      });

      onActionComplete?.();

    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      setImportFile(file);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    setIsLoading(true);
    try {
      const fileContent = await readFileContent(importFile);
      let result;

      switch (importType) {
        case 'adventures':
          result = await bulkOperationsService.importAdventuresFromCSV(
            vendorId,
            fileContent,
            { autoActivate: false }
          );
          break;

        default:
          throw new Error('Invalid import type');
      }

      setImportResults(result.data);
      setShowResults(true);

      // Log the action
      await bulkOperationsService.logBulkAction(vendorId, {
        type: 'csv_import',
        targetType: importType,
        targetCount: result.data?.total || 0,
        details: { importType, filename: importFile.name },
        results: result.data
      });

      onActionComplete?.();

    } catch (error) {
      console.error('Import failed:', error);
      setImportResults({
        successful: [],
        failed: [{ error: error.message }],
        total: 0
      });
      setShowResults(true);
    } finally {
      setIsLoading(false);
    }
  };

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };

  const downloadTemplate = (type) => {
    let headers, sampleRow, filename;

    switch (type) {
      case 'adventures':
        headers = [
          'title',
          'description',
          'location',
          'price_per_person',
          'duration_hours',
          'max_capacity',
          'category',
          'difficulty_level',
          'status'
        ];
        sampleRow = [
          'Sample Adventure',
          'A sample adventure description',
          'Sample Location',
          '100',
          '4',
          '10',
          'adventure',
          'beginner',
          'draft'
        ];
        filename = 'adventure_import_template.csv';
        break;

      default:
        return;
    }

    const csvContent = [
      headers.join(','),
      sampleRow.map(value => `"${value}"`).join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const renderExportTab = () => (
    <div className="space-y-6">
      {/* Export Type Selection */}
      <GlassCard variant="light" padding="md">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">
          Select Data to Export
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setExportType('adventures')}
            className={`
              p-4 rounded-lg border-2 transition-all duration-200 text-left
              ${exportType === 'adventures'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
              }
            `}
          >
            <DocumentArrowDownIcon className={`h-6 w-6 mb-2 ${exportType === 'adventures' ? 'text-blue-500' : 'text-gray-500'}`} />
            <div className={`font-medium ${exportType === 'adventures' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
              Adventures
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Export all adventure listings
            </div>
          </button>

          <button
            onClick={() => setExportType('bookings')}
            className={`
              p-4 rounded-lg border-2 transition-all duration-200 text-left
              ${exportType === 'bookings'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
              }
            `}
          >
            <DocumentArrowDownIcon className={`h-6 w-6 mb-2 ${exportType === 'bookings' ? 'text-blue-500' : 'text-gray-500'}`} />
            <div className={`font-medium ${exportType === 'bookings' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
              Bookings
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Export booking and customer data
            </div>
          </button>
        </div>
      </GlassCard>

      {/* Export Filters */}
      <GlassCard variant="light" padding="md">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">
          Export Filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exportType === 'adventures' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status Filter
              </label>
              <select
                multiple
                value={exportFilters.status}
                onChange={(e) => setExportFilters({
                  ...exportFilters,
                  status: Array.from(e.target.selectedOptions, option => option.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                size={3}
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          )}

          {exportType === 'bookings' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={exportFilters.dateRange.start}
                  onChange={(e) => setExportFilters({
                    ...exportFilters,
                    dateRange: { ...exportFilters.dateRange, start: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={exportFilters.dateRange.end}
                  onChange={(e) => setExportFilters({
                    ...exportFilters,
                    dateRange: { ...exportFilters.dateRange, end: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </>
          )}
        </div>
      </GlassCard>

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={handleExport}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Exporting...
            </>
          ) : (
            <>
              <DocumentArrowDownIcon className="h-5 w-5" />
              Export {exportType.charAt(0).toUpperCase() + exportType.slice(1)}
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderImportTab = () => (
    <div className="space-y-6">
      {/* Import Type Selection */}
      <GlassCard variant="light" padding="md">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">
          Select Data to Import
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setImportType('adventures')}
            className={`
              p-4 rounded-lg border-2 transition-all duration-200 text-left
              ${importType === 'adventures'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
              }
            `}
          >
            <DocumentArrowUpIcon className={`h-6 w-6 mb-2 ${importType === 'adventures' ? 'text-blue-500' : 'text-gray-500'}`} />
            <div className={`font-medium ${importType === 'adventures' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
              Adventures
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Import adventure listings from CSV
            </div>
          </button>

          <div className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 opacity-50">
            <DocumentArrowUpIcon className="h-6 w-6 mb-2 text-gray-400" />
            <div className="font-medium text-gray-400">
              Bookings
            </div>
            <div className="text-sm text-gray-400 mt-1">
              Coming soon...
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Template Download */}
      <GlassCard variant="info" padding="md">
        <div className="flex items-start gap-3">
          <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              CSV Format Requirements
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              Download the template below to ensure your CSV file has the correct format and headers.
            </p>
            <button
              onClick={() => downloadTemplate(importType)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              Download Template
            </button>
          </div>
        </div>
      </GlassCard>

      {/* File Upload */}
      <GlassCard variant="light" padding="md">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">
          Upload CSV File
        </h3>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
        >
          <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-600 dark:text-gray-400">
            {importFile ? (
              <>
                <div className="font-medium text-gray-900 dark:text-white">
                  {importFile.name}
                </div>
                <div className="text-sm mt-1">
                  {(importFile.size / 1024).toFixed(1)} KB
                </div>
              </>
            ) : (
              <>
                <div className="font-medium">
                  Click to upload CSV file
                </div>
                <div className="text-sm mt-1">
                  Or drag and drop your file here
                </div>
              </>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />
      </GlassCard>

      {/* Import Button */}
      {importFile && (
        <div className="flex justify-end">
          <button
            onClick={handleImport}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Importing...
              </>
            ) : (
              <>
                <DocumentArrowUpIcon className="h-5 w-5" />
                Import {importType.charAt(0).toUpperCase() + importType.slice(1)}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );

  const renderResults = () => {
    if (!importResults) return null;

    return (
      <GlassCard variant="light" padding="md" className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900 dark:text-white">
            Import Results
          </h3>
          <button
            onClick={() => setShowResults(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {importResults.successful?.length || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Successful</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {importResults.failed?.length || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {importResults.total || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
          </div>
        </div>

        {importResults.failed && importResults.failed.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">
              Failed Imports:
            </h4>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {importResults.failed.map((failure, index) => (
                <div key={index} className="text-sm text-red-600 dark:text-red-400">
                  Row {failure.row}: {failure.error}
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassCard>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'export', label: 'Export Data', icon: DocumentArrowDownIcon },
            { id: 'import', label: 'Import Data', icon: DocumentArrowUpIcon }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                  transition-colors duration-200
                  ${isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'export' ? renderExportTab() : renderImportTab()}
      </motion.div>

      {/* Results */}
      {showResults && renderResults()}
    </div>
  );
};

export default CSVImportExport;