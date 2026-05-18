export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  error: string | null;
}

export interface Region {
  start: number;
  end: number;
}

export interface AudioSettings {
  speed: number;
  pitch: number;
  volume: number;
  zoom: number;
}
