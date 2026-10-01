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
      <div className="border-b border-[#242943] pb-4">
        <div className="text-[10px] font-mono tracking-wider text-[#6366F1] uppercase mb-1">
          Ingestion Subsystem
        </div>
        <h1 className="text-xl font-light text-[#F8FAFC] tracking-tight">
          Import Network Telemetry
        </h1>
        <p className="text-xs text-[#A1A1AA] mt-1">
          Stream raw packet captures (.pcap, .pcapng) or structured NetFlow logs (.csv) for temporal state vector extraction.
        </p>
      </div>

      <div className="glass-panel p-6 space-y-6">
        {/* Dropzone */}
        <div 
          {...getRootProps()} 
          className={`border border-dashed rounded p-10 text-center cursor-pointer transition-all ${
            isDragActive 
              ? 'border-[#6366F1] bg-[#6366F1]/5' 
              : 'border-[#242943] hover:border-[#818CF8]/70 bg-[#0B0D16]'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center">
            <ArrowUpTrayIcon className="w-6 h-6 text-[#A1A1AA] mb-3 stroke-1" />
            <p className="text-xs font-medium text-[#F8FAFC]">
              Drop capture file here or click to browse
            </p>
            <p className="text-[11px] text-[#71717A] font-mono mt-1">
              Supported protocols: CSV, PCAP, PCAPNG
            </p>
          </div>
        </div>

        {/* Selected File Details */}
        {file && (
          <div className="border border-[#242943] rounded p-4 bg-[#0B0D16] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DocumentTextIcon className="w-5 h-5 text-[#6366F1]" />
              <div>
                <div className="text-xs font-medium text-[#F8FAFC]">{file.name}</div>
                <div className="text-[11px] text-[#71717A] font-mono">
                  {formatFileSize(file.size)} &bull; {file.name.split('.').pop()?.toUpperCase()}
                </div>
              </div>
            </div>

            <div>
              {status === 'READY' && (
                <span className="text-[11px] font-mono text-[#A1A1AA] bg-[#14182A] border border-[#242943] px-2.5 py-1 rounded-sm">
                  Ready
                </span>
              )}
              {status === 'PROCESSING' && (
                <span className="text-[11px] font-mono text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/30 px-2.5 py-1 rounded-sm flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span>
                  Processing
                </span>
              )}
              {status === 'COMPLETED' && (
                <span className="text-[11px] font-mono text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/30 px-2.5 py-1 rounded-sm flex items-center gap-1">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  Completed
                </span>
              )}
              {status === 'FAILED' && (
                <span className="text-[11px] font-mono text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/30 px-2.5 py-1 rounded-sm flex items-center gap-1">
                  <ExclamationCircleIcon className="w-3.5 h-3.5" />
                  Failed
                </span>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded text-[#EF4444] text-xs font-mono">
            {errorMessage}
          </div>
        )}

        {/* Window Resolution Configuration */}
        <div className="border-t border-[#242943] pt-4 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="window-slider" className="text-[#A1A1AA] font-mono">
              Temporal Window Resolution
            </label>
            <span className="font-mono text-[#818CF8]">{windowSeconds}s</span>
          </div>
          <input
            id="window-slider"
            type="range"
            min="10"
            max="300"
            step="10"
            value={windowSeconds}
            onChange={(e) => setWindowSeconds(Number(e.target.value))}
            className="w-full h-1 bg-[#242943] rounded appearance-none cursor-pointer accent-[#6366F1]"
          />
          <div className="flex justify-between text-[10px] text-[#71717A] font-mono">
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
                ? 'bg-[#14182A]/50 text-[#71717A] border border-[#242943] cursor-not-allowed'
                : 'bg-[#6366F1] border border-[#6366F1] text-white hover:bg-[#818CF8] hover:border-[#818CF8]'
            }`}
          >
            {status === 'PROCESSING' ? 'Executing Pipeline...' : 'Process Telemetry Data'}
          </button>
        </div>
      </div>
    </div>
  );
}
