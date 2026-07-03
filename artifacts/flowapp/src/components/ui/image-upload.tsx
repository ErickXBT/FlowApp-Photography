import { useRef, useState } from "react";
import { Upload, Link as LinkIcon, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  className?: string;
}

export function ImageUpload({ label, value, onChange, accept = "image/*", className = "" }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<"url" | "file">("url");
  const [error, setError] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", credentials: "include", body: fd });
      if (!res.ok) throw new Error("Upload gagal");
      const { url } = await res.json();
      onChange(url);
    } catch (err: any) {
      setError(err.message ?? "Upload gagal");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-gray-300 text-xs">{label}</Label>

      {/* Mode switcher */}
      <div className="flex gap-1 mb-2">
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${mode === "url" ? "bg-[#A3E635]/20 text-[#A3E635]" : "text-gray-500 hover:text-gray-300"}`}
        >
          <LinkIcon className="h-3 w-3" /> URL
        </button>
        <button
          type="button"
          onClick={() => setMode("file")}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${mode === "file" ? "bg-[#A3E635]/20 text-[#A3E635]" : "text-gray-500 hover:text-gray-300"}`}
        >
          <Upload className="h-3 w-3" /> Upload
        </button>
      </div>

      {mode === "url" ? (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="bg-[#111827] border-[#4B5563] text-white text-sm"
        />
      ) : (
        <div>
          <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
          <div className="flex gap-2 items-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="border-[#4B5563] text-gray-300 hover:text-white text-xs"
            >
              {uploading ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Uploading...</> : <><Upload className="h-3 w-3 mr-1" /> Pilih File</>}
            </Button>
            {value && (
              <div className="flex-1 flex items-center gap-2 bg-[#111827] border border-[#4B5563] rounded px-2 py-1">
                <span className="text-xs text-gray-400 truncate flex-1">{value.split("/").pop()}</span>
                <button type="button" onClick={() => onChange("")} className="text-gray-500 hover:text-red-400">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview */}
      {value && /\.(jpg|jpeg|png|gif|webp)$/i.test(value) && (
        <img src={value} alt="preview" className="h-16 w-24 object-cover rounded border border-[#374151]" />
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
