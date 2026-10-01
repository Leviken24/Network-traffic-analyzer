import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { uploadFile } from '../api/client';
import { ArrowUpTrayIcon, DocumentTextIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [windowSeconds, setWindowSeconds] = useState(60);
  const [status, setStatus] = useState('READY'); // READY, PROCESSING, COMPLETED, FAILED
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles?.length > 0) {
      setFile(acceptedFiles[0]);
      setStatus('READY');
      setErrorMessage('');
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
    setStatus('PROCESSING');
    setErrorMessage('');
    
    try {
      const job = await uploadFile(file, windowSeconds);
      setStatus('COMPLETED');
      setTimeout(() => {
        navigate(`/jobs`);
      }, 800);
    } catch (err) {
      setStatus('FAILED');
      setErrorMessage(err.response?.data?.detail || err.message || 'Ingestion failed');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold text-[#0F3D56]">
          Upload Network Telemetry
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Ingest raw capture files to extract bidirectional flows and aggregate temporal state windows.
        </p>
      </div>

      <div className="card p-6 space-y-6">
        {/* Dropzone */}
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-[#0EA5A8] bg-[#F0FDFA]' 
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center">
            <ArrowUpTrayIcon className="w-8 h-8 text-slate-400 mb-2" />
            <p className="text-xs font-semibold text-[#0F3D56]">
              Click to select or drag and drop telemetry file
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Supported formats: CSV, PCAP, PCAPNG
            </p>
          </div>
        </div>

        {/* Selected File Details */}
        {file && (
          <div className="border border-slate-200 rounded-md p-4 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DocumentTextIcon className="w-7 h-7 text-[#0F3D56]" />
              <div>
                <div className="text-xs font-semibold text-slate-800">{file.name}</div>
                <div className="text-[11px] text-slate-500">Size: {formatFileSize(file.size)}</div>
              </div>
            </div>

            <div>
              {status === 'READY' && (
                <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
                  Ready
                </span>
              )}
              {status === 'PROCESSING' && (
                <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  Processing
                </span>
              )}
              {status === 'COMPLETED' && (
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded flex items-center gap-1">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                  Completed
                </span>
              )}
              {status === 'FAILED' && (
                <span className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded flex items-center gap-1">
                  <ExclamationCircleIcon className="w-3.5 h-3.5 text-rose-600" />
                  Failed
                </span>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Window Resolution Configuration */}
        <div className="border-t border-slate-100 pt-4 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="window-slider" className="font-medium text-slate-700">
              Aggregation Resolution
            </label>
            <span className="font-semibold text-[#0F3D56]">{windowSeconds} seconds</span>
          </div>
          <input
            id="window-slider"
            type="range"
            min="10"
            max="300"
            step="10"
            value={windowSeconds}
            onChange={(e) => setWindowSeconds(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0F3D56]"
          />
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>10s (High temporal sensitivity)</span>
            <span>60s (Standard)</span>
            <span>300s (Macro analysis)</span>
          </div>
        </div>

        {/* Submit Button */}
        <div>
          <button
            onClick={handleUpload}
            disabled={!file || status === 'PROCESSING'}
            className={`w-full py-2.5 px-4 rounded text-xs font-semibold transition-colors ${
              !file || status === 'PROCESSING'
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : 'bg-[#0F3D56] text-white hover:bg-[#164967]'
            }`}
          >
            {status === 'PROCESSING' ? 'Processing Telemetry...' : 'Process Telemetry Data'}
          </button>
        </div>
      </div>
    </div>
  );
}
