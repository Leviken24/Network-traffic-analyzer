import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { uploadFile } from '../api/client';
import { CloudArrowUpIcon, DocumentIcon, SparklesIcon } from '@heroicons/react/24/outline';

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
    <div className="max-w-3xl mx-auto mt-6 space-y-6 animate-fadeIn">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-purple-400 mb-2">
          Network Traffic Ingestion
        </h1>
        <p className="text-sm text-cyan-200/70">
          Upload PCAP, PCAPNG, or CIC-IDS2018 CSV telemetry to extract bidirectional flows and generate temporal network states.
        </p>
      </div>

      <div className="card p-8 border border-cyan-500/30">
        <div 
          {...getRootProps()} 
          className={`cursor-pointer border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
            isDragActive 
              ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_30px_rgba(0,245,255,0.2)]' 
              : 'border-cyan-500/30 bg-black/40 hover:border-cyan-400 hover:bg-black/60'
          }`}
        >
          <input {...getInputProps()} />
          
          {file ? (
            <div className="flex flex-col items-center">
              <DocumentIcon className="h-16 w-16 text-cyan-400 mb-3 animate-pulse" />
              <p className="text-lg font-mono font-bold text-cyan-100">{file.name}</p>
              <p className="text-xs text-gray-400 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB · Ready for ingestion</p>
              <span className="mt-3 text-xs text-cyan-300 underline">Click to choose a different file</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <CloudArrowUpIcon className="h-16 w-16 text-cyan-400/70 mb-3" />
              <p className="text-lg font-semibold text-gray-200 mb-1">Drag & drop your capture file here</p>
              <p className="text-xs text-gray-400">or click to browse (.pcap, .pcapng, .csv)</p>
              <div className="mt-4 flex gap-2 text-[11px] font-mono text-cyan-400/80">
                <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800">Raw PCAP</span>
                <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800">CIC-IDS2018 CSV</span>
                <span className="px-2 py-0.5 rounded bg-pink-950/60 border border-pink-800">Generic NetFlow CSV</span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-950/40 border border-red-500/50 text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="mt-8 space-y-6">
          <div className="bg-black/40 p-4 rounded-xl border border-gray-800">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="window" className="text-sm font-semibold text-cyan-200">
                Time Window Aggregation Resolution: <span className="text-cyan-400 font-bold">{windowSeconds} seconds</span>
              </label>
              <span className="text-xs text-gray-400">Controls temporal granularity</span>
            </div>
            <input
              id="window"
              type="range"
              min="10"
              max="300"
              step="10"
              value={windowSeconds}
              onChange={(e) => setWindowSeconds(Number(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>10s (High temporal sensitivity)</span>
              <span>60s (Recommended baseline)</span>
              <span>300s (Macro trends)</span>
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className={`w-full flex justify-center items-center py-3.5 px-4 rounded-xl font-bold text-base transition-all ${
              !file || isUploading 
                ? 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed' 
                : 'bg-gradient-to-r from-cyan-400 to-purple-500 text-black hover:opacity-90 shadow-[0_0_25px_rgba(0,245,255,0.4)]'
            }`}
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Ingesting & Extracting Features...
              </span>
            ) : (
              'Ingest Traffic & Generate Network States'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
