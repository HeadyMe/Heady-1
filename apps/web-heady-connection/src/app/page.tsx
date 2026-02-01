export default function Home() {
  return (
    <main style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{ 
        textAlign: 'center', 
        color: 'white',
        padding: '2rem'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          HeadyConnection
        </h1>
        <p style={{ fontSize: '1.25rem', opacity: 0.9 }}>
          Connecting communities through fractal innovation
        </p>
        <div style={{ marginTop: '2rem' }}>
          <span style={{ 
            display: 'inline-block',
            padding: '0.75rem 2rem',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '9999px',
            fontSize: '0.9rem'
          }}>
            🚀 System Ready for Deployment
          </span>
        </div>
      </div>
    </main>
  );
}
