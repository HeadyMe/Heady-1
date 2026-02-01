export default function Home() {
  return (
    <main style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
    }}>
      <div style={{ 
        textAlign: 'center', 
        color: 'white',
        padding: '2rem'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          HeadySystems
        </h1>
        <p style={{ fontSize: '1.25rem', opacity: 0.9 }}>
          Enterprise Automation Platform
        </p>
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <span style={{ 
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            background: 'rgba(99, 102, 241, 0.8)',
            borderRadius: '8px',
            fontSize: '0.9rem'
          }}>
            🤖 Automation IDE
          </span>
          <span style={{ 
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            background: 'rgba(16, 185, 129, 0.8)',
            borderRadius: '8px',
            fontSize: '0.9rem'
          }}>
            ✅ System Online
          </span>
        </div>
      </div>
    </main>
  );
}
