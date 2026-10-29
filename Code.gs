/**
 * ============================================================================
 * SISTEM NOTULEN & BERITA ACARA RAPAT - BACKEND API (GOOGLE APPS SCRIPT)
 * ============================================================================
 * Fitur:
 * 1. Auto-provisioning otomatis: Membuat folder root, subfolder audio,
 *    subfolder lampiran, dan spreadsheet database beserta header secara otomatis.
 * 2. RESTful Web App API (doGet & doPost).
 * 3. Penyimpanan rekaman suara (audio/webm/mp3) langsung ke Google Drive.
 * 4. Penyimpanan dokumen lampiran (PDF/Foto/Doc) langsung ke Google Drive.
 * 5. CRUD Notulen Rapat ke Google Sheets.
 * ============================================================================
 */

// ==========================================
// KONSTANTA SISTEM
// ==========================================
const ROOT_FOLDER_NAME    = "Sistem_Notulen_Rapat";
const AUDIO_FOLDER_NAME   = "Rekaman_Audio";
const DOKUMEN_FOLDER_NAME = "Lampiran_Dokumen";
const DB_SHEET_NAME       = "DB_Notulen_Rapat";
const SHEET_TAB_NAME      = "Data_Rapat";

// Header Kolom Database
const TABLE_HEADERS = [
  "ID",
  "Tanggal",
  "Judul_Rapat",
  "Pimpinan_Rapat",
  "Notulis",
  "Peserta",
  "Agenda",
  "Hasil_Kesepakatan",
  "Tindak_Lanjut",
  "URL_Audio",
  "URL_Lampiran",
  "Waktu_Dibuat"
];

/**
 * Fungsi Pembantu: Mengambil atau membuat sumber daya sistem (Auto-Provisioning)
 * Mencari folder root, subfolder audio & dokumen, serta file spreadsheet database.
 * Jika belum ada, sistem akan membuatnya secara otomatis.
 */
function getOrCreateSystemResources() {
  let rootFolder;
  const rootFolders = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
  
  if (rootFolders.hasNext()) {
    rootFolder = rootFolders.next();
  } else {
    rootFolder = DriveApp.createFolder(ROOT_FOLDER_NAME);
    // Beri deskripsi pada folder
    rootFolder.setDescription("Folder induk penyimpanan database dan berkas Sistem Notulen Rapat");
  }

  // 1. Cek atau buat subfolder Rekaman_Audio
  let audioFolder;
  const audioFolders = rootFolder.getFoldersByName(AUDIO_FOLDER_NAME);
  if (audioFolders.hasNext()) {
    audioFolder = audioFolders.next();
  } else {
    audioFolder = rootFolder.createFolder(AUDIO_FOLDER_NAME);
  }

  // 2. Cek atau buat subfolder Lampiran_Dokumen
  let dokumenFolder;
  const dokumenFolders = rootFolder.getFoldersByName(DOKUMEN_FOLDER_NAME);
  if (dokumenFolders.hasNext()) {
    dokumenFolder = dokumenFolders.next();
  } else {
    dokumenFolder = rootFolder.createFolder(DOKUMEN_FOLDER_NAME);
  }

  // 3. Cek atau buat Spreadsheet Database di dalam rootFolder
  let spreadsheet;
  const sheetFiles = rootFolder.getFilesByName(DB_SHEET_NAME);
  
  if (sheetFiles.hasNext()) {
    const file = sheetFiles.next();
    spreadsheet = SpreadsheetApp.openById(file.getId());
  } else {
    // SpreadsheetApp.create membuat file di Drive Root pengguna
    const newSS = SpreadsheetApp.create(DB_SHEET_NAME);
    const newSSFile = DriveApp.getFileById(newSS.getId());
    
    // Pindahkan ke dalam rootFolder
    newSSFile.moveTo(rootFolder);
    spreadsheet = newSS;
  }

  // 4. Cek atau buat sheet "Data_Rapat" dan inisialisasi header kolom
  let sheet = spreadsheet.getSheetByName(SHEET_TAB_NAME);
  if (!sheet) {
    // Ambil sheet pertama bawaan atau buat sheet baru
    const firstSheet = spreadsheet.getSheets()[0];
    if (firstSheet && firstSheet.getName() === "Sheet1") {
      firstSheet.setName(SHEET_TAB_NAME);
      sheet = firstSheet;
    } else {
      sheet = spreadsheet.insertSheet(SHEET_TAB_NAME);
    }
  }

  // Pastikan baris header terisi dan terformat dengan rapi jika masih kosong
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(TABLE_HEADERS);
    
    // Format Header: Warna Biru Navy (#1E3A8A), Teks Putih Tebal, Freeze Baris 1
    const headerRange = sheet.getRange(1, 1, 1, TABLE_HEADERS.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#1E3A8A");
    headerRange.setFontColor("#FFFFFF");
    headerRange.setHorizontalAlignment("center");
    headerRange.setVerticalAlignment("middle");
    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 35);

    // Auto resize kolom
    for (let c = 1; c <= TABLE_HEADERS.length; c++) {
      sheet.setColumnWidth(c, 160);
    }
  }

  return {
    rootFolder: rootFolder,
    audioFolder: audioFolder,
    dokumenFolder: dokumenFolder,
    spreadsheet: spreadsheet,
    sheet: sheet
  };
}

/**
 * Handler HTTP GET
 * Digunakan untuk:
 * - Mengambil seluruh data rapat (?action=read)
 * - Verifikasi status sistem / testing koneksi (?action=ping atau tanpa parameter)
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "read";

    if (action === "ping") {
      return createJsonResponse({
        status: "success",
        message: "API Sistem Notulen Rapat aktif dan terhubung.",
        timestamp: new Date().toISOString()
      });
    }

    if (action === "read") {
      const resources = getOrCreateSystemResources();
      const sheet = resources.sheet;
      const data = getAllMeetings(sheet);

      return createJsonResponse({
        status: "success",
        data: data,
        total: data.length
      });
    }

    return createJsonResponse({
      status: "error",
      message: "Action GET '" + action + "' tidak dikenali."
    });

  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.toString(),
      stack: error.stack
    });
  }
}

/**
 * Handler HTTP POST
 * Digunakan untuk:
 * - action=read : Membaca seluruh data
 * - action=create : Menyimpan notulen rapat baru
 * - action=upload_audio : Mengunggah audio rekaman Base64 ke folder Rekaman_Audio
 * - action=upload_file : Mengunggah lampiran dokumen Base64 ke folder Lampiran_Dokumen
 * - action=delete : Menghapus data notulen berdasarkan ID
 */
function doPost(e) {
  try {
    // Validasi payload
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({
        status: "error",
        message: "Payload POST kosong. Kirimkan JSON pada body request."
      });
    }

    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const resources = getOrCreateSystemResources();

    // 1. ACTION: BACA DATA
    if (action === "read") {
      const data = getAllMeetings(resources.sheet);
      return createJsonResponse({
        status: "success",
        data: data,
        total: data.length
      });
    }

    // 2. ACTION: UNGGAH REKAMAN AUDIO
    if (action === "upload_audio") {
      if (!payload.base64Data) {
        throw new Error("Parameter base64Data audio tidak ditemukan.");
      }

      const fileName = payload.fileName || ("Rekaman_Rapat_" + formatTimestampForFilename(new Date()) + ".webm");
      const mimeType = payload.mimeType || "audio/webm";
      
      const fileUrl = saveBase64File(resources.audioFolder, payload.base64Data, fileName, mimeType);

      return createJsonResponse({
        status: "success",
        message: "Audio rekaman rapat berhasil disimpan ke Google Drive.",
        fileUrl: fileUrl,
        fileName: fileName
      });
    }

    // 3. ACTION: UNGGAH LAMPIRAN DOKUMEN / FOTO
    if (action === "upload_file") {
      if (!payload.base64Data) {
        throw new Error("Parameter base64Data dokumen tidak ditemukan.");
      }

      const fileName = payload.fileName || ("Lampiran_Rapat_" + formatTimestampForFilename(new Date()) + ".pdf");
      const mimeType = payload.mimeType || "application/octet-stream";

      const fileUrl = saveBase64File(resources.dokumenFolder, payload.base64Data, fileName, mimeType);

      return createJsonResponse({
        status: "success",
        message: "Lampiran dokumen berhasil disimpan ke Google Drive.",
        fileUrl: fileUrl,
        fileName: fileName
      });
    }

    // 4. ACTION: BUAT NOTULEN BARU (CREATE)
    if (action === "create") {
      const meetingData = payload.data;
      if (!meetingData) {
        throw new Error("Parameter data rapat tidak ditemukan.");
      }

      // Generate ID Unik: NOT-YYYYMMDD-XXXX
      const id = meetingData.id || generateMeetingId();
      const nowIso = new Date().toISOString();

      const newRow = [
        id,
        meetingData.tanggal || formatDateIndo(new Date()),
        meetingData.judulRapat || "Rapat Tanpa Judul",
        meetingData.pimpinanRapat || "-",
        meetingData.notulis || "-",
        meetingData.peserta || "-",
        meetingData.agenda || "-",
        meetingData.hasilKesepakatan || "-",
        meetingData.tindakLanjut || "-",
        meetingData.urlAudio || "",
        meetingData.urlLampiran || "",
        nowIso
      ];

      resources.sheet.appendRow(newRow);

      return createJsonResponse({
        status: "success",
        message: "Notulen rapat berhasil disimpan ke database.",
        id: id,
        data: {
          id: id,
          tanggal: newRow[1],
          judulRapat: newRow[2],
          pimpinanRapat: newRow[3],
          notulis: newRow[4],
          peserta: newRow[5],
          agenda: newRow[6],
          hasilKesepakatan: newRow[7],
          tindakLanjut: newRow[8],
          urlAudio: newRow[9],
          urlLampiran: newRow[10],
          waktuDibuat: newRow[11]
        }
      });
    }

    // 5. ACTION: HAPUS NOTULEN (DELETE)
    if (action === "delete") {
      const targetId = payload.id;
      if (!targetId) {
        throw new Error("Parameter 'id' wajib disertakan untuk penghapusan.");
      }

      const sheet = resources.sheet;
      const lastRow = sheet.getLastRow();

      if (lastRow <= 1) {
        return createJsonResponse({
          status: "error",
          message: "Database kosong."
        });
      }

      const idRange = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      let rowIndexToDelete = -1;

      for (let i = 0; i < idRange.length; i++) {
        if (String(idRange[i][0]).trim() === String(targetId).trim()) {
          rowIndexToDelete = i + 2; // offset header baris 1
          break;
        }
      }

      if (rowIndexToDelete !== -1) {
        sheet.deleteRow(rowIndexToDelete);
        return createJsonResponse({
          status: "success",
          message: "Data notulen dengan ID " + targetId + " berhasil dihapus."
        });
      } else {
        return createJsonResponse({
          status: "error",
          message: "Data notulen dengan ID " + targetId + " tidak ditemukan."
        });
      }
    }

    return createJsonResponse({
      status: "error",
      message: "Action POST '" + action + "' tidak dikenali."
    });

  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.toString(),
      stack: error.stack
    });
  }
}

