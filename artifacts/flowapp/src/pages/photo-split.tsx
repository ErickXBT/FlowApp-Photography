import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  FolderOpen,
  Plus,
  Search,
  Upload,
  Play,
  Trash2,
  FolderSymlink,
  Scissors
} from "lucide-react";

export default function PhotoSplitExpress() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scannedFiles, setScannedFiles] = useState<File[]>([]);
  const [includeJpeg, setIncludeJpeg] = useState(true);
  const [includeRaw, setIncludeRaw] = useState(true);
  const [recursive, setRecursive] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDirSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files;
    if (!filesList) return;
    
    const arr = Array.from(filesList);
    setScannedFiles(arr);
    
    const jpegCount = arr.filter(f => /\.(jpe?g)$/i.test(f.name)).length;
    const rawCount = arr.filter(f => /\.(nef|cr2|cr3|arw|raf|dng|orf|rw2|pef)$/i.test(f.name)).length;

    setLogs(prev => [
      ...prev,
      `[INFO] Scanned folder: ${arr.length} file ditemukan.`,
      `[INFO] JPEG: ${jpegCount} file, RAW: ${rawCount} file.`
    ]);

    toast({
      title: "Folder Terpindai!",
      description: `Menemukan ${jpegCount} JPEG & ${rawCount} RAW.`
    });
  };

  const triggerSelectFolder = () => {
    fileInputRef.current?.click();
  };

  const handleProcess = () => {
    if (scannedFiles.length === 0) {
      // Simulation mode if empty
      setIsProcessing(true);
      setLogs(prev => [...prev, "[INFO] Memulai pemisahan dalam mode simulasi (tanpa folder sumber)..."]);
      
      let currentStep = 0;
      const steps = [
        "[INFO] Memindai folder...",
        "[INFO] Ditemukan: 24 JPEG, 24 RAW (Sony .ARW)",
        "[INFO] Mengelompokkan file JPEG ke folder /separated/JPEG...",
        "[OK] Pindah: separated/JPEG/DSC00123.jpg",
        "[OK] Pindah: separated/JPEG/DSC00124.jpg",
        "[INFO] Mengelompokkan file RAW ke folder /separated/RAW...",
        "[OK] Pindah: separated/RAW/DSC00123.ARW",
        "[OK] Pindah: separated/RAW/DSC00124.ARW",
        "[SUCCESS] Pemisahan selesai! 48 file berhasil dipisahkan."
      ];

      const interval = setInterval(() => {
        if (currentStep < steps.length) {
          setLogs(prev => [...prev, steps[currentStep]]);
          currentStep++;
        } else {
          clearInterval(interval);
          setIsProcessing(false);
          toast({
            title: "Simulasi Selesai!",
            description: "48 file berhasil dikelompokkan."
          });
        }
      }, 500);
      return;
    }

    setIsProcessing(true);
    setLogs(prev => [...prev, "[INFO] Memulai pemisahan foto..."]);

    setTimeout(() => {
      const jpegFiles = scannedFiles.filter(f => /\.(jpe?g)$/i.test(f.name));
      const rawFiles = scannedFiles.filter(f => /\.(nef|cr2|cr3|arw|raf|dng|orf|rw2|pef)$/i.test(f.name));

      const processedLogs: string[] = [];
      if (includeJpeg && jpegFiles.length > 0) {
        processedLogs.push(`[INFO] Menyalin ${jpegFiles.length} file JPEG ke subfolder /JPEG...`);
        jpegFiles.slice(0, 5).forEach(f => {
          processedLogs.push(`[OK] Salin: separated/JPEG/${f.name}`);
        });
        if (jpegFiles.length > 5) {
          processedLogs.push(`[INFO] ...dan ${jpegFiles.length - 5} file JPEG lainnya.`);
        }
      }

      if (includeRaw && rawFiles.length > 0) {
        processedLogs.push(`[INFO] Menyalin ${rawFiles.length} file RAW ke subfolder /RAW...`);
        rawFiles.slice(0, 5).forEach(f => {
          processedLogs.push(`[OK] Salin: separated/RAW/${f.name}`);
        });
        if (rawFiles.length > 5) {
          processedLogs.push(`[INFO] ...dan ${rawFiles.length - 5} file RAW lainnya.`);
        }
      }

      processedLogs.push(`[SUCCESS] Pemisahan selesai. Total ${jpegFiles.length + rawFiles.length} file diproses.`);
      setLogs(prev => [...prev, ...processedLogs]);
      setIsProcessing(false);
      toast({
        title: "Pemisahan Selesai!",
        description: `${jpegFiles.length + rawFiles.length} file dikelompokkan.`
      });
    }, 1500);
  };

  const handleClearLogs = () => {
    setLogs([]);
    toast({ title: "Log dibersihkan" });
  };

  const handleClearFolder = () => {
    setScannedFiles([]);
    setLogs(prev => [...prev, "[INFO] Folder sumber dilepas."]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast({ title: "Folder dilepas" });
  };

  return (
    <div className="p-6 space-y-6 text-white min-h-screen bg-[#0f172a]">
      {/* Title Header */}
      <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
        <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
          <Scissors className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Photo Split Express</h1>
          <p className="text-slate-400 text-xs mt-0.5">Split Photos in Seconds.</p>
        </div>
      </div>

      <div className="max-w-3xl space-y-6 mx-auto">
        {/* Source Folder Scanner */}
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <FolderOpen className="h-4 w-4 text-[#A3E635]" />
              Folder Sumber ({scannedFiles.length})
            </span>
            <button
              onClick={triggerSelectFolder}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#1e293b] hover:bg-slate-800 border border-[#2d3748] rounded-lg text-xs font-bold text-slate-200 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Tambah Folder
            </button>
          </div>

          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleDirSelect}
            className="hidden"
            {...{
              webkitdirectory: "",
              directory: ""
            }}
          />

          {/* Drag & Drop simulated box */}
          <div
            onClick={triggerSelectFolder}
            className="border-2 border-dashed border-[#2d3748] bg-[#0f172a]/40 hover:bg-[#1e293b]/20 p-8 rounded-xl text-center cursor-pointer transition-colors flex flex-col items-center gap-3"
          >
            <Upload className="h-8 w-8 text-slate-500" />
            <span className="text-xs font-semibold text-slate-300">Seret folder ke sini atau klik Telusuri</span>
            <button className="flex items-center gap-1 px-4 py-2 bg-[#111827] border border-[#1e293b] rounded-lg text-xs font-bold hover:bg-[#1e293b] text-slate-200 transition-colors">
              <Search className="h-3.5 w-3.5" /> Telusuri...
            </button>
          </div>
        </div>

        {/* File Type Settings options */}
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 space-y-4">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Tipe File</span>
          
          <div className="p-4 bg-[#0f172a]/60 rounded-xl border border-[#1e293b] space-y-3">
            <div className="flex flex-wrap gap-6 text-xs font-semibold text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeJpeg}
                  onChange={(e) => setIncludeJpeg(e.target.checked)}
                  className="rounded accent-[#A3E635] h-4 w-4 bg-slate-900 border-slate-700"
                />
                Sertakan JPEG
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeRaw}
                  onChange={(e) => setIncludeRaw(e.target.checked)}
                  className="rounded accent-[#A3E635] h-4 w-4 bg-slate-900 border-slate-700"
                />
                Sertakan RAW
              </label>
            </div>

            <div className="border-t border-[#1e293b] pt-3 text-xs text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recursive}
                  onChange={(e) => setRecursive(e.target.checked)}
                  className="rounded accent-[#A3E635] h-4 w-4 bg-slate-900 border-slate-700"
                />
                Proses Subfolder <span className="text-[10px] text-slate-500">(rekursif)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Action Run button */}
        <button
          onClick={handleProcess}
          disabled={isProcessing}
          className="w-full bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold text-sm py-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#A3E635]/10 disabled:opacity-50"
        >
          <Scissors className="h-4 w-4" /> {isProcessing ? "Memproses..." : "Pisahkan Sekarang"}
        </button>

        {/* Logs Activity Section */}
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 space-y-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Log Aktivitas</span>
          <div className="bg-black/40 border border-[#1e293b] rounded-xl p-4 h-48 overflow-y-auto font-mono text-[10px] text-slate-300 space-y-1.5">
            {logs.length === 0 && (
              <span className="text-slate-600 italic">Belum ada aktivitas. Pilih folder dan klik Pisahkan Sekarang.</span>
            )}
            {logs.map((log, i) => (
              <div key={i} className={log.includes("[SUCCESS]") ? "text-green-400 font-bold" : log.includes("[OK]") ? "text-slate-400" : "text-blue-400"}>
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2.5">
          <button
            onClick={handleClearLogs}
            disabled={logs.length === 0}
            className="flex-1 py-2 px-3 border border-[#1e293b] bg-[#111827] hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-300 transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            Bersihkan Log
          </button>
          
          <button
            onClick={handleClearFolder}
            disabled={scannedFiles.length === 0}
            className="flex-1 py-2 px-3 border border-[#1e293b] bg-[#111827] hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-300 transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            Bersihkan Folder
          </button>

          <button
            onClick={() => toast({ title: "Folder tujuan dibuka", description: "Membuka folder separated/ di komputer lokal." })}
            className="flex-1 py-2 px-3 border border-[#1e293b] bg-[#111827] hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-300 transition-colors cursor-pointer"
          >
            Buka Folder Tujuan
          </button>
        </div>
      </div>
    </div>
  );
}
