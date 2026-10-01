import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { uploadFile } from '../api/client';
import { DocumentTextIcon, CheckCircleIcon, ExclamationCircleIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

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
      await uploadFile(file, windowSeconds);
      setStatus('COMPLETED');
      setTimeout(() => {
        navigate(`/jobs`);
      }, 800);
    } catch (err) {
      setStatus('FAILED');
      setErrorMessage(err.response?.data?.detail || err.message || 'Ingestion pipeline error');
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
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      {/* Title & Context */}
      <div className="border-b border-[rgba(255,255,255,0.08)] pb-4">
        <div className="text-[10px] font-mono tracking-wider text-[#C9A227] uppercase mb-1">
          Ingestion Subsystem
        </div>
        <h1 className="text-xl font-light text-[#F5F5F5] tracking-tight">
          Import Network Telemetry
        </h1>
        <p className="text-xs text-[#A1A1A1] mt-1">
          Stream raw packet captures (.pcap, .pcapng) or structured NetFlow logs (.csv) for temporal state vector extraction.
        </p>
      </div>

      <div className="glass-panel p-6 space-y-6">
        {/* Dropzone */}
        <div 
          {...getRootProps()} 
          className={`border border-dashed rounded p-10 text-center cursor-pointer transition-all ${
            isDragActive 
              ? 'border-[#C9A227] bg-[#C9A227]/5' 
              : 'border-[rgba(255,255,255,0.15)] hover:border-[#C9A227]/70 bg-[rgba(255,255,255,0.015)]'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center">
            <ArrowUpTrayIcon className="w-6 h-6 text-[#A1A1A1] mb-3 stroke-1" />
            <p className="text-xs font-medium text-[#F5F5F5]">
              Drop capture file here or click to browse
            </p>
            <p className="text-[11px] text-[#666666] font-mono mt-1">
              Supported protocols: CSV, PCAP, PCAPNG
            </p>
          </div>
        </div>

        {/* Selected File Details */}
        {file && (
          <div className="border border-[rgba(255,255,255,0.08)] rounded p-4 bg-[rgba(255,255,255,0.02)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DocumentTextIcon className="w-5 h-5 text-[#C9A227]" />
              <div>
                <div className="text-xs font-medium text-[#F5F5F5]">{file.name}</div>
                <div className="text-[11px] text-[#666666] font-mono">
                  {formatFileSize(file.size)} &bull; {file.name.split('.').pop()?.toUpperCase()}
                </div>
              </div>
            </div>

            <div>
              {status === 'READY' && (
                <span className="text-[11px] font-mono text-[#A1A1A1] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] px-2.5 py-1 rounded-sm">
                  Ready
                </span>
              )}
              {status === 'PROCESSING' && (
                <span className="text-[11px] font-mono text-[#C9A227] bg-[#C9A227]/10 border border-[#C9A227]/30 px-2.5 py-1 rounded-sm flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227]"></span>
                  Processing
                </span>
              )}
              {status === 'COMPLETED' && (
                <span className="text-[11px] font-mono text-[#4CAF7A] bg-[#4CAF7A]/10 border border-[#4CAF7A]/30 px-2.5 py-1 rounded-sm flex items-center gap-1">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  Completed
                </span>
              )}
              {status === 'FAILED' && (
                <span className="text-[11px] font-mono text-[#D64545] bg-[#D64545]/10 border border-[#D64545]/30 px-2.5 py-1 rounded-sm flex items-center gap-1">
                  <ExclamationCircleIcon className="w-3.5 h-3.5" />
                  Failed
                </span>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="p-3 bg-[#D64545]/10 border border-[#D64545]/30 rounded text-[#D64545] text-xs font-mono">
            {errorMessage}
          </div>
        )}

        {/* Window Resolution Configuration */}
        <div className="border-t border-[rgba(255,255,255,0.08)] pt-4 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="window-slider" className="text-[#A1A1A1] font-mono">
              Temporal Window Resolution
            </label>
            <span className="font-mono text-[#C9A227]">{windowSeconds}s</span>
          </div>
          <input
            id="window-slider"
            type="range"
            min="10"
            max="300"
            step="10"
            value={windowSeconds}
            onChange={(e) => setWindowSeconds(Number(e.target.value))}
            className="w-full h-1 bg-[rgba(255,255,255,0.1)] rounded appearance-none cursor-pointer accent-[#C9A227]"
          />
          <div className="flex justify-between text-[10px] text-[#666666] font-mono">
            <span>10s (High temporal sensitivity)</span>
            <span>60s (Standard aggregation)</span>
            <span>300s (Macro analysis)</span>
          </div>
        </div>

        {/* Ingestion Trigger Button */}
        <div>
          <button
            onClick={handleUpload}
            disabled={!file || status === 'PROCESSING'}
            className={`w-full py-2.5 px-4 rounded-sm text-xs font-medium tracking-wide transition-all ${
              !file || status === 'PROCESSING'
                ? 'bg-[rgba(255,255,255,0.02)] text-[#666666] border border-[rgba(255,255,255,0.06)] cursor-not-allowed'
                : 'bg-[#121212] border border-[#C9A227] text-[#F5F5F5] hover:bg-[#C9A227]/15 hover:border-[#E0B83F]'
            }`}
          >
            {status === 'PROCESSING' ? 'Executing Pipeline...' : 'Process Telemetry Data'}
          </button>
        </div>
      </div>
    </div>
  );
}
