import { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
// @ts-ignore
import { SoundTouch, SimpleFilter } from "soundtouchjs";

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const durationRef = useRef(0);
  const isPlayingRef = useRef(false);
  const currentTimeRef = useRef(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const filterRef = useRef<any>(null);
  const soundTouchRef = useRef<any>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const scriptNodeRef = useRef<ScriptProcessorNode | null>(null);

  const isWsReadyRef = useRef(false);

  const initEngine = useCallback((audioBuffer: AudioBuffer, speed: number, pitch: number) => {
    isWsReadyRef.current = false;
    if (scriptNodeRef.current) scriptNodeRef.current.disconnect();
    
    const ctx = audioContextRef.current!;
    const st = new SoundTouch();
    st.tempo = speed;
    st.pitch = pitch;
    soundTouchRef.current = st;

    const source = {
      extract: (target: Float32Array, numFrames: number, offset: number) => {
        const left = audioBuffer.getChannelData(0);
        const right = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : left;
        const framesToRead = Math.min(numFrames, left.length - offset);
        
        for (let i = 0; i < framesToRead; i++) {
          target[i * 2] = left[i + offset] || 0;
          target[i * 2 + 1] = right[i + offset] || 0;
        }
        return framesToRead;
      }
    };

    const filter = new SimpleFilter(source, st);
    filterRef.current = filter;

    const scriptNode = ctx.createScriptProcessor(4096, 2, 2);
    scriptNodeRef.current = scriptNode;

    const gainNode = ctx.createGain();
    gainNodeRef.current = gainNode;

    scriptNode.onaudioprocess = (e) => {
      const left = e.outputBuffer.getChannelData(0);
      const right = e.outputBuffer.getChannelData(1);
      
      try {
        if (!filterRef.current || !soundTouchRef.current) return;
        
        if (isPlayingRef.current) {
          const combined = new Float32Array(left.length * 2);
          const framesRead = filterRef.current.extract(combined, left.length);

          if (framesRead > 0) {
            for (let i = 0; i < framesRead; i++) {
              left[i] = combined[i * 2];
              right[i] = combined[i * 2 + 1];
            }
          }

          const pos = filterRef.current.sourcePosition !== undefined ? filterRef.current.sourcePosition : filterRef.current.position;
          const time = pos / ctx.sampleRate;
          currentTimeRef.current = time;
          setCurrentTime(time);
          
          if (wavesurferRef.current && isWsReadyRef.current) {
            requestAnimationFrame(() => {
              if (!isWsReadyRef.current || !wavesurferRef.current) return;
              try { 
                const ws = wavesurferRef.current;
                if (ws && (ws as any).decodedData) {
                  ws.setTime(time);
                } else if (ws.getDuration() > 0) {
                  ws.setTime(time);
                }
              } catch(e) {
                // Silently ignore WaveSurfer state issues during playback
              }
            });
          }

          if (framesRead === 0 && durationRef.current > 0 && time >= durationRef.current - 0.1) {
            setIsPlaying(false);
            isPlayingRef.current = false;
            ctx.suspend();
          }
        } else {
          // If not playing, output silence to avoid buffer buzzing
          left.fill(0);
          right.fill(0);
        }
      } catch (err) {
        console.error("onaudioprocess error:", err);
        if (soundTouchRef.current?.clear) soundTouchRef.current.clear();
      }
    };

    scriptNode.connect(gainNode);
    gainNode.connect(ctx.destination);
    ctx.suspend();
  }, []);

  const lastBufferRef = useRef<ArrayBuffer | null>(null);

  const loadAudio = async (url: string, speed: number, pitch: number) => {
    setIsLoading(true);
    setError(null);
    setIsReady(false);
    isWsReadyRef.current = false;

    try {
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch audio: ${response.status} ${text}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log(`Fetched buffer size: ${arrayBuffer.byteLength} bytes`);
      if (arrayBuffer.byteLength === 0) throw new Error("Fetched audio buffer is empty");
      
      lastBufferRef.current = arrayBuffer;
      
      if (audioContextRef.current) {
        try {
          await audioContextRef.current.close();
        } catch (e) {
          console.warn("Error closing audio context:", e);
        }
      }
      
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;

      console.log("Decoding audio data...");
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      console.log("Audio decoded successfully", {
        duration: audioBuffer.duration,
        channels: audioBuffer.numberOfChannels,
        sampleRate: audioBuffer.sampleRate
      });
      
      setDuration(audioBuffer.duration);
      durationRef.current = audioBuffer.duration;

      if (wavesurferRef.current) {
        const blob = new Blob([arrayBuffer]);
        wavesurferRef.current.load(URL.createObjectURL(blob));
      }

      initEngine(audioBuffer, speed, pitch);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const setWavesurfer = useCallback((ws: WaveSurfer | null) => {
    wavesurferRef.current = ws;
    if (ws && lastBufferRef.current) {
      try {
        // Only load if not already loaded
        if (ws.getDuration() <= 0) {
          const blob = new Blob([lastBufferRef.current]);
          ws.load(URL.createObjectURL(blob));
        }
      } catch (e) {
        const blob = new Blob([lastBufferRef.current]);
        ws.load(URL.createObjectURL(blob));
      }
    }
  }, []);

  const seek = (time: number) => {
    const safeTime = Math.max(0, Math.min(time, durationRef.current));
    if (filterRef.current) {
      filterRef.current.position = Math.floor(safeTime * (audioContextRef.current?.sampleRate || 44100));
      if (soundTouchRef.current?.clear) soundTouchRef.current.clear();
    }
    setCurrentTime(safeTime);
    currentTimeRef.current = safeTime;
    if (wavesurferRef.current && isWsReadyRef.current) {
      try { 
        const ws = wavesurferRef.current;
        if (ws && (ws as any).decodedData) {
          ws.setTime(safeTime);
        } else {
          // Fallback catch-all
          if (ws.getDuration() > 0) ws.setTime(safeTime); 
        }
      } catch(e) {
        // Silently ignore WaveSurfer state issues during seek
      }
    }
  };

  const togglePlay = async () => {
    if (!audioContextRef.current) return;
    try {
      if (isPlayingRef.current) {
        await audioContextRef.current.suspend();
        setIsPlaying(false);
        isPlayingRef.current = false;
      } else {
        await audioContextRef.current.resume();
        setIsPlaying(true);
        isPlayingRef.current = true;
      }
    } catch (err) {
      console.error("Audio transition failed:", err);
    }
  };

  return {
    isPlaying,
    currentTime,
    duration,
    isLoading,
    setIsLoading,
    error,
    isReady,
    setIsReady: (val: boolean) => {
      setIsReady(val);
      isWsReadyRef.current = val;
    },
    loadAudio,
    setWavesurfer,
    seek,
    togglePlay,
    wavesurferRef,
    audioContextRef,
    soundTouchRef,
    gainNodeRef
  };
}
