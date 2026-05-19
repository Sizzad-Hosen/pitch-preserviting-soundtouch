// import { useEffect, useRef } from "react";
// import WaveSurfer from "wavesurfer.js";
// import { VisualizerProps } from "../helpers/interface";

// export const AudioVisualizer = ({ audioUrl, onReady, onUnmount, onSeek, zoom }: VisualizerProps) => {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const wavesurferRef = useRef<WaveSurfer | null>(null);

//   useEffect(() => {
//     if (!containerRef.current) return;

//     const ws = WaveSurfer.create({
//       container: containerRef.current,
//       waveColor: "#94a3b8",
//       progressColor: "#6366f1",
//       cursorColor: "#6366f1",
//       height: 80,
//       barWidth: 2,
//       barGap: 1,
//       responsive: true,
//     });

//     wavesurferRef.current = ws;

//     // 🔥 IMPORTANT: audio load
//     ws.load(audioUrl);

//     ws.on("ready", () => {
//       onReady?.(ws);
//     });

//     ws.on("interaction", (time) => {
//       onSeek?.(time);
//     });

//     return () => {
//       onUnmount?.();
//       ws.destroy();
//     };
//   }, [audioUrl]);

//   // zoom effect
//   useEffect(() => {
//     if (wavesurferRef.current) {
//       try {
//         wavesurferRef.current.zoom(zoom);
//       } catch {}
//     }
//   }, [zoom]);

//   return (
//     <div className="bg-slate-900 p-4 rounded-2xl">
//       <div ref={containerRef} className="w-full h-[80px]" />
//     </div>
//   );
// };