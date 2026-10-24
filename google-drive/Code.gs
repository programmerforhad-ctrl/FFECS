/**
 * Receives photos from the website forms and saves them in YOUR Google Drive.
 * Nothing is stored in Supabase.
 *
 * Setup: see README.md -> "Photo uploads to Google Drive".
 */

// 1) Paste the ID of your Drive folder here.
//    Open the folder in Drive; the URL looks like https://drive.google.com/drive/folders/THIS_PART
var FOLDER_ID = 'PASTE_YOUR_FOLDER_ID_HERE';

var MAX_BYTES = 8 * 1024 * 1024; // 8 MB per photo (the website already shrinks photos to ~0.5 MB)
var ALLOWED = /^image\/(jpeg|png|webp|gif)$/;

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (!ALLOWED.test(d.mime || '')) throw new Error('Only photos are allowed.');

    var bytes = Utilities.base64Decode(d.data || '');
    if (!bytes.length) throw new Error('Empty file.');
    if (bytes.length > MAX_BYTES) throw new Error('Photo is too large.');

    var safeName = String(d.name || 'photo.jpg').replace(/[^\w.\- ]/g, '_').slice(0, 80);
    var stamp = Utilities.formatDate(new Date(), 'Asia/Dhaka', 'yyyy-MM-dd_HH-mm-ss');
    var blob = Utilities.newBlob(bytes, d.mime, stamp + '_' + safeName);

    var file = folderFor(d.folder).createFile(blob);
    return out({ ok: true, url: file.getUrl(), id: file.getId() });
  } catch (err) {
    return out({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

// One sub-folder per form, so photos stay organised.
function folderFor(name) {
  var root = DriveApp.getFolderById(FOLDER_ID);
  var clean = String(name || '').replace(/[^\w \-]/g, '').trim().slice(0, 60);
  if (!clean) return root;
  var it = root.getFoldersByName(clean);
  return it.hasNext() ? it.next() : root.createFolder(clean);
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Opening the web app URL in a browser just shows this message (handy for testing).
function doGet() {
  return out({ ok: true, message: 'Upload service is running.' });
}
