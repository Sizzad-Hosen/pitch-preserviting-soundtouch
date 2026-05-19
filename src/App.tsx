import { useState, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Music,
  Link as LinkIcon,
  Sliders,
  Activity,
  SkipBack,
  SkipForward,
} from "lucide-react";

import { cn } from "../src/lib/utils";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { EffectCard } from "./components/EffectCard";

export default function App() {
  const [url, setUrl] = useState(
    "https://github.com/Sizzad-Hosen/pitch-preserviting-system-with-tonejs/blob/main/public/audio/Alan%20Walker%20%20Faded.mp3"
  );

  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(0.8);

  const {
    isPlaying,
    currentTime,
    duration,
    isLoading,
    error,
    loadAudio,
    seek,
    togglePlay,
    soundTouchRef,
    gainNodeRef,
  } = useAudioPlayer();


  useEffect(() => {
    loadAudio(url, speed, pitch);
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* HEADER */}
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <Activity className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className={cn(
            "w-4 h-6 rounded-full",
            isPlaying ? "bg-green-500  animate-pulse" : "bg-slate-300"
          )} />
        </header>

        {/* URL INPUT */}
        <div className="bg-white p-6 rounded-2xl border">
          <div className="flex gap-2">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 p-3 border rounded-xl"
              placeholder="Audio URL"
            />

            <button
              onClick={() => loadAudio(url, speed, pitch)}
              disabled={isLoading}
              className="bg-indigo-600 text-white px-6 rounded-xl"
            >
              {isLoading ? "Loading..." : "Load"}
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </div>

        {/* PLAYER */}
        <div className="bg-white p-8 rounded-3xl border space-y-6">

          {/* title + time */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Music className="text-indigo-600" />
              <h2 className="font-bold truncate max-w-[250px]">
                {url.split("/").pop()}
              </h2>
            </div>

            <div className="font-mono text-sm bg-indigo-600 text-white px-4 py-2 rounded-xl">
              {Math.floor(currentTime / 60)}:
              {Math.floor(currentTime % 60).toString().padStart(2, "0")}
              {" / "}
              {Math.floor(duration / 60)}:
              {Math.floor(duration % 60).toString().padStart(2, "0")}
            </div>
          </div>

          {/* controls */}
          <div className="flex justify-center items-center gap-6">

            <button onClick={() => seek(0)}>
              <RotateCcw />
            </button>

            <button onClick={() => seek(currentTime - 10)}>
              <SkipBack />
            </button>

            <button
              onClick={togglePlay}
              className="w-20 h-20 bg-indigo-600 text-white rounded-full"
            >
              {isPlaying ? <Pause /> : <Play />}
            </button>

            <button onClick={() => seek(currentTime + 10)}>
              <SkipForward />
            </button>
          </div>

          {/* volume */}
          <div className="flex items-center gap-3">
            <Volume2 />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* EFFECTS */}
        <div className="grid md:grid-cols-2 gap-6">
          <EffectCard
            label="Tempo"
            value={`${speed.toFixed(2)}x`}
            icon={<Sliders />}
            min={0.5}
            max={2}
            step={0.01}
            currentValue={speed}
            onChange={setSpeed}
            onReset={() => setSpeed(1)}
          />

          <EffectCard
            label="Pitch"
            value={`${(Math.log2(pitch) * 12).toFixed(1)} ST`}
            icon={<Activity />}
            min={0.5}
            max={2}
            step={0.01}
            currentValue={pitch}
            onChange={setPitch}
            onReset={() => setPitch(1)}
          />
        </div>

      </div>
    </div>
  );
}