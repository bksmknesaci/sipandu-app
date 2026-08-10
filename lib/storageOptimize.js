// lib/storageOptimize.js
/**
 * Storage Optimization Utilities untuk SIPANDU
 * Mengurangi Cache Egress Supabase dengan:
 * 1. Menambahkan cacheControl pada URL Storage → browser cache lokal
 * 2. Kompresi gambar agresif sebelum upload → ukuran file lebih kecil
 * 3. Helper lazy loading untuk tag <img>
 */

// ============================================================
// 1. URL OPTIMIZATION — cacheControl pada Storage URL
//    Browser menyimpan gambar secara lokal, kunjungan berikutnya = 0 egress
// ============================================================

/**
 * Tambahkan parameter cacheControl pada URL Supabase Storage
 * @param {string|null} url
 * @param {number} cacheSeconds - durasi cache dalam detik
 * @returns {string|null}
 */
export function addCacheControl(url, cacheSeconds = 86400) {
  if (!url) return null;
  if (url.includes('/storage/v1/object/public/')) {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}cacheControl=${cacheSeconds}`;
  }
  return url;
}

/**
 * URL untuk thumbnail kecil (kartu, tabel, avatar) — cache 7 hari
 */
export function getThumbUrl(url) {
  return addCacheControl(url, 604800);
}

/**
 * URL untuk gambar menengah (modal detail, preview) — cache 24 jam
 */
export function getMediumUrl(url) {
  return addCacheControl(url, 86400);
}

/**
 * URL untuk gambar penuh (fullscreen zoom) — cache 1 jam
 */
export function getFullUrl(url) {
  return addCacheControl(url, 3600);
}

// SVG placeholder abu-abu (data URI, tidak hit Storage)
const PLACEHOLDER_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' fill='none'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='sans-serif' font-size='14'%3ETidak ada gambar%3C/text%3E%3C/svg%3E";

/**
 * Mendapatkan URL gambar yang sudah dioptimasi, kompatibel dengan getImageUrl() yang sudah ada
 * @param {string|null} url
 * @param {'thumb'|'medium'|'full'} type
 * @returns {string}
 */
export function getOptimizedImageUrl(url, type = 'thumb') {
  if (!url) return PLACEHOLDER_SVG;

  let finalUrl = url;

  // Handle path relatif → URL lengkap
  if (url.startsWith('/storage/')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) finalUrl = `${supabaseUrl}${url}`;
  }

  switch (type) {
    case 'thumb':  return getThumbUrl(finalUrl);
    case 'medium': return getMediumUrl(finalUrl);
    case 'full':   return getFullUrl(finalUrl);
    default:       return addCacheControl(finalUrl);
  }
}

// ============================================================
// 2. IMAGE COMPRESSION — kurangi ukuran file sebelum upload
// ============================================================

/**
 * Kompresi gambar di sisi klien (browser) sebelum upload ke Storage
 * @param {File|Blob} file
 * @param {object} opts
 * @returns {Promise<Blob>}
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 600,
    maxHeight = 600,
    quality = 0.7,
    outputType = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('Gagal kompres gambar')),
          outputType,
          quality
        );
      };
      img.onerror = () => reject(new Error('Gagal memuat gambar'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Gagal baca file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Preset kompresi untuk setiap tipe upload SIPANDU
 */
export const COMPRESSION_PRESETS = {
  // Selfie PKL — dilihat sekali lalu auto-hapus >1 hari, tidak perlu HD
  pklSelfie: {
    maxWidth: 480,
    maxHeight: 640,
    quality: 0.55,
    outputType: 'image/jpeg'
  },
  // Bukti sakit/izin — perlu cukup jelas untuk verifikasi WK
  buktiSakitIzin: {
    maxWidth: 540,
    maxHeight: 720,
    quality: 0.6,
    outputType: 'image/jpeg'
  },
  // Cover berita — tampil di dashboard semua user, harus kecil
  newsCover: {
    maxWidth: 800,
    maxHeight: 600,
    quality: 0.72,
    outputType: 'image/jpeg'
  },
  // Foto profil user — avatar kecil
  profilPhoto: {
    maxWidth: 200,
    maxHeight: 200,
    quality: 0.65,
    outputType: 'image/jpeg'
  },
  // Dokumen penanganan (SP)
  dokumenPenanganan: {
    maxWidth: 700,
    maxHeight: 900,
    quality: 0.65,
    outputType: 'image/jpeg'
  },
  // Bukti formulir (SNBP/SNBT, tracer)
  buktiFormulir: {
    maxWidth: 700,
    maxHeight: 900,
    quality: 0.65,
    outputType: 'image/jpeg'
  },
  // Logo jurusan — ikon kecil
  logoJurusan: {
    maxWidth: 120,
    maxHeight: 120,
    quality: 0.75,
    outputType: 'image/png'
  }
};

// ============================================================
// 3. LAZY LOADING HELPERS
// ============================================================

/**
 * Props siap spread ke <img> untuk lazy loading + cache + fade-in
 * @param {string|null} url
 * @param {'thumb'|'medium'|'full'} type
 * @param {string} alt
 * @returns {object}
 */
export function getLazyImgProps(url, type = 'thumb', alt = '') {
  return {
    src: getOptimizedImageUrl(url, type),
    alt,
    loading: 'lazy',
    decoding: 'async',
    referrerPolicy: 'no-referrer',
    style: { opacity: 0, transition: 'opacity 0.3s ease' },
    onLoad: (e) => { e.target.style.opacity = 1; }
  };
}