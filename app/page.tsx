export default function Home() {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#1e40af', marginBottom: '10px' }}>
          SIPANDU
        </h1>
        <p style={{ color: '#4b5563', fontSize: '1.2rem', marginBottom: '30px' }}>
          Sistem Informasi Pendataan Siswa
        </p>
        <button style={{ backgroundColor: '#2563eb', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', fontSize: '1rem', cursor: 'pointer' }}>
          Masuk ke Dashboard
        </button>
      </div>
    </main>
  )
}