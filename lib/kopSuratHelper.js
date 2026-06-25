export async function loadImageAsBase64(url) {
  if (!url) return null
  let fullUrl = url
  if (url.startsWith('/')) {
    fullUrl = (typeof window !== 'undefined' ? window.location.origin : '') + url
  }
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.referrerPolicy = 'no-referrer'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      } catch (e) {
        console.warn('Gagal konversi gambar ke base64:', e)
        resolve(null)
      }
    }
    img.onerror = () => {
      console.warn('Gagal load gambar untuk KOP:', fullUrl)
      resolve(null)
    }
    img.src = fullUrl
  })
}

export async function generateKopSuratHTML(settings) {
  settings = settings || {}
  const logoDinasBase64 = await loadImageAsBase64(settings.kop_logo_dinas)
  const logoSekolahBase64 = await loadImageAsBase64(settings.kop_logo_sekolah)

  const logoDinasHtml = logoDinasBase64
    ? '<img src="' + logoDinasBase64 + '" style="width:80px;height:80px;object-fit:contain;" />'
    : '<div style="width:80px;height:80px;display:flex;align-items:center;justify-content:center;border:1px dashed #bbb;color:#999;font-size:7px;text-align:center;line-height:1.3;">LOGO<br/>DINAS</div>'

  const logoSekolahHtml = logoSekolahBase64
    ? '<img src="' + logoSekolahBase64 + '" style="width:80px;height:80px;object-fit:contain;" />'
    : '<div style="width:80px;height:80px;display:flex;align-items:center;justify-content:center;border:1px dashed #bbb;color:#999;font-size:7px;text-align:center;line-height:1.3;">LOGO<br/>SEKOLAH</div>'

  const namaSekolah = (settings.nama_sekolah || 'SEKOLAH MENENGAH KEJURUAN NEGERI 1 CIKEDUNG').toUpperCase()
  const alamat = settings.alamat || 'Jl. Raya Cikedung - Jatibarang Km 05 Kec. Cikedung Kab. Indramayu 45262'

  return '<div style="display:flex;justify-content:space-between;align-items:center;width:100%;margin-bottom:10px;">' +
    '<div style="width:80px;height:80px;flex-shrink:0;">' + logoDinasHtml + '</div>' +
    '<div style="text-align:center;flex:1;padding:0 15px;">' +
      '<p style="margin:0;font-size:12px;">PEMERINTAH DAERAH PROVINSI JAWA BARAT</p>' +
      '<p style="margin:0;font-size:12px;font-weight:bold;">DINAS PENDIDIKAN</p>' +
      '<p style="margin:0;font-size:13px;font-weight:bold;">CABANG DINAS PENDIDIKAN WILAYAH IX</p>' +
      '<p style="margin:2px 0 0 0;font-size:15px;font-weight:bold;">' + namaSekolah + '</p>' +
      '<p style="margin:2px 0 0 0;font-size:9px;">' + alamat + '</p>' +
      '<p style="margin:0;font-size:9px;">Telp. (0234) 5500198 | Website: www.smnk1cikedung.sch.id | Email: smkn1cikedung@rocketmail.com</p>' +
    '</div>' +
    '<div style="width:80px;height:80px;flex-shrink:0;">' + logoSekolahHtml + '</div>' +
  '</div>' +
  '<hr style="border:2px solid black;margin-top:5px;margin-bottom:15px;" />'
}