import WaveSurfer from "wavesurfer.js";

export interface VisualizerProps {
  audioUrl:string;
  onReady: (ws: WaveSurfer, regions: any) => void;
  onUnmount: () => void;
  onSeek: (time: number) => void;
  zoom: number;
}


export interface ControlCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  min: number;
  max: number;
  step: number;
  currentValue: number;
  onChange: (val: number) => void;
  onReset: () => void;
}