// ==========================================
// FUNGSI PENDUKUNG (HELPERS)
// ==========================================

/**
 * Mengambil seluruh data rapat dari spreadsheet dan memetakannya ke Array of Object
 */
function getAllMeetings(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return [];
  }

  const values = sheet.getRange(2, 1, lastRow - 1, TABLE_HEADERS.length).getValues();
  const result = [];

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    result.push({
      id: row[0],
      tanggal: row[1],
      judulRapat: row[2],
      pimpinanRapat: row[3],
      notulis: row[4],
      peserta: row[5],
      agenda: row[6],
      hasilKesepakatan: row[7],
      tindakLanjut: row[8],
      urlAudio: row[9],
      urlLampiran: row[10],
      waktuDibuat: row[11]
    });
  }

  // Urutkan dari yang terbaru (LIFO)
  return result.reverse();
}

/**
 * Menyimpan data Base64 menjadi file di Google Drive folder tertentu
 * Mengatur hak akses file agar dapat dilihat oleh pengguna yang memiliki link
 */
function saveBase64File(folder, base64Data, fileName, mimeType) {
  // Bersihkan header Data URL jika ada (misal: "data:audio/webm;base64,...")
  let cleanBase64 = base64Data;
  if (cleanBase64.indexOf(",") > -1) {
    cleanBase64 = cleanBase64.split(",")[1];
  }

  const decoded = Utilities.base64Decode(cleanBase64);
  const blob = Utilities.newBlob(decoded, mimeType, fileName);
  const file = folder.createFile(blob);

  // Set file agar bisa dilihat/diakses via tautan
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (err) {
    // Abaikan jika akun organisasi melarang share publik
  }

  return file.getUrl();
}

/**
 * Membuat respons JSON dengan header CORS yang tepat
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Generator ID Unik Rapat: NOT-YYYYMMDD-XXXX
 */
function generateMeetingId() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return "NOT-" + y + m + d + "-" + rand;
}

/**
 * Format timestamp untuk penamaan berkas
 */
function formatTimestampForFilename(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return y + m + day + "_" + h + min + s;
}

/**
 * Format tanggal Indonesia standar (DD/MM/YYYY)
 */
function formatDateIndo(d) {
  const day = String(d.getDate()).padStart(2, "0");
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const y = d.getFullYear();
  return day + "/" + m + "/" + y;
}

/**
 * Fungsi Pengujian Mandiri (Manual Test di Google Apps Script Editor)
 * Klik 'run' pada fungsi ini di editor Apps Script untuk memicu inisialisasi awal
 */
function manualInitialSetupTest() {
  const resources = getOrCreateSystemResources();
  Logger.log("=== SETUP BERHASIL ===");
  Logger.log("Root Folder ID      : " + resources.rootFolder.getId());
  Logger.log("Audio Folder ID     : " + resources.audioFolder.getId());
  Logger.log("Dokumen Folder ID   : " + resources.dokumenFolder.getId());
  Logger.log("Spreadsheet ID      : " + resources.spreadsheet.getId());
  Logger.log("Spreadsheet URL     : " + resources.spreadsheet.getUrl());
  Logger.log("Sheet Name          : " + resources.sheet.getName());
}
