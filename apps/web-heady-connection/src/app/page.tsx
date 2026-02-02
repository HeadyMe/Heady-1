import { SacredContainer, GoldenSpiral, NeuralMesh } from '@heady/ui';
import { LiveStatusOrbs } from '../components/LiveStatusOrbs';

export default function Home() {
  return (
    <SacredContainer variant="cosmic" className="flex flex-col items-center justify-center min-h-screen text-white relative">
      <NeuralMesh className="absolute inset-0 z-0" color="#b794f4" nodeCount={40} />
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 via-purple-900/50 to-black pointer-events-none z-0" />
      
      <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none z-0">
         <GoldenSpiral scale={400} duration={80} color="#b794f4" />
      </div>

      <div className="relative z-10 text-center p-12 backdrop-blur-md bg-white/5 rounded-3xl border border-white/10 shadow-2xl">
        <h1 className="text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
          HeadyConnection
        </h1>
        <p className="text-2xl opacity-90 mb-10 font-light tracking-wide">
          Connecting communities through fractal innovation
        </p>

        <LiveStatusOrbs />

        <div className="mt-8 flex flex-col items-center gap-4">
          <span className="inline-block px-8 py-4 bg-purple-500/20 rounded-full text-purple-200 border border-purple-500/40 shadow-[0_0_20px_rgba(183,148,244,0.3)] backdrop-blur-md text-lg font-medium font-mono">
            🚀 System Ready for Deployment
          </span>
          <p className="text-sm opacity-50 mt-2 font-mono">
            Awaiting HeadyMCP uplink...
          </p>
        </div>
      </div>
    </SacredContainer>
  );
}
