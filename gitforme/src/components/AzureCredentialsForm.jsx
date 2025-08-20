import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EyeIcon = ({ show }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {show ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </>
    )}
  </svg>
);

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 16v-4"/>
    <path d="M12 8h.01"/>
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const AzureCredentialsForm = ({ onCredentialsChange, initialCredentials = null }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [credentials, setCredentials] = useState({
    azureEndpoint: initialCredentials?.azureEndpoint || '',
    apiKey: initialCredentials?.apiKey || '',
    deployment: initialCredentials?.deployment || '',
    apiVersion: initialCredentials?.apiVersion || '2023-05-15'
  });
  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'azureEndpoint':
        if (value && !value.match(/^https:\/\/.+\.openai\.azure\.com$/)) {
          newErrors.azureEndpoint = 'Please enter a valid Azure OpenAI endpoint (https://your-resource.openai.azure.com)';
        } else {
          delete newErrors.azureEndpoint;
        }
        break;
      case 'apiKey':
        if (value && value.length < 10) {
          newErrors.apiKey = 'API key seems too short';
        } else {
          delete newErrors.apiKey;
        }
        break;
      case 'deployment':
        if (value && value.length < 2) {
          newErrors.deployment = 'Deployment name is required';
        } else {
          delete newErrors.deployment;
        }
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
  };

  const handleInputChange = (field, value) => {
    const newCredentials = { ...credentials, [field]: value };
    setCredentials(newCredentials);
    validateField(field, value);
    
    // Only pass complete credentials to parent component
    if (newCredentials.azureEndpoint && newCredentials.apiKey && newCredentials.deployment) {
      onCredentialsChange(newCredentials);
    } else {
      onCredentialsChange(null);
    }
  };

  const clearCredentials = () => {
    const emptyCredentials = {
      azureEndpoint: '',
      apiKey: '',
      deployment: '',
      apiVersion: '2023-05-15'
    };
    setCredentials(emptyCredentials);
    setErrors({});
    onCredentialsChange(null);
  };

  const isComplete = credentials.azureEndpoint && credentials.apiKey && credentials.deployment;
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="border-2 border-black rounded-lg overflow-hidden shadow-[2px_2px_0px_rgba(0,0,0,1)] bg-white">
      {/* Header */}
      <div 
        className="p-3 bg-amber-50 border-b-2 border-black cursor-pointer hover:bg-amber-100 transition-colors flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <SettingsIcon />
          <span className="font-semibold text-sm">Azure OpenAI Settings</span>
          {isComplete && !hasErrors && (
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          )}
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </div>

      {/* Form Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Trust Statement */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <div className="flex items-start gap-2">
                  <InfoIcon />
                  <div>
                    <p className="font-semibold text-blue-800 mb-1">🔒 Privacy & Security</p>
                    <p className="text-blue-700">Your credentials are used only for this session and are never stored, logged, or shared. They are transmitted securely over HTTPS and discarded immediately after use.</p>
                  </div>
                </div>
              </div>

              {/* Azure Endpoint */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Azure Endpoint <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={credentials.azureEndpoint}
                  onChange={(e) => handleInputChange('azureEndpoint', e.target.value)}
                  placeholder="https://your-resource.openai.azure.com"
                  className={`w-full px-3 py-2 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.azureEndpoint ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.azureEndpoint && (
                  <p className="text-red-600 text-xs mt-1">{errors.azureEndpoint}</p>
                )}
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  API Key <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={credentials.apiKey}
                    onChange={(e) => handleInputChange('apiKey', e.target.value)}
                    placeholder="Enter your Azure OpenAI API key"
                    className={`w-full px-3 py-2 pr-10 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.apiKey ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    <EyeIcon show={showApiKey} />
                  </button>
                </div>
                {errors.apiKey && (
                  <p className="text-red-600 text-xs mt-1">{errors.apiKey}</p>
                )}
              </div>

              {/* Deployment */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Deployment Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={credentials.deployment}
                  onChange={(e) => handleInputChange('deployment', e.target.value)}
                  placeholder="your-deployment-name"
                  className={`w-full px-3 py-2 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.deployment ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.deployment && (
                  <p className="text-red-600 text-xs mt-1">{errors.deployment}</p>
                )}
              </div>

              {/* API Version */}
              <div>
                <label className="block text-sm font-semibold mb-2">API Version</label>
                <select
                  value={credentials.apiVersion}
                  onChange={(e) => handleInputChange('apiVersion', e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="2023-05-15">2023-05-15</option>
                  <option value="2023-06-01-preview">2023-06-01-preview</option>
                  <option value="2023-07-01-preview">2023-07-01-preview</option>
                  <option value="2023-08-01-preview">2023-08-01-preview</option>
                  <option value="2023-09-01-preview">2023-09-01-preview</option>
                  <option value="2023-12-01-preview">2023-12-01-preview</option>
                  <option value="2024-02-15-preview">2024-02-15-preview</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={clearCredentials}
                  className="px-3 py-2 text-sm bg-gray-100 border-2 border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear
                </button>
                <div className="flex-1">
                  {isComplete && !hasErrors && (
                    <div className="text-sm text-green-600 font-semibold flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Ready to use
                    </div>
                  )}
                </div>
              </div>

              {/* Help Text */}
              <div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
                <p><strong>Need help finding these values?</strong></p>
                <p>Visit your Azure OpenAI resource in the Azure portal. Your endpoint and keys are in the "Keys and Endpoint" section.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AzureCredentialsForm;
