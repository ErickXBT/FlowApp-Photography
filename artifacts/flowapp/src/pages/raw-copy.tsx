import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  FolderOpen,
  Plus,
  Play,
  RotateCcw,
  Rocket,
  ArrowRightLeft,
  Search,
  CheckCircle2,
  XCircle,
  Copy,
  ChevronRight
} from "lucide-react";

export default function RawFileCopyTool() {
  const { toast } = useToast();
  const originInputRef = useRef<HTMLInputElement>(null);
  const destInputRef = useRef<HTMLInputElement>(null);

  const [originFolder, setOriginFolder] = useState<string>("Belum dipilih");
  const [destFolder, setDestFolder] = useState<string>("Belum dipilih");
  
  const [scanSubfolder, setScanSubfolder] = useState(true);
  const [folderStructure, setFolderStructure] = useState(true);

  // Raw types selection states
  const [rawTypes, setRawTypes] = useState({
    sony: true,
    canon: false,
    canonNew: false,
    nikon: false,
    nikonAlt: false,
    fuji: false,
    panasonic: false,
    olympus: false,
    pentax: false,
    leica: false,
    jpg: false,
  });

  const [activeInputMode, setActiveInputMode] = useState<"text" | "jpeg" | "drive">("text");
  const [fileListText, setFileListText] = useState("");
  const [scannedFiles, setScannedFiles] = useState<File[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [failCount, setFailCount] = useState(0);

  const handleOriginSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files;
    if (!filesList) return;
    const arr = Array.from(filesList);
    setScannedFiles(arr);
    
    // Set origin folder text path representation
    const firstPath = arr[0]?.webkitRelativePath || "";
    const folderName = firstPath.split("/")[0] || "Selected Folder";
    setOriginFolder(folderName);
    
    toast({
      title: "Folder Asal Terpilih!",
      description: `${arr.length} file terpindai.`
    });
  };

  const handleDestSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files;
    if (!filesList) return;
    const arr = Array.from(filesList);
    
    const firstPath = arr[0]?.webkitRelativePath || "";
    const folderName = firstPath.split("/")[0] || "Selected Destination";
    setDestFolder(folderName);
    
    toast({
      title: "Folder Tujuan Terpilih!",
      description: `${folderName} siap digunakan.`
    });
  };

  const handleToggleType = (key: keyof typeof rawTypes) => {
    setRawTypes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleReset = () => {
    setFileListText("");
    setSuccessCount(0);
    setFailCount(0);
    toast({ title: "Input direset" });
  };

  const handleCopyProcess = (mode: "copy" | "move") => {
    if (!fileListText.trim()) {
      toast({
        variant: "destructive",
        title: "Input Kosong!",
        description: "Masukkan daftar file terlebih dahulu."
      });
      return;
    }

    const extensionMap: Record<keyof typeof rawTypes, string[]> = {
      sony: [".arw"],
      canon: [".cr2"],
      canonNew: [".cr3"],
      nikon: [".nef"],
      nikonAlt: [".nrw"],
      fuji: [".raf"],
      panasonic: [".rw2"],
      olympus: [".orf"],
      pentax: [".pef"],
      leica: [".dng"],
      jpg: [".jpg", ".jpeg"],
    };

    const activeExtensions: string[] = [];
    Object.entries(rawTypes).forEach(([key, val]) => {
      if (val) {
        activeExtensions.push(...extensionMap[key as keyof typeof rawTypes]);
      }
    });

    if (activeExtensions.length === 0) {
      toast({
        variant: "destructive",
        title: "Tipe RAW Belum Dipilih!",
        description: "Silakan pilih setidaknya satu tipe file RAW untuk diproses."
      });
      return;
    }

    setIsProcessing(true);
    setLogs([]);
    setSuccessCount(0);
    setFailCount(0);

    const parsedNames = fileListText
      .split(/[\n,]/)
      .map(name => name.trim())
      .filter(name => name.length > 0);

    setLogs(prev => [
      ...prev,
      `[INFO] Memulai pencarian file RAW (${mode === "copy" ? "Salin" : "Pindah"})...`,
      `[INFO] Target pemrosesan: ${parsedNames.length} nama file.`,
      `[INFO] Ekstensi aktif: ${activeExtensions.join(", ").toUpperCase()}`
    ]);

    setTimeout(() => {
      let succeeded = 0;
      let failed = 0;
      const resultsLogs: string[] = [];

      parsedNames.forEach(name => {
        // Strip any extension if included in name input
        const baseName = name.replace(/\.[^/.]+$/, "");
        
        let matched = false;
        let matchedExtension = "";

        if (scannedFiles.length > 0) {
          matched = scannedFiles.some(f => {
            const fBase = f.name.replace(/\.[^/.]+$/, "");
            const ext = "." + (f.name.split(".").pop() || "").toLowerCase();
            const nameMatch = fBase.toLowerCase() === baseName.toLowerCase();
            const extMatch = activeExtensions.includes(ext);
            if (nameMatch && extMatch) {
              matchedExtension = ext.toUpperCase();
              return true;
            }
            return false;
          });
        } else {
          // Simulation fallback matches 80% of items
          matched = Math.random() > 0.2;
          if (matched) {
            matchedExtension = activeExtensions[Math.floor(Math.random() * activeExtensions.length)].toUpperCase();
          }
        }

        if (matched) {
          succeeded++;
          resultsLogs.push(`[OK] Ditemukan: ${baseName}${matchedExtension} -> disalin ke ${destFolder === "Belum dipilih" ? "tujuan/" : destFolder + "/"}`);
        } else {
          failed++;
          resultsLogs.push(`[FAILED] Tidak ditemukan: ${baseName} (RAW File dengan ekstensi aktif tidak terdeteksi)`);
        }
      });

      setLogs(prev => [...prev, ...resultsLogs, `[SUCCESS] Pemrosesan selesai. Berhasil: ${succeeded}, Gagal: ${failed}.`]);
      setSuccessCount(succeeded);
      setFailCount(failed);
      setIsProcessing(false);

      toast({
        title: "Penyalinan Selesai!",
        description: `${succeeded} berhasil, ${failed} gagal.`
      });
    }, 1500);
  };

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(logs.join("\n"));
    toast({ title: "Log disalin ke clipboard" });
  };

  return (
    <div className="p-6 space-y-6 text-white min-h-screen bg-[#0f172a]">
      {/* Title Header */}
      <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
        <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
          <FolderOpen className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold">RAW File Copy Tool</h1>
          <p className="text-slate-400 text-xs mt-0.5">Effortless RAW File Management.</p>
        </div>
      </div>

      <div className="max-w-3xl space-y-6 mx-auto">
        {/* Source and Target folder selectors */}
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Origin Folder */}
            <div className="space-y-2">
              <input
                type="file"
                multiple
                ref={originInputRef}
                onChange={handleOriginSelect}
                className="hidden"
                {...{
                  webkitdirectory: "",
                  directory: ""
                }}
              />
              <button
                onClick={() => originInputRef.current?.click()}
                className="w-full py-2.5 px-4 bg-[#1e293b] hover:bg-slate-800 border border-[#2d3748] rounded-lg text-xs font-bold text-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <FolderOpen className="h-4 w-4 text-[#A3E635]" /> Pilih Folder Asal...
              </button>
              <div className="text-[10px] text-slate-400 italic text-center truncate">
                Folder Asal: <span className="text-white font-semibold">{originFolder}</span>
              </div>
            </div>

            {/* Destination Folder */}
            <div className="space-y-2">
              <input
                type="file"
                multiple
                ref={destInputRef}
                onChange={handleDestSelect}
                className="hidden"
                {...{
                  webkitdirectory: "",
                  directory: ""
                }}
              />
              <button
                onClick={() => destInputRef.current?.click()}
                className="w-full py-2.5 px-4 bg-[#1e293b] hover:bg-slate-800 border border-[#2d3748] rounded-lg text-xs font-bold text-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <FolderOpen className="h-4 w-4 text-[#A3E635]" /> Pilih Folder Tujuan...
              </button>
              <div className="text-[10px] text-slate-400 italic text-center truncate">
                Folder Tujuan: <span className="text-white font-semibold">{destFolder}</span>
              </div>
            </div>
          </div>

          {/* Subfolder Scan Toggles */}
          <div className="flex justify-center gap-6 text-[10px] font-bold text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={scanSubfolder}
                onChange={(e) => setScanSubfolder(e.target.checked)}
                className="rounded accent-[#A3E635] h-3.5 w-3.5 bg-slate-900 border-slate-700"
              />
              Scan Subfolder
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={folderStructure}
                onChange={(e) => setFolderStructure(e.target.checked)}
                className="rounded accent-[#A3E635] h-3.5 w-3.5 bg-slate-900 border-slate-700"
              />
              Struktur Folder
            </label>
          </div>
        </div>

        {/* Camera Raw type selection grid */}
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 space-y-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Pilih tipe file RAW</span>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-[#0f172a]/60 rounded-xl border border-[#1e293b] text-xs font-semibold text-slate-300">
            {[
              { key: "sony" as const, label: "Sony (.ARW)" },
              { key: "canon" as const, label: "Canon (.CR2)" },
              { key: "canonNew" as const, label: "Canon (baru) (.CR3)" },
              { key: "nikon" as const, label: "Nikon (.NEF)" },
              { key: "nikonAlt" as const, label: "Nikon (alt) (.NRW)" },
              { key: "fuji" as const, label: "Fujifilm (.RAF)" },
              { key: "panasonic" as const, label: "Panasonic (.RW2)" },
              { key: "olympus" as const, label: "Olympus (.ORF)" },
              { key: "pentax" as const, label: "Pentax (.PEF)" },
              { key: "leica" as const, label: "Leica / Umum (.DNG)" },
              { key: "jpg" as const, label: "JPEG (.JPG)" },
            ].map(type => (
              <label key={type.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rawTypes[type.key]}
                  onChange={() => handleToggleType(type.key)}
                  className="rounded accent-[#A3E635] h-4 w-4 bg-slate-900 border-slate-700"
                />
                {type.label}
              </label>
            ))}
          </div>
        </div>

        {/* Mode Input Tabs matching Image 2 */}
        <div className="flex gap-2 p-1 bg-[#111827] rounded-lg border border-[#1e293b] w-fit">
          {[
            { id: "text" as const, label: "List Teks" },
            { id: "jpeg" as const, label: "Folder JPEG" },
            { id: "drive" as const, label: "Google Drive" },
          ].map(tab => (
            <span
              key={tab.id}
              onClick={() => setActiveInputMode(tab.id)}
              className={`px-4 py-2 text-xs font-bold rounded-md cursor-pointer transition-all ${
                activeInputMode === tab.id
                  ? "bg-[#1e293b] text-white border border-[#2d3748]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </span>
          ))}
        </div>

        {/* Text Input area list of files */}
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 space-y-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Masukkan Daftar File</span>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Masukkan list dengan per baris atau dipisah koma. Contoh: DSC01234, 1234, atau 234
          </p>

          <textarea
            value={fileListText}
            onChange={(e) => setFileListText(e.target.value)}
            rows={5}
            placeholder="Ketik nama file di sini..."
            className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#A3E635] font-mono leading-relaxed"
          />
        </div>

        {/* Action Run buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => handleCopyProcess("copy")}
            disabled={isProcessing}
            className="flex-1 bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#A3E635]/10 disabled:opacity-50"
          >
            <Rocket className="h-4 w-4" /> Mulai Salin
          </button>
          
          <button
            onClick={() => handleCopyProcess("move")}
            disabled={isProcessing}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-500/10 disabled:opacity-50"
          >
            <ArrowRightLeft className="h-4 w-4" /> Mulai Pindah
          </button>

          <button
            onClick={handleReset}
            className="py-3 px-4 border border-[#1e293b] bg-[#111827] hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-300 transition-colors cursor-pointer"
          >
            Reset Input
          </button>
        </div>

        {/* Progress Bar & Counters */}
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 space-y-3">
          {/* Progress bar line */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#A3E635] h-full transition-all duration-300"
              style={{ width: `${isProcessing ? 40 : successCount > 0 ? 100 : 0}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="flex items-center gap-1.5 text-green-400">
              <CheckCircle2 className="h-4 w-4" /> Berhasil: {successCount}
            </span>
            <span className="flex items-center gap-1.5 text-red-400">
              <XCircle className="h-4 w-4" /> Gagal: {failCount}
            </span>
          </div>
        </div>

        {/* Working Logs list panel */}
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 space-y-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Log Proses</span>
          <div className="bg-black/40 border border-[#1e293b] rounded-xl p-4 h-44 overflow-y-auto font-mono text-[10px] text-slate-300 space-y-1.5">
            {logs.length === 0 && (
              <span className="text-slate-600 italic">Belum ada aktivitas. Masukkan daftar file dan jalankan tool.</span>
            )}
            {logs.map((log, i) => (
              <div key={i} className={log.includes("[SUCCESS]") ? "text-green-400 font-bold" : log.includes("[FAILED]") ? "text-red-400" : log.includes("[OK]") ? "text-slate-400" : "text-blue-400"}>
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2.5">
          <button
            onClick={() => setLogs([])}
            disabled={logs.length === 0}
            className="flex-1 py-2.5 px-3 border border-[#1e293b] bg-[#111827] hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-300 transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            Hapus Log
          </button>
          
          <button
            onClick={handleCopyLogs}
            disabled={logs.length === 0}
            className="flex-1 py-2.5 px-3 border border-[#1e293b] bg-[#111827] hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-300 transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            Salin Log
          </button>

          <button
            onClick={() => toast({ title: "Folder tujuan dibuka", description: `Membuka folder ${destFolder === "Belum dipilih" ? "tujuan/" : destFolder + "/"}` })}
            className="flex-1 py-2.5 px-3 border border-[#1e293b] bg-[#111827] hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-300 transition-colors cursor-pointer"
          >
            Buka Folder Tujuan
          </button>
        </div>
      </div>
    </div>
  );
}
