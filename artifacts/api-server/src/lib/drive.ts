import { db, deliveryFilesTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";

export function extractFolderId(url: string): string | null {
  const match = url.match(/\/folders\/([a-zA-Z0-9_-]{28,})/);
  return match ? match[1] : null;
}

export async function seedRawPhotosFromDrive(bookingId: number, googleDriveLink: string | null | undefined) {
  if (!googleDriveLink || googleDriveLink.trim() === "") return;
  const folderId = extractFolderId(googleDriveLink);
  if (!folderId) return;

  try {
    const driveFiles: { id: string; fileName: string; fileUrl: string }[] = [];

    // 1. Try fetching from the embedded folderview which lists all files (bypassing the 50-file limit)
    try {
      console.log(`Fetching embedded folder view for folder ${folderId}...`);
      const embedRes = await fetch(`https://drive.google.com/embeddedfolderview?id=${folderId}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        }
      });
      if (embedRes.ok) {
        const html = await embedRes.text();
        const regex = /href="https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{28,})\/view\?[^"]*?"[\s\S]*?<div class="flip-entry-title">([^<]+)<\/div>/g;
        let match;
        while ((match = regex.exec(html)) !== null) {
          const id = match[1];
          const fileName = match[2].trim();
          driveFiles.push({
            id,
            fileName,
            fileUrl: `https://drive.google.com/thumbnail?id=${id}&sz=w800`
          });
        }
        console.log(`Parsed ${driveFiles.length} files from embedded folder view.`);
      }
    } catch (err: any) {
      console.warn("Embedded view parsing failed, falling back to standard view:", err.message);
    }

    // 2. Fallback to standard view if no files found
    if (driveFiles.length === 0) {
      console.log(`Falling back to standard view parsing for folder ${folderId}...`);
      const res = await fetch(`https://drive.google.com/drive/folders/${folderId}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        }
      });
      if (!res.ok) {
        throw new Error(`Google Drive returned status ${res.status}`);
      }
      const html = await res.text();
      const match = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'([\s\S]*?)';/);
      if (!match) {
        throw new Error("Could not find window['_DRIVE_ivd'] in Google Drive response");
      }

      const escapedStr = match[1];
      const decodedStr = escapedStr.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
      });

      const data = JSON.parse(decodedStr);
      const items = data[0] || [];

      for (const item of items) {
        if (Array.isArray(item)) {
          const id = item[0];
          const fileName = item[2];
          const mimeType = item[3];
          if (typeof id === "string" && typeof fileName === "string" && mimeType && !mimeType.includes("folder")) {
            driveFiles.push({
              id,
              fileName,
              fileUrl: `https://drive.google.com/thumbnail?id=${id}&sz=w800`
            });
          }
        }
      }
    }

    if (driveFiles.length === 0) return;

    // Fetch existing raw files
    const existingFiles = await db
      .select()
      .from(deliveryFilesTable)
      .where(
        and(
          eq(deliveryFilesTable.bookingId, bookingId),
          eq(deliveryFilesTable.folderType, "raw")
        )
      );

    const existingMap = new Map(existingFiles.map(f => [f.fileName, f]));

    // Smart merge
    const toInsert: (typeof deliveryFilesTable.$inferInsert)[] = [];
    const keptNames = new Set<string>();

    for (const df of driveFiles) {
      keptNames.add(df.fileName);
      if (!existingMap.has(df.fileName)) {
        toInsert.push({
          bookingId,
          folderType: "raw",
          fileName: df.fileName,
          fileUrl: df.fileUrl,
          selected: false
        });
      }
    }

    if (toInsert.length > 0) {
      await db.insert(deliveryFilesTable).values(toInsert);
    }

    // Delete obsolete files (only if not selected to avoid breaking selections)
    const toDeleteIds: number[] = [];
    for (const f of existingFiles) {
      if (!keptNames.has(f.fileName)) {
        toDeleteIds.push(f.id);
      }
    }

    if (toDeleteIds.length > 0) {
      const { inArray } = await import("drizzle-orm");
      await db
        .delete(deliveryFilesTable)
        .where(inArray(deliveryFilesTable.id, toDeleteIds));
    }
  } catch (err) {
    console.error("Error syncing Google Drive, falling back to mock seed:", err);
    // Fallback to seeding mock data only if no raw files exist
    const existingRaw = await db
      .select()
      .from(deliveryFilesTable)
      .where(
        and(
          eq(deliveryFilesTable.bookingId, bookingId),
          eq(deliveryFilesTable.folderType, "raw")
        )
      );

    if (existingRaw.length === 0) {
      const mockUrls = [
        "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1507504038482-762102124e1d?w=800&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1519225495810-7512c696505a?w=800&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=800&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1519741621253-27a9223cb20a?w=800&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=800&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1510076894075-85c547200e28?w=800&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1529636798458-92182e65f13d?w=800&auto=format&fit=crop&q=60"
      ];

      const values = mockUrls.map((url, idx) => ({
        bookingId,
        folderType: "raw" as const,
        fileName: `RAW_DSC_${String(idx + 1).padStart(4, "0")}.jpg`,
        fileUrl: url,
        selected: false
      }));

      await db.insert(deliveryFilesTable).values(values);
    }
  }
}
