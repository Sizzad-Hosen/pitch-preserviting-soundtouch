import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Volume2, Music, Link as LinkIcon, Sliders, Activity, SkipBack, SkipForward, ZoomIn, ZoomOut, Scissors } from "lucide-react";
import { cn } from "../src/lib/utils";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { AudioVisualizer } from "./components/AudioVisualizer";
import { EffectCard } from "./components/EffectCard";

export default function App() {
  const [url, setUrl] = useState("https://github.com/Sizzad-Hosen/pitch-preserviting-system-with-tonejs/blob/main/public/audio/Alan%20Walker%20%20Faded.mp3");
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(0.8);
  const [zoom, setZoom] = useState(20);
  const [region, setRegion] = useState<{ start: number; end: number } | null>(null);

  const {
    isPlaying,
    currentTime,
    duration,
    isLoading,
    setIsLoading,
    error,
    isReady,
    setIsReady,
    loadAudio,
    setWavesurfer,
    seek,
    togglePlay,
    wavesurferRef,
    soundTouchRef,
    gainNodeRef
  } = useAudioPlayer();

  const handleLoad = () => loadAudio(url, speed, pitch);

  useEffect(() => {
    handleLoad();
  }, []);

  useEffect(() => {
    if (soundTouchRef.current) soundTouchRef.current.tempo = speed;
  }, [speed]);

  useEffect(() => {
    if (soundTouchRef.current) soundTouchRef.current.pitch = pitch;
  }, [pitch]);

  useEffect(() => {
    if (gainNodeRef.current) gainNodeRef.current.gain.value = volume;
  }, [volume]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-12 overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100">
              <Activity className="w-5 h-5 text-white" />
            </div>
    
          </div>
          <div className="hidden md:flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Engine Status</span>
            <div className={cn("w-2 h-2 rounded-full", isPlaying ? "bg-green-500 animate-pulse" : "bg-slate-300")} />
          </div>
        </header>

        <main className="space-y-8">
          {/* URL Input Area */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200">
            <div className="flex flex-col gap-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <LinkIcon className="w-3 h-3" /> Input Source
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                  placeholder="Enter audio URL (.mp3, .wav)..."
                />
                <button
                  onClick={handleLoad}
                  disabled={isLoading}
                  className="bg-indigo-600 text-white rounded-2xl px-8 py-4 text-sm font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest"
                >
                  {isLoading ? "Analyzing..." : "Initialize"}
                </button>
              </div>
              {error && <p className="text-red-500 text-xs font-bold bg-red-50 px-4 py-3 rounded-xl border border-red-100 mt-2">{error}</p>}
            </div>
          </div>

          {/* Main Visualizer & Controls */}
          <div className={cn(
            "transition-all duration-700 space-y-6",
            !duration && "opacity-40 grayscale pointer-events-none translate-y-4"
          )}>
            <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                    <Music className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-800 truncate max-w-[200px] md:max-w-md block">
                      {url.split('/').pop() || "Audio Stream"}
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Web Engine Connected</p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-3">
               
                  <div className="font-mono text-xs font-black bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-indigo-100">
                    {Math.floor(currentTime/60)}:{(Math.floor(currentTime%60)).toString().padStart(2, '0')}
                    <span className="mx-1 text-indigo-300">/</span>
                    {Math.floor(duration/60)}:{(Math.floor(duration%60)).toString().padStart(2, '0')}
                  </div>
                </div>
              </div>

              <AudioVisualizer 
                zoom={zoom}
                onSeek={seek}
                onUnmount={() => {
                  setWavesurfer(null);
                }}
                onReady={(ws, rg) => {
                  setWavesurfer(ws);
                  setIsReady(true);
                  setIsLoading(false);
                  rg.on('region-created', (r: any) => {
                    rg.getRegions().forEach((reg: any) => reg !== r && reg.remove());
                    setRegion({ start: r.start, end: r.end });
                  });
                  rg.on('region-updated', (r: any) => setRegion({ start: r.start, end: r.end }));
                }}
              />

              <div className="flex flex-col md:flex-row items-center justify-between gap-8 max-w-3xl mx-auto pt-6">
                <button onClick={() => seek(0)} className="p-4 text-slate-300 hover:text-indigo-600 transition-all hover:bg-slate-50 rounded-2xl"><RotateCcw className="w-6 h-6" /></button>
                
                <div className="flex items-center gap-6">
                  <button onClick={() => seek(currentTime - 10)} className="p-5 bg-white border border-slate-100 rounded-full text-slate-400 hover:text-indigo-600 shadow-sm transition-all active:scale-90"><SkipBack className="w-6 h-6 fill-current" /></button>
                  <button 
                    onClick={togglePlay}
                    className="w-24 h-24 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-[0_20px_50px_rgba(99,102,241,0.25)] hover:scale-105 active:scale-95 transition-all outline-none border-8 border-white"
                  >
                    {isPlaying ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-1" />}
                  </button>
                  <button onClick={() => seek(currentTime + 10)} className="p-5 bg-white border border-slate-100 rounded-full text-slate-400 hover:text-indigo-600 shadow-sm transition-all active:scale-90"><SkipForward className="w-6 h-6 fill-current" /></button>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
                  <Volume2 className="w-4 h-4 text-slate-400" />
                  <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-24 h-1.5 bg-slate-200 appearance-none rounded-full accent-indigo-600" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <EffectCard 
                label="Tempo Shifting" 
                value={`${speed.toFixed(2)}x`} 
                icon={<Sliders className="w-4 h-4" />}
                min={0.5} max={2} step={0.01}
                currentValue={speed}
                onChange={setSpeed}
                onReset={() => setSpeed(1.0)}
              />
              <EffectCard 
                label="Spectral Pitch" 
                value={`${(Math.log2(pitch) * 12).toFixed(1)} ST`} 
                icon={<Activity className="w-4 h-4" />}
                min={0.5} max={2} step={0.01}
                currentValue={pitch}
                onChange={setPitch}
                onReset={() => setPitch(1.0)}
              />
            </div>
            
            {region && (
              <div className="mt-4 p-5 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-100 flex items-center justify-between text-white animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
                    <Scissors className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Cut Region Selection</p>
                    <p className="text-sm font-black tracking-tight">{region.start.toFixed(2)}s — {region.end.toFixed(2)}s</p>
                  </div>
                </div>
                <button 
                  onClick={() => seek(region.start)} 
                  className="bg-white text-indigo-600 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all shadow-lg"
                >
                  Loop Selection
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
