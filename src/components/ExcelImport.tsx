import React, { useState } from "react";
import { FileUp, CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { cn } from "../lib/utils";

interface ExcelImportProps {
  onSuccess: () => void;
}

const ExcelImport: React.FC<ExcelImportProps> = ({ onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ imported: number, skipped: number, errors: string[] } | null>(null);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.endsWith(".xlsx") && !selected.name.endsWith(".xls")) {
        setError("Please upload an Excel file (.xlsx or .xls)");
        return;
      }
      setFile(selected);
      setError("");
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/import-excel", {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Server response was not JSON:", responseText);
        let errorMsg = "Server communication error";
        if (response.status === 404) errorMsg = `Endpoint not found (404). Server said: ${responseText.substring(0, 50)}...`;
        if (response.status === 413) errorMsg = "File is too large for the server to process";
        if (response.status === 500) errorMsg = "Server encountered an internal error";
        throw new Error(`${errorMsg}. Please try again or contact support.`);
      }
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to upload file");
      }

      setResult(data);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "An error occurred during upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className="hover:text-black cursor-pointer">Customers</span>
        <span className="px-1">/</span>
        <span className="text-black font-medium">Batch Import</span>
      </div>

      <div className="max-w-2xl bg-white border border-[#e5e5e5] rounded-lg shadow-sm overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col items-center justify-center border border-dashed border-[#e5e5e5] rounded-lg p-12 bg-[#fafafa] group transition-all relative">
            <div className="w-12 h-12 bg-white rounded border border-[#e5e5e5] flex items-center justify-center mb-4 group-hover:bg-black group-hover:text-white transition-all">
               <FileUp className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold">Drop Excel files here</p>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">xlsx or xls only</p>
            <input 
              type="file" 
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          <div className="flex justify-center mt-4">
            <button
              onClick={async () => {
                try {
                  const res = await fetch("/api/health");
                  const text = await res.text();
                  alert(`API Health Check: [${res.status}] ${text}`);
                } catch (e: any) {
                  alert(`API Health Check Error: ${e.message}`);
                }
              }}
              className="text-[10px] text-gray-400 hover:text-black underline transition-colors"
            >
              Troubleshoot API Connection
            </button>
          </div>

          {file && !result && (
            <div className="mt-6 p-4 bg-[#fafafa] border border-[#e5e5e5] rounded flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileUp className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium text-black">{file.name}</span>
              </div>
              <button 
                onClick={handleUpload}
                disabled={uploading}
                className="flex items-center gap-2 bg-black text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-gray-800 transition-all disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                {uploading ? "Importing..." : "Process File"}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-6 p-3 bg-red-50 border border-red-100 rounded flex items-center gap-2 text-red-600 text-[10px] font-bold uppercase tracking-wider">
              <AlertCircle className="w-4 h-4" />
              <p>{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-green-50 border border-green-100 rounded flex items-center gap-3 text-green-700">
                <CheckCircle2 className="w-5 h-5" />
                <div>
                   <p className="text-xs font-bold uppercase tracking-wider">Import Success</p>
                   <p className="text-[10px] mt-0.5">{result.imported} contacts added to Nexus system.</p>
                </div>
              </div>
              
              {result.skipped > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded flex items-center gap-3 text-blue-700">
                  <AlertCircle className="w-5 h-5" />
                  <p className="text-[10px] font-medium leading-relaxed">Skipped {result.skipped} entries (possible duplicates or invalid data structure).</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-[#fafafa] px-8 py-6 border-t border-[#e5e5e5]">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Schema Mapping</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {["Name", "Phone", "Email", "Company", "Position", "Status", "Notes"].map(col => (
              <div key={col} className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-black"></div>
                <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wide">{col}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelImport;
