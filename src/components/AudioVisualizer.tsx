import { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import HoverPlugin from 'wavesurfer.js/dist/plugins/hover.esm.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

interface VisualizerProps {
  onReady: (ws: WaveSurfer, regions: any) => void;
  onUnmount: () => void;
  onSeek: (time: number) => void;
  zoom: number;
}

export const AudioVisualizer = ({ onReady, onUnmount, onSeek, zoom }: VisualizerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!containerRef.current || !timelineRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#94a3b8",
      progressColor: "#6366f1",
      cursorColor: "#6366f1",
      cursorWidth: 2,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      height: 140,
      minPxPerSec: zoom,
      fillParent: true,
      plugins: [
        TimelinePlugin.create({ container: timelineRef.current }),
        HoverPlugin.create({
          lineColor: "#6366f1",
          labelBackground: "#6366f1",
          labelColor: "#fff",
        }),
      ],
    });

    const regions = ws.registerPlugin(RegionsPlugin.create());

    ws.on('ready', () => onReady(ws, regions));
    ws.on('interaction', (time) => onSeek(time));

    wavesurferRef.current = ws;

    return () => {
      onUnmount();
      ws.destroy();
    };
  }, []);

  useEffect(() => {
    if (wavesurferRef.current && wavesurferRef.current.getDuration() > 0) {
      try {
        wavesurferRef.current.zoom(zoom);
      } catch (e) {
        // Ignore zoom errors when not ready
      }
    }
  }, [zoom]);

  return (
    <div className="bg-slate-900 rounded-3xl p-6 shadow-2xl overflow-hidden border border-slate-800">
      <div ref={containerRef} />
      <div ref={timelineRef} className="mt-2" />
    </div>
  );
};
