import { SacredContainer, GoldenSpiral, FractalGrid } from '@heady/ui';
import { LiveStatusOrbs } from '../components/LiveStatusOrbs';

export default function Home() {
  return (
    <SacredContainer variant="cosmic" className="flex flex-col items-center justify-center min-h-screen text-white relative">
      <FractalGrid className="absolute inset-0 z-0" color="#4fd1c5" density={30} />
      
      <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none z-0">
         <GoldenSpiral scale={300} duration={60} color="#4fd1c5" />
      </div>

      <div className="relative z-10 text-center p-8 backdrop-blur-sm bg-black/20 rounded-2xl border border-white/10 shadow-2xl">
        <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-blue-500">
          HeadySystems
        </h1>
        <p className="text-xl opacity-90 mb-8 max-w-md mx-auto">
          Advanced Automation & Node Orchestration
        </p>

        <LiveStatusOrbs />

        <div className="mt-8">
          <span className="inline-block px-8 py-3 bg-teal-500/20 rounded-full text-teal-200 border border-teal-500/40 shadow-[0_0_15px_rgba(79,209,197,0.3)] backdrop-blur-md font-mono">
            🚀 System Operational
          </span>
        </div>
      </div>
    </SacredContainer>
  );
}
