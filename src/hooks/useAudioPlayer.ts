// @ts-ignore
import { SoundTouch, SimpleFilter } from "soundtouchjs";
import { useEffect, useRef, useState, useCallback } from "react";

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const filterRef = useRef<any>(null);
  const soundTouchRef = useRef<any>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const scriptNodeRef = useRef<ScriptProcessorNode | null>(null);

  const isPlayingRef = useRef(false);
  const durationRef = useRef(0);
  const currentTimeRef = useRef(0);

  const initEngine = useCallback((audioBuffer: AudioBuffer, speed: number, pitch: number) => {
    const ctx = audioContextRef.current!;
    const st = new SoundTouch();

    st.tempo = speed;
    st.pitch = pitch;
    soundTouchRef.current = st;

    const source = {
      extract: (target: Float32Array, numFrames: number, offset: number) => {
        const left = audioBuffer.getChannelData(0);
        const right = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : left;

        const frames = Math.min(numFrames, left.length - offset);

        for (let i = 0; i < frames; i++) {
          target[i * 2] = left[i + offset] || 0;
          target[i * 2 + 1] = right[i + offset] || 0;
        }

        return frames;
      },
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

      if (!isPlayingRef.current) {
        left.fill(0);
        right.fill(0);
        return;
      }

      const buffer = new Float32Array(left.length * 2);
      const frames = filterRef.current.extract(buffer, left.length);

      for (let i = 0; i < frames; i++) {
        left[i] = buffer[i * 2];
        right[i] = buffer[i * 2 + 1];
      }

      const pos = filterRef.current.sourcePosition || 0;
      const time = pos / ctx.sampleRate;

      currentTimeRef.current = time;
      setCurrentTime(time);

      if (time >= durationRef.current) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        ctx.suspend();
      }
    };

    scriptNode.connect(gainNode);
    gainNode.connect(ctx.destination);

    ctx.suspend();
  }, []);

  const loadAudio = async (url: string, speed = 1, pitch = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error("Audio fetch failed");

      const arrayBuffer = await res.arrayBuffer();

      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));

      setDuration(audioBuffer.duration);
      durationRef.current = audioBuffer.duration;

      initEngine(audioBuffer, speed, pitch);

      setIsLoading(false);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const seek = (time: number) => {
    const safe = Math.max(0, Math.min(time, durationRef.current));

    if (filterRef.current) {
      filterRef.current.position = Math.floor(
        safe * (audioContextRef.current?.sampleRate || 44100)
      );
    }

    setCurrentTime(safe);
    currentTimeRef.current = safe;
  };

  const togglePlay = async () => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    if (isPlayingRef.current) {
      await ctx.suspend();
      isPlayingRef.current = false;
      setIsPlaying(false);
    } else {
      await ctx.resume();
      isPlayingRef.current = true;
      setIsPlaying(true);
    }
  };

  return {
    isPlaying,
    currentTime,
    duration,
    isLoading,
    error,
    loadAudio,
    seek,
    togglePlay,
    audioContextRef,
    soundTouchRef,
    gainNodeRef,
  };
}