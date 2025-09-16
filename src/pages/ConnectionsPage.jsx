/**
 * Connections Page
 * Main page for managing user connections and networking
 */

import React from 'react';
import ConnectionsDashboard from '../components/community/ConnectionsDashboard';

const ConnectionsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ConnectionsDashboard />
      </div>
    </div>
  );
};

export default ConnectionsPage;