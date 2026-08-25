import React, { useState, useCallback, useRef, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { useDropzone } from 'react-dropzone';
import axios from "axios";
import { 
    Upload, 
    FileArchive, 
    X, 
    CheckCircle2, 
    AlertCircle, 
    Loader2,
    Database,
    FolderSync,
    Shield,
    Zap
} from "lucide-react";
import { t } from '@/i18n';

export default function UpdateV2() {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [status, setStatus] = useState('idle'); // idle, validating, uploading, processing, success, error
    const [logs, setLogs] = useState([]);
    const [error, setError] = useState(null);
    const logsEndRef = useRef(null);

    const addLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { message, type, timestamp }]);
    };

    const scrollToBottom = () => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [logs]);

    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles[0]?.name.endsWith('.zip')) {
            if (acceptedFiles[0].size > MAX_FILE_SIZE) {
                setError(`File too large. Maximum size is 50MB. Your file is ${(acceptedFiles[0].size / 1024 / 1024).toFixed(2)}MB`);
                addLog(`Error: File exceeds 50MB limit (${(acceptedFiles[0].size / 1024 / 1024).toFixed(2)}MB)`, 'error');
                return;
            }
            setFile(acceptedFiles[0]);
            setError(null);
            setLogs([]);
            setStatus('idle');
            addLog(`File selected: ${acceptedFiles[0].name} (${(acceptedFiles[0].size / 1024 / 1024).toFixed(2)}MB)`, 'success');
        } else {
            setError('Only ZIP files are allowed');
            addLog('Error: Only ZIP files are allowed', 'error');
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/zip': ['.zip'] },
        maxSize: MAX_FILE_SIZE,
        multiple: false,
        disabled: uploading,
        onDropRejected: (rejectedFiles) => {
            const file = rejectedFiles[0];
            if (file.errors[0]?.code === 'file-too-large') {
                setError(`File too large. Maximum size is 50MB. Your file is ${(file.file.size / 1024 / 1024).toFixed(2)}MB`);
                addLog(`Error: File rejected - exceeds 50MB limit (${(file.file.size / 1024 / 1024).toFixed(2)}MB)`, 'error');
            }
        }
    });

    const handleUpload = async (event) => {
        event.preventDefault();
        if (!file || uploading) return;

        setUploading(true);
        setStatus('validating');
        setError(null);
        setUploadProgress(0);
        setLogs([]);

        addLog('Preparing update package...', 'info');
        addLog('📋 Validating folder structure...', 'info');
        addLog('Required folders: app, routes, resources, config, database, lang', 'info');
        addLog('Optional folders: vendor, public (build folder will be replaced)', 'info');

        const formData = new FormData();
        formData.append('zip_file', file);

        try {
            setStatus('uploading');
            addLog('Uploading to server...', 'info');

            const response = await axios.post('/upload-v2', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 900000, // 15 minutes timeout for large file uploads
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(percentCompleted);

                    if (percentCompleted === 100) {
                        setStatus('processing');
                        addLog('Upload complete. Processing update...', 'success');
                    }
                },
            });

            // Success - show completion logs
            setStatus('success');
            addLog('✓ Update completed successfully!', 'success');

            if (response.data.migrations_output) {
                addLog('Migration Output:', 'info');
                const migrationLines = response.data.migrations_output.split('\n');
                migrationLines.forEach(line => {
                    if (line.trim()) {
                        addLog(line.trim(), 'info');
                    }
                });
            }

        } catch (error) {
            setStatus('error');
            const errorMsg = error.response?.data?.error || error.message || 'Update failed';
            setError(errorMsg);
            addLog(`✗ Error: ${errorMsg}`, 'error');

            if (error.response?.data?.details) {
                addLog('Error Details:', 'error');
                addLog(error.response.data.details, 'error');
            }
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setFile(null);
        setStatus('idle');
        setLogs([]);
        setError(null);
        setUploadProgress(0);
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-[var(--foreground)] leading-tight">
                    {t("System Update V2")}
                </h2>
            }
        >
            <Head title={t("Update V2")} />
            
            <div className="py-6 px-4 max-w-5xl mx-auto">
                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
                    <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
                        <div className="flex items-center gap-3">
                            <div className="bg-[var(--primary-soft)] p-2 rounded-lg">
                                <FolderSync className="w-5 h-5 text-[var(--info)]" />
                            </div>
                            <div>
                                <p className="text-xs text-[var(--muted-foreground)]">{t("Migration Based")}</p>
                                <p className="text-sm font-semibold text-[var(--foreground)]">{t("Auto Updates")}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
                        <div className="flex items-center gap-3">
                            <div className="bg-[var(--success-soft)] p-2 rounded-lg">
                                <Shield className="w-5 h-5 text-[var(--success)]" />
                            </div>
                            <div>
                                <p className="text-xs text-[var(--muted-foreground)]">{t("Auto Backup")}</p>
                                <p className="text-sm font-semibold text-[var(--foreground)]">{t("Safe Updates")}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-100 p-2 rounded-lg">
                                <Database className="w-5 h-5 text-[var(--primary)]" />
                            </div>
                            <div>
                                <p className="text-xs text-[var(--muted-foreground)]">{t("Smart Rollback")}</p>
                                <p className="text-sm font-semibold text-[var(--foreground)]">{t("Fail-Safe")}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-100 p-2 rounded-lg">
                                <Zap className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs text-[var(--muted-foreground)]">{t("Pre-flight Checks")}</p>
                                <p className="text-sm font-semibold text-[var(--foreground)]">{t("Validated")}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Upload Card */}
                <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6 mb-4">
                    <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">{t("Upload Update Package")}</h3>
                    
                    {/* Dropzone */}
                    <div
                        {...getRootProps()}
                        className={`
                            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
                            ${isDragActive ? 'border-blue-500 bg-[var(--primary-soft)]' : 'border-[var(--border)] hover:border-[var(--border)]'}
                            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
                            ${file ? 'bg-[var(--surface-2)]' : 'bg-[var(--card)]'}
                        `}
                    >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center gap-3">
                            {!file ? (
                                <>
                                    <div className="bg-[var(--surface-2)] p-4 rounded-full">
                                        <Upload className="w-8 h-8 text-[var(--muted-foreground)]" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-[var(--foreground)]">
                                            {isDragActive ? 'Drop the file here' : 'Drag & drop your update package'}
                                        </p>
                                        <p className="text-xs text-[var(--muted-foreground)] mt-1">
                                            {t("or click to browse (ZIP files only, max 50MB)")}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="bg-[var(--primary-soft)] p-4 rounded-full">
                                        <FileArchive className="w-8 h-8 text-[var(--info)]" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-[var(--foreground)]">{file.name}</p>
                                        <p className="text-xs text-[var(--muted-foreground)] mt-1">
                                            {(file.size / 1024 / 1024).toFixed(2)} {t("MB")}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mt-4 bg-[var(--destructive-soft)] border border-[var(--destructive)] rounded-lg p-3 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-[var(--destructive)] flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-[var(--destructive)]">{t("Update Failed")}</p>
                                <p className="text-xs text-[var(--destructive)] mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Progress Bar */}
                    {uploading && (
                        <div className="mt-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-semibold text-[var(--foreground)]">
                                    {status === 'validating' && 'Validating...'}
                                    {status === 'uploading' && `Uploading... ${uploadProgress}%`}
                                    {status === 'processing' && 'Processing update...'}
                                </span>
                                {status === 'processing' && (
                                    <Loader2 className="w-4 h-4 text-[var(--info)] animate-spin" />
                                )}
                            </div>
                            <div className="w-full bg-[var(--surface-2)] rounded-full h-2 overflow-hidden">
                                <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${status === 'processing' ? 100 : uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6">
                        {file && !uploading && (
                            <>
                                <button
                                    onClick={handleUpload}
                                    className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Upload className="w-4 h-4" />
                                    {t("Start Update")}
                                </button>
                                <button
                                    onClick={resetForm}
                                    className="px-4 py-2.5 border border-[var(--border)] text-[var(--foreground)] rounded-lg font-semibold text-sm hover:bg-[var(--surface-2)] transition-colors flex items-center justify-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    {t("Cancel")}
                                </button>
                            </>
                        )}
                        {status === 'success' && (
                            <button
                                onClick={resetForm}
                                className="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                {t("Upload Another Update")}
                            </button>
                        )}
                        {status === 'error' && (
                            <button
                                onClick={resetForm}
                                className="flex-1 bg-gray-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                            >
                                {t("Try Again")}
                            </button>
                        )}
                    </div>
                </div>

                {/* Logs Display */}
                {logs.length > 0 && (
                    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[var(--foreground)]">{t("Update Logs")}</h3>
                            <button
                                onClick={() => setLogs([])}
                                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-semibold"
                            >
                                {t("Clear Logs")}
                            </button>
                        </div>
                        
                        <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-xs">
                            {logs.map((log, index) => (
                                <div 
                                    key={index}
                                    className={`py-1 flex gap-3 ${
                                        log.type === 'error' ? 'text-red-400' :
                                        log.type === 'success' ? 'text-green-400' :
                                        log.type === 'warning' ? 'text-yellow-400' :
                                        'text-[var(--muted-foreground)]'
                                    }`}
                                >
                                    <span className="text-[var(--muted-foreground)]">[{log.timestamp}]</span>
                                    <span className="flex-1">{log.message}</span>
                                </div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                    </div>
                )}

                {/* Help Section */}
                <div className="bg-[var(--primary-soft)] border border-[var(--primary)] rounded-lg p-4 mt-4">
                    <h4 className="text-sm font-semibold text-[var(--info)] mb-2">{t("Before You Update")}</h4>
                    <ul className="text-xs text-[var(--info)] space-y-1">
                        <li>{t("• Ensure you have at least 100MB of free disk space")}</li>
                        <li>{t("• The system will automatically create a backup before updating")}</li>
                        <li>{t("• Maintenance mode will be enabled during the update process")}</li>
                        <li>{t("• If the update fails, the system will automatically rollback")}</li>
                        <li>{t("• Check the logs below for detailed progress information")}</li>
                    </ul>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
