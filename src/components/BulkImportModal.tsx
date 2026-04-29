'use client';

import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import { Upload } from 'lucide-react';

// Dynamically import xlsx to avoid build issues
const loadXLSX = async () => {
  try {
    const XLSX = await import('xlsx');
    return XLSX.default || XLSX;
  } catch (error) {
    console.error('Failed to load xlsx:', error);
    return null;
  }
};

interface ImportRow {
  full_name: string;
  phone: string;
  amount?: number | string;
  month?: number | string;
  note?: string;
  error?: string;
}

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: ImportRow[]) => Promise<void>;
  isLoading?: boolean;
}

export default function BulkImportModal({
  isOpen,
  onClose,
  onImport,
  isLoading = false,
}: BulkImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ImportRow[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');
  const [error, setError] = useState<string>('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSelectedFile(file);

    try {
      const XLSX = await loadXLSX();
      if (!XLSX) {
        setError('Failed to load Excel parser. Please refresh the page and try again.');
        return;
      }

      // Parse Excel file
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Validate and transform data
          const validatedData: ImportRow[] = jsonData
            .map((row: any, index: number) => ({
              full_name: row.full_name?.toString().trim() || '',
              phone: row.phone?.toString().trim() || '',
              amount: row.amount ? parseFloat(row.amount) : undefined,
              month: row.month ? parseInt(row.month) : undefined,
              note: row.note?.toString().trim() || '',
            }))
            .filter((row) => {
              // Validate required fields
              if (!row.full_name) {
                row.error = 'Missing full_name';
                return true;
              }
              if (!row.phone) {
                row.error = 'Missing phone';
                return true;
              }
              return true;
            });

          if (validatedData.length === 0) {
            setError('No valid rows found in Excel file');
            return;
          }

          setParsedData(validatedData);
          setStep('preview');
        } catch (err: any) {
          setError(err.message || 'Failed to parse Excel file');
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      setError(err.message || 'Failed to process file');
    }
  };

  const handleImport = async () => {
    try {
      setStep('importing');
      const validRows = parsedData.filter((row) => !row.error);
      
      if (validRows.length === 0) {
        setError('No valid rows to import');
        setStep('preview');
        return;
      }

      await onImport(validRows);
      
      // Reset on success
      setStep('upload');
      setSelectedFile(null);
      setParsedData([]);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to import data');
      setStep('preview');
    }
  };

  const handleClose = () => {
    if (step !== 'importing') {
      setStep('upload');
      setSelectedFile(null);
      setParsedData([]);
      setError('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Import Members & Contributions"
    >
      {step === 'upload' && (
        <div className="space-y-4">
          <div className="bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg p-8 text-center cursor-pointer hover:border-grove-accent transition">
            <label className="block cursor-pointer">
              <Upload className="mx-auto mb-2 text-slate-400" size={32} />
              <p className="text-slate-300 font-medium mb-1">
                Click to select or drag Excel file
              </p>
              <p className="text-slate-500 text-sm mb-4">
                Expected columns: full_name, phone, amount (optional), month (optional), note (optional)
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>

          {selectedFile && (
            <p className="text-sm text-slate-400">
              Selected: <span className="text-white font-medium">{selectedFile.name}</span>
            </p>
          )}

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 p-3 rounded">
              {error}
            </p>
          )}
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">
              Found {parsedData.length} rows
            </h3>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left px-3 py-2 text-slate-400">Full Name</th>
                    <th className="text-left px-3 py-2 text-slate-400">Phone</th>
                    <th className="text-left px-3 py-2 text-slate-400">Amount</th>
                    <th className="text-left px-3 py-2 text-slate-400">Month</th>
                    <th className="text-left px-3 py-2 text-red-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-800">
                      <td className="px-3 py-2 text-slate-200">{row.full_name}</td>
                      <td className="px-3 py-2 text-slate-200">{row.phone}</td>
                      <td className="px-3 py-2 text-slate-200">{row.amount || '-'}</td>
                      <td className="px-3 py-2 text-slate-200">{row.month || '-'}</td>
                      <td className="px-3 py-2">
                        {row.error ? (
                          <span className="text-red-400 text-xs">{row.error}</span>
                        ) : (
                          <span className="text-green-400 text-xs">✓ Valid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 p-3 rounded">
              {error}
            </p>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setStep('upload')}>
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleImport}
              isLoading={isLoading}
              disabled={parsedData.every((row) => row.error)}
            >
              Import {parsedData.filter((row) => !row.error).length} Valid Rows
            </Button>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <div className="space-y-4 text-center py-8">
          <div className="inline-block">
            <div className="animate-spin">
              <Upload size={32} className="text-grove-accent" />
            </div>
          </div>
          <p className="text-slate-300">Importing data...</p>
          <p className="text-slate-500 text-sm">
            This may take a moment. Please do not close this dialog.
          </p>
        </div>
      )}
    </Modal>
  );
}
