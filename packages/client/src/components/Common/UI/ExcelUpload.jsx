import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { Upload } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@lib/utils';

const ExcelUpload = ({ onDataUpload, className }) => {
  const onDrop = useCallback(acceptedFiles => {
    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      onDataUpload(jsonData);
    };

    reader.readAsArrayBuffer(file);
  }, [onDataUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    }
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
        isDragActive ? "border-[var(--primary)] bg-[var(--hover-overlay)]" : "border-[var(--divider)]",
        className
      )}
    >
      <input {...getInputProps()} />
      <Upload className="w-12 h-12 mx-auto mb-4 text-[var(--secondary)]" />
      {isDragActive ? (
        <p className="text-[var(--primary)]">Drop the files here ...</p>
      ) : (
        <div>
          <p className="text-[var(--text-primary)] mb-2">
            Drag & drop Excel/CSV file here, or click to select
          </p>
          <p className="text-[var(--secondary)] text-sm">
            Supports .xlsx, .xls, and .csv files
          </p>
          <Button variant="outline" className="mt-4">
            Select File
          </Button>
        </div>
      )}
    </div>
  );
};

export default ExcelUpload; 