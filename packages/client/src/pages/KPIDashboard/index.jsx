import React, { useState } from 'react';
import { useOrganization } from '@contexts/OrganizationContext';
import KPIDashboard from './components/KPIDashboard';
import TrendsChart from './components/TrendsChart';
import ComparisonChart from './components/ComparisonChart';

const KPIPage = () => {
  const { activeOrganization } = useOrganization();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!activeOrganization) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600">No organization selected</p>
        </div>
      </div>
    );
  }

  const organizationId = activeOrganization.id;

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
    { id: 'trends', label: '📈 Trends', icon: '📈' },
    { id: 'comparison', label: '⚖️ Comparison', icon: '⚖️' }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payroll Analytics</h1>
              <p className="mt-2 text-gray-600">
                Monitor and analyze payroll metrics across dimensions
              </p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            <KPIDashboard organizationId={organizationId} />
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="animate-fade-in">
            <TrendsChart organizationId={organizationId} />
          </div>
        )}

        {activeTab === 'comparison' && (
          <div className="animate-fade-in">
            <ComparisonChart organizationId={organizationId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default KPIPage;
