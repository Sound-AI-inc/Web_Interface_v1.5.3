import { createContext, useContext, useCallback, useRef, useState, ReactNode } from "react";

export type PreviewType = "audio" | "midi" | "preset" | null;

export interface PreviewState {
  type: PreviewType;
  assetId: string | null;
  playing: boolean;
  progress: number;
  duration: number;
}

export interface PreviewActions {
  registerAudio: (assetId: string, controls: AudioPreviewControls) => void;
  unregisterAudio: (assetId: string) => void;
  registerMidi: (assetId: string, controls: MidiPreviewControls) => void;
  unregisterMidi: (assetId: string) => void;
  registerPreset: (assetId: string, controls: PresetPreviewControls) => void;
  unregisterPreset: (assetId: string) => void;
  playAudio: (assetId: string) => void;
  pauseAudio: (assetId: string) => void;
  playMidi: (assetId: string) => void;
  pauseMidi: (assetId: string) => void;
  playPreset: (assetId: string) => void;
  pausePreset: (assetId: string) => void;
  stopAll: () => void;
}

export interface AudioPreviewControls {
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  onProgress: (progress: number) => void;
  onEnded: () => void;
  duration: number;
}

export interface MidiPreviewControls {
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  onProgress: (progress: number) => void;
  onEnded: () => void;
  duration: number;
}

export interface PresetPreviewControls {
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  onProgress: (progress: number) => void;
  onEnded: () => void;
  duration: number;
}

interface PreviewPlaybackContextValue {
  state: PreviewState;
  actions: PreviewActions;
}

const PreviewPlaybackContext = createContext<PreviewPlaybackContextValue | null>(null);

export function usePreviewPlayback() {
  const context = useContext(PreviewPlaybackContext);
  if (!context) {
    throw new Error("usePreviewPlayback must be used within a PreviewPlaybackProvider");
  }
  return context.actions;
}

export function usePreviewState(assetId: string, type: PreviewType): Pick<PreviewState, "playing" | "progress" | "duration"> {
  const context = useContext(PreviewPlaybackContext);
  if (!context) {
    return { playing: false, progress: 0, duration: 0 };
  }
  const { state } = context;
  
  if (!state.assetId || state.assetId !== assetId || state.type !== type) {
    return { playing: false, progress: 0, duration: 0 };
  }
  return { playing: state.playing, progress: state.progress, duration: state.duration };
}

interface PreviewPlaybackProviderProps {
  children: ReactNode;
}

export function PreviewPlaybackProvider({ children }: PreviewPlaybackProviderProps) {
  const [state, setState] = useState<PreviewState>({
    type: null,
    assetId: null,
    playing: false,
    progress: 0,
    duration: 0,
  });

  const audioControlsRef = useRef<Map<string, AudioPreviewControls>>(new Map());
  const midiControlsRef = useRef<Map<string, MidiPreviewControls>>(new Map());
  const presetControlsRef = useRef<Map<string, PresetPreviewControls>>(new Map());

  const stopAll = useCallback(() => {
    const currentType = state.type;
    const currentAssetId = state.assetId;

    if (currentType === "audio" && currentAssetId) {
      const controls = audioControlsRef.current.get(currentAssetId);
      controls?.stop();
    } else if (currentType === "midi" && currentAssetId) {
      const controls = midiControlsRef.current.get(currentAssetId);
      controls?.stop();
    } else if (currentType === "preset" && currentAssetId) {
      const controls = presetControlsRef.current.get(currentAssetId);
      controls?.stop();
    }

    setState({
      type: null,
      assetId: null,
      playing: false,
      progress: 0,
      duration: 0,
    });
  }, [state.type, state.assetId]);

  const registerAudio = useCallback((assetId: string, controls: AudioPreviewControls) => {
    audioControlsRef.current.set(assetId, controls);
  }, []);

  const unregisterAudio = useCallback((assetId: string) => {
    audioControlsRef.current.delete(assetId);
  }, []);

  const registerMidi = useCallback((assetId: string, controls: MidiPreviewControls) => {
    midiControlsRef.current.set(assetId, controls);
  }, []);

  const unregisterMidi = useCallback((assetId: string) => {
    midiControlsRef.current.delete(assetId);
  }, []);

  const registerPreset = useCallback((assetId: string, controls: PresetPreviewControls) => {
    presetControlsRef.current.set(assetId, controls);
  }, []);

  const unregisterPreset = useCallback((assetId: string) => {
    presetControlsRef.current.delete(assetId);
  }, []);

  const switchPlayback = useCallback((
    newType: PreviewType,
    newAssetId: string,
    playFn: () => Promise<void>,
    duration: number
  ) => {
    if (state.playing && (state.type !== newType || state.assetId !== newAssetId)) {
      stopAll();
    }

    setState({
      type: newType,
      assetId: newAssetId,
      playing: true,
      progress: 0,
      duration,
    });

    playFn().catch(() => {
      setState(prev => ({ ...prev, playing: false, progress: 0 }));
    });
  }, [state.playing, state.type, state.assetId, stopAll]);

  const playAudio = useCallback((assetId: string) => {
    const controls = audioControlsRef.current.get(assetId);
    if (!controls) return;

    switchPlayback("audio", assetId, async () => {
      await controls.play();
    }, controls.duration);
  }, [switchPlayback]);

  const pauseAudio = useCallback((assetId: string) => {
    const controls = audioControlsRef.current.get(assetId);
    if (!controls) return;
    controls.pause();
    setState(prev => ({ ...prev, playing: false }));
  }, []);

  const playMidi = useCallback((assetId: string) => {
    const controls = midiControlsRef.current.get(assetId);
    if (!controls) return;

    switchPlayback("midi", assetId, async () => {
      await controls.play();
    }, controls.duration);
  }, [switchPlayback]);

  const pauseMidi = useCallback((assetId: string) => {
    const controls = midiControlsRef.current.get(assetId);
    if (!controls) return;
    controls.pause();
    setState(prev => ({ ...prev, playing: false }));
  }, []);

  const playPreset = useCallback((assetId: string) => {
    const controls = presetControlsRef.current.get(assetId);
    if (!controls) return;

    switchPlayback("preset", assetId, async () => {
      await controls.play();
    }, controls.duration);
  }, [switchPlayback]);

  const pausePreset = useCallback((assetId: string) => {
    const controls = presetControlsRef.current.get(assetId);
    if (!controls) return;
    controls.pause();
    setState(prev => ({ ...prev, playing: false }));
  }, []);

  const actions: PreviewActions = {
    registerAudio,
    unregisterAudio,
    registerMidi,
    unregisterMidi,
    registerPreset,
    unregisterPreset,
    playAudio,
    pauseAudio,
    playMidi,
    pauseMidi,
    playPreset,
    pausePreset,
    stopAll,
  };

  return (
    <PreviewPlaybackContext.Provider value={{ state, actions }}>
      {children}
    </PreviewPlaybackContext.Provider>
  );
}