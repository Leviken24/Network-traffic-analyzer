import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { uploadFile } from '../api/client';
import { CloudArrowUpIcon, DocumentIcon } from '@heroicons/react/24/outline';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [windowSeconds, setWindowSeconds] = useState(60);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles?.length > 0) {
      setFile(acceptedFiles[0]);
      setError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.tcpdump.pcap': ['.pcap'],
      'application/x-pcapng': ['.pcapng'],
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError('');
    
    try {
      const job = await uploadFile(file, windowSeconds);
      navigate(`/jobs`);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Upload failed');
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Network Traffic Analyzer</h1>
        <p className="text-lg text-gray-600">
          Upload your PCAP or CSV files to extract features and generate a stateful timeline.
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-brand-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          
          {file ? (
            <div className="flex flex-col items-center">
              <DocumentIcon className="h-16 w-16 text-brand-500 mb-4" />
              <p className="text-lg font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <CloudArrowUpIcon className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-1">Drag & drop your file here</p>
              <p className="text-sm text-gray-500">or click to select a file (.pcap, .pcapng, .csv)</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="mt-8 space-y-6">
          <div>
            <label htmlFor="window" className="block text-sm font-medium text-gray-700 mb-2">
              Time Window Resolution: {windowSeconds} seconds
            </label>
            <input
              id="window"
              type="range"
              min="10"
              max="300"
              step="10"
              value={windowSeconds}
              onChange={(e) => setWindowSeconds(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>10s (High detail)</span>
              <span>300s (Low detail)</span>
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white ${
              !file || isUploading 
                ? 'bg-brand-300 cursor-not-allowed' 
                : 'bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500'
            }`}
          >
            {isUploading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading & Processing...
              </span>
            ) : (
              'Process Traffic Data'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
