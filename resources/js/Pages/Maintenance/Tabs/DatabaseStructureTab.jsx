import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    Database,
    RefreshCw,
    Download,
    Play,
    Loader2,
    AlertCircle,
    CheckCircle2,
    BarChart3,
    ChevronDown,
    ChevronRight
} from "lucide-react";
import { t } from '@/i18n';

export default function DatabaseStructureTab() {
    const [tables, setTables] = useState([]);
    const [migrations, setMigrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [executing, setExecuting] = useState(false);
    const [activeAction, setActiveAction] = useState(null);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [expandedTables, setExpandedTables] = useState({});

    useEffect(() => {
        fetchDatabaseInfo();
    }, []);

    const toggleTableExpand = (tableName) => {
        setExpandedTables(prev => ({
            ...prev,
            [tableName]: !prev[tableName]
        }));
    };

    const fetchDatabaseInfo = async () => {
        setLoading(true);
        setError(null);
        try {
            const [tablesRes, migrationsRes] = await Promise.all([
                axios.get('/api/maintenance/database/tables').catch(err => {
                    console.error('Tables error:', err);
                    return { data: { tables: [] } };
                }),
                axios.get('/api/maintenance/database/migrations').catch(err => {
                    console.error('Migrations error:', err);
                    return { data: { migrations: [] } };
                })
            ]);

            setTables(tablesRes.data.tables || []);
            setMigrations(migrationsRes.data.migrations || []);

            if ((!tablesRes.data.tables || tablesRes.data.tables.length === 0) &&
                (!migrationsRes.data.migrations || migrationsRes.data.migrations.length === 0)) {
                setError('No database information available. Database might not be initialized yet.');
            }
        } catch (err) {
            setError('Failed to load database information. Please check database connection and try again.');
            console.error('Database info error:', err);
        } finally {
            setLoading(false);
        }
    };

    const runMigrations = async () => {
        setExecuting(true);
        setActiveAction('migrate');
        setMessage(null);
        setError(null);
        try {
            const response = await axios.post('/api/maintenance/database/migrate');
            setMessage(response.data.message || 'Migrations executed successfully');
            await fetchDatabaseInfo();
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to run migrations';
            setError(`Migration Error: ${errorMsg}. Check your hosting provider's database access settings if this persists.`);
            console.error('Migration error:', err);
        } finally {
            setExecuting(false);
            setActiveAction(null);
        }
    };

    const runSeeders = async () => {
        setExecuting(true);
        setActiveAction('seed');
        setMessage(null);
        setError(null);
        try {
            const response = await axios.post('/api/maintenance/database/seed');
            setMessage(response.data.message || 'Seeders executed successfully');
            await fetchDatabaseInfo();
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to run seeders';
            setError(`Seeder Error: ${errorMsg}. Ensure seeders are available in your database/seeders directory.`);
            console.error('Seeder error:', err);
        } finally {
            setExecuting(false);
            setActiveAction(null);
        }
    };

    const backupDatabase = async () => {
        setExecuting(true);
        setActiveAction('backup');
        setMessage(null);
        setError(null);
        try {
            const response = await axios.get('/api/maintenance/database/backup', {
                responseType: 'blob'
            });

            // Check if response is actually a file or error message
            if (response.data.type === 'application/json') {
                const reader = new FileReader();
                reader.onload = () => {
                    const errorData = JSON.parse(reader.result);
                    throw new Error(errorData.error || 'Failed to backup database');
                };
                reader.readAsText(response.data);
                return;
            }

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `database-backup-${new Date().toISOString().split('T')[0]}.sql`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            setMessage('Database backup downloaded successfully');
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to backup database';
            setError(`Backup Error: ${errorMsg}. Ensure mysqldump is available on your hosting server.`);
            console.error('Backup error:', err);
        } finally {
            setExecuting(false);
            setActiveAction(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Info Box */}
            <div className="bg-[var(--primary-soft)] border border-[var(--primary)] rounded-lg p-4 flex items-start gap-3">
                <Database className="w-5 h-5 text-[var(--info)] flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-[var(--info)]">{t("Database Management")}</p>
                    <p className="text-xs text-[var(--info)] mt-1">{t("Manage your database tables, run migrations, seed data, and create backups. All operations require proper database permissions.")}</p>
                </div>
            </div>

            {/* Status Messages */}
            {message && (
                <div className="bg-[var(--success-soft)] border border-[var(--success)] rounded-lg p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[var(--success)] flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-[var(--success)]">{t("Success")}</p>
                        <p className="text-xs text-[var(--success)] mt-1">{message}</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-[var(--destructive-soft)] border border-[var(--destructive)] rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-[var(--destructive)] flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-[var(--destructive)]">{t("Error Loading Database")}</p>
                                <p className="text-xs text-[var(--destructive)] mt-1">{error}</p>
                            </div>
                        </div>
                        <button
                            onClick={fetchDatabaseInfo}
                            disabled={loading}
                            className="text-[var(--destructive)] hover:text-[var(--destructive)] font-semibold text-xs whitespace-nowrap"
                        >
                            {t("Retry")}
                        </button>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <button
                    onClick={runMigrations}
                    disabled={executing || loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-[var(--surface-2)] text-white px-4 py-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                    {activeAction === 'migrate' && <Loader2 className="w-4 h-4 animate-spin" />}
                    {activeAction !== 'migrate' && <Play className="w-4 h-4" />}
                    {t("Run Migrations")}
                </button>

                <button
                    onClick={runSeeders}
                    disabled={executing || loading}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-[var(--surface-2)] text-white px-4 py-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                    {activeAction === 'seed' && <Loader2 className="w-4 h-4 animate-spin" />}
                    {activeAction !== 'seed' && <Play className="w-4 h-4" />}
                    {t("Run Seeders")}
                </button>

                <button
                    onClick={backupDatabase}
                    disabled={executing || loading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-[var(--surface-2)] text-white px-4 py-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                    {activeAction === 'backup' && <Loader2 className="w-4 h-4 animate-spin" />}
                    {activeAction !== 'backup' && <Download className="w-4 h-4" />}
                    {t("Backup Database")}
                </button>

                <button
                    onClick={fetchDatabaseInfo}
                    disabled={loading || executing}
                    className="bg-gray-600 hover:bg-gray-700 disabled:bg-[var(--surface-2)] text-white px-4 py-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {t("Refresh")}
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-[var(--info)] animate-spin" />
                    <span className="ml-3 text-[var(--muted-foreground)]">{t("Loading database information...")}</span>
                </div>
            ) : (
                <>
                    {/* Tables Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                            <Database className="w-5 h-5 text-[var(--primary)]" />
                            {t("Database Tables (")}{tables.length})
                        </h3>
                        {tables.length === 0 ? (
                            <div className="bg-[var(--surface-2)] border border-dashed border-[var(--border)] rounded-lg p-6 text-center">
                                <Database className="w-10 h-10 text-[var(--muted-foreground)] mx-auto mb-2" />
                                <p className="text-[var(--muted-foreground)] text-sm">{t("No tables found in database")}</p>
                                <p className="text-xs text-[var(--muted-foreground)] mt-1">{t("Run migrations to create tables")}</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {tables.map((table, index) => (
                                    <div key={index} className="border border-[var(--border)] rounded-lg overflow-hidden">
                                        {/* Table Header - Clickable to expand */}
                                        <button
                                            onClick={() => toggleTableExpand(table.name)}
                                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--surface-2)] transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                {expandedTables[table.name] ? (
                                                    <ChevronDown className="w-5 h-5 text-[var(--info)] flex-shrink-0" />
                                                ) : (
                                                    <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)] flex-shrink-0" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-[var(--foreground)] truncate">{table.name}</h4>
                                                    <p className="text-xs text-[var(--muted-foreground)]">
                                                        {table.columns} {t("columns •")} {table.engine}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0 sm:ml-4">
                                                <div className="flex items-center gap-1 bg-[var(--primary-soft)] text-[var(--info)] px-2 py-1 rounded text-xs font-semibold">
                                                    <BarChart3 className="w-3 h-3" />
                                                    {table.rows} {t("rows")}
                                                </div>
                                            </div>
                                        </button>

                                        {/* Expanded Content - Columns */}
                                        {expandedTables[table.name] && (
                                            <div className="border-t border-[var(--border)] bg-[var(--surface-2)] p-4">
                                                <div className="mb-3">
                                                    <p className="text-xs font-semibold text-[var(--foreground)] mb-2 uppercase tracking-wide">
                                                        {t("Collation:")} {table.collation}
                                                    </p>
                                                </div>

                                                <div className="mb-2">
                                                    <p className="text-xs font-semibold text-[var(--foreground)] mb-2">{t("Columns (")}{table.columnDetails?.length || 0})</p>
                                                </div>

                                                {table.columnDetails && table.columnDetails.length > 0 ? (
                                                    <>
                                                        {/* Desktop Table View */}
                                                        <div className="hidden md:block overflow-x-auto">
                                                            <table className="w-full text-xs">
                                                                <thead>
                                                                    <tr className="border-b border-[var(--border)] bg-[var(--card)]">
                                                                        <th className="px-2 py-2 text-left text-[var(--foreground)] font-semibold">{t("Column")}</th>
                                                                        <th className="px-2 py-2 text-left text-[var(--foreground)] font-semibold">{t("Type")}</th>
                                                                        <th className="px-2 py-2 text-left text-[var(--foreground)] font-semibold">{t("Null")}</th>
                                                                        <th className="px-2 py-2 text-left text-[var(--foreground)] font-semibold">{t("Key")}</th>
                                                                        <th className="px-2 py-2 text-left text-[var(--foreground)] font-semibold">{t("Default")}</th>
                                                                        <th className="px-2 py-2 text-left text-[var(--foreground)] font-semibold">{t("Extra")}</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {table.columnDetails.map((col, colIndex) => (
                                                                        <tr key={colIndex} className="border-b border-[var(--border)] hover:bg-[var(--card)]">
                                                                            <td className="px-2 py-2 text-[var(--foreground)] font-mono">{col.name}</td>
                                                                            <td className="px-2 py-2 text-[var(--muted-foreground)] font-mono text-xs">{col.type}</td>
                                                                            <td className="px-2 py-2">
                                                                                {col.null ? (
                                                                                    <span className="bg-[var(--success-soft)] text-[var(--success)] px-2 py-1 rounded text-xs">{t("YES")}</span>
                                                                                ) : (
                                                                                    <span className="bg-[var(--destructive-soft)] text-[var(--destructive)] px-2 py-1 rounded text-xs">{t("NO")}</span>
                                                                                )}
                                                                            </td>
                                                                            <td className="px-2 py-2 text-[var(--muted-foreground)]">{col.key || '-'}</td>
                                                                            <td className="px-2 py-2 text-[var(--muted-foreground)] font-mono text-xs">{col.default !== null ? col.default : '-'}</td>
                                                                            <td className="px-2 py-2 text-[var(--muted-foreground)] text-xs">{col.extra || '-'}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>

                                                        {/* Mobile Card View */}
                                                        <div className="md:hidden space-y-2">
                                                            {table.columnDetails.map((col, colIndex) => (
                                                                <div key={colIndex} className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3 text-xs">
                                                                    <div className="mb-2">
                                                                        <p className="font-semibold text-[var(--foreground)] break-words">{col.name}</p>
                                                                        <p className="text-[var(--muted-foreground)] font-mono text-xs mt-1">{col.type}</p>
                                                                    </div>
                                                                    <div className="space-y-1 border-t border-[var(--border)] pt-2">
                                                                        <div className="flex justify-between items-center gap-2">
                                                                            <span className="text-[var(--muted-foreground)] font-semibold">{t("Null:")}</span>
                                                                            {col.null ? (
                                                                                <span className="bg-[var(--success-soft)] text-[var(--success)] px-2 py-0.5 rounded text-xs">{t("YES")}</span>
                                                                            ) : (
                                                                                <span className="bg-[var(--destructive-soft)] text-[var(--destructive)] px-2 py-0.5 rounded text-xs">{t("NO")}</span>
                                                                            )}
                                                                        </div>
                                                                        {col.key && (
                                                                            <div className="flex justify-between items-center gap-2">
                                                                                <span className="text-[var(--muted-foreground)] font-semibold">{t("Key:")}</span>
                                                                                <span className="text-[var(--foreground)]">{col.key}</span>
                                                                            </div>
                                                                        )}
                                                                        {col.default !== null && (
                                                                            <div className="flex justify-between items-center gap-2">
                                                                                <span className="text-[var(--muted-foreground)] font-semibold">{t("Default:")}</span>
                                                                                <span className="text-[var(--foreground)] font-mono text-xs">{col.default}</span>
                                                                            </div>
                                                                        )}
                                                                        {col.extra && (
                                                                            <div className="flex justify-between items-center gap-2">
                                                                                <span className="text-[var(--muted-foreground)] font-semibold">{t("Extra:")}</span>
                                                                                <span className="text-[var(--foreground)] text-xs">{col.extra}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <p className="text-[var(--muted-foreground)] text-xs">{t("No column details available")}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Migrations Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                            <RefreshCw className="w-5 h-5 text-[var(--info)]" />
                            {t("Migrations")}
                        </h3>

                        {migrations.length === 0 ? (
                            <div className="bg-[var(--surface-2)] border border-dashed border-[var(--border)] rounded-lg p-6 text-center">
                                <RefreshCw className="w-10 h-10 text-[var(--muted-foreground)] mx-auto mb-2" />
                                <p className="text-[var(--muted-foreground)] text-sm">{t("No migrations found")}</p>
                                <p className="text-xs text-[var(--muted-foreground)] mt-1">{t("Click \"Run Migrations\" to initialize the database")}</p>
                            </div>
                        ) : (
                            <>
                                {/* Summary Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                    <div className="bg-[var(--primary-soft)] border border-[var(--primary)] rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-[var(--info)]">{migrations.length}</p>
                                        <p className="text-xs text-[var(--info)] font-semibold">{t("Total")}</p>
                                    </div>
                                    <div className="bg-[var(--success-soft)] border border-[var(--success)] rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-[var(--success)]">{migrations.filter(m => m.status === 'executed').length}</p>
                                        <p className="text-xs text-[var(--success)] font-semibold">{t("Executed")}</p>
                                    </div>
                                    <div className="bg-[var(--warning-soft)] border border-yellow-200 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-[var(--warning)]">{migrations.filter(m => m.status === 'pending').length}</p>
                                        <p className="text-xs text-[var(--warning)] font-semibold">{t("Pending")}</p>
                                    </div>
                                    <div className="bg-[var(--destructive-soft)] border border-[var(--destructive)] rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-[var(--destructive)]">{migrations.filter(m => !m.inFileSystem).length}</p>
                                        <p className="text-xs text-[var(--destructive)] font-semibold">{t("Missing Files")}</p>
                                    </div>
                                </div>

                                {/* Desktop Migrations Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                                                <th className="px-4 py-2 text-left text-[var(--foreground)] font-semibold">{t("Migration Name")}</th>
                                                <th className="px-4 py-2 text-center text-[var(--foreground)] font-semibold">{t("Status")}</th>
                                                <th className="px-4 py-2 text-center text-[var(--foreground)] font-semibold">{t("Batch")}</th>
                                                <th className="px-4 py-2 text-center text-[var(--foreground)] font-semibold">{t("File")}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {migrations.map((migration, index) => (
                                                <tr key={index} className="border-b border-[var(--border)] hover:bg-[var(--surface-2)]">
                                                    <td className="px-4 py-3 text-[var(--foreground)] font-mono text-xs break-all">{migration.name}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        {migration.status === 'executed' ? (
                                                            <span className="inline-flex items-center gap-1 bg-[var(--success-soft)] text-[var(--success)] px-2 py-1 rounded text-xs font-semibold">
                                                                {t("✓ Executed")}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 bg-[var(--warning-soft)] text-[var(--warning)] px-2 py-1 rounded text-xs font-semibold">
                                                                {t("◐ Pending")}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {migration.batch ? (
                                                            <span className="bg-[var(--primary-soft)] text-[var(--info)] px-2 py-1 rounded text-xs font-semibold">
                                                                #{migration.batch}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[var(--muted-foreground)] text-xs">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {migration.inFileSystem ? (
                                                            <span className="inline-flex items-center gap-1 bg-[var(--success-soft)] text-[var(--success)] px-2 py-1 rounded text-xs font-semibold">
                                                                {t("✓ Present")}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 bg-[var(--destructive-soft)] text-[var(--destructive)] px-2 py-1 rounded text-xs font-semibold">
                                                                {t("✗ Missing")}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Migrations Card View */}
                                <div className="md:hidden space-y-2">
                                    {migrations.map((migration, index) => (
                                        <div key={index} className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3">
                                            <div className="mb-2">
                                                <p className="font-semibold text-[var(--foreground)] text-xs break-all">{migration.name}</p>
                                            </div>
                                            <div className="space-y-2 border-t border-[var(--border)] pt-2 text-xs">
                                                <div className="flex justify-between items-center gap-2">
                                                    <span className="text-[var(--muted-foreground)] font-semibold">{t("Status:")}</span>
                                                    {migration.status === 'executed' ? (
                                                        <span className="inline-flex items-center gap-1 bg-[var(--success-soft)] text-[var(--success)] px-2 py-0.5 rounded text-xs font-semibold">
                                                            {t("✓ Executed")}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 bg-[var(--warning-soft)] text-[var(--warning)] px-2 py-0.5 rounded text-xs font-semibold">
                                                            {t("◐ Pending")}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex justify-between items-center gap-2">
                                                    <span className="text-[var(--muted-foreground)] font-semibold">{t("Batch:")}</span>
                                                    {migration.batch ? (
                                                        <span className="bg-[var(--primary-soft)] text-[var(--info)] px-2 py-0.5 rounded text-xs font-semibold">
                                                            #{migration.batch}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[var(--muted-foreground)] text-xs">-</span>
                                                    )}
                                                </div>
                                                <div className="flex justify-between items-center gap-2">
                                                    <span className="text-[var(--muted-foreground)] font-semibold">{t("File:")}</span>
                                                    {migration.inFileSystem ? (
                                                        <span className="inline-flex items-center gap-1 bg-[var(--success-soft)] text-[var(--success)] px-2 py-0.5 rounded text-xs font-semibold">
                                                            {t("✓ Present")}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 bg-[var(--destructive-soft)] text-[var(--destructive)] px-2 py-0.5 rounded text-xs font-semibold">
                                                            {t("✗ Missing")}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Legend */}
                                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                                    <p className="text-xs text-[var(--muted-foreground)] mb-2 font-semibold">{t("Legend:")}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-[var(--muted-foreground)]">
                                        <p><span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>{t("Executed: Already run in database")}</p>
                                        <p><span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>{t("Pending: Waiting to be executed")}</p>
                                        <p><span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>{t("Missing: File not found in database/migrations")}</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
