import { useMemo } from "react";
import Card from "@/components/Card";
import SpectrogramBar from "@/components/spectrograms/SpectrogramBar";
import ViewportToolbar from "@/components/spectrograms/ViewportToolbar";
import SettingsMenu from "@/components/settings/SettingsMenu";
import Canvas from "@/components/spectrograms/Canvas";
import Player from "@/components/audio/Player";

import { getSpeedOptions } from "@/hooks/settings/useAudioSettings";
import {
  DEFAULT_AUDIO_SETTINGS,
  DEFAULT_SPECTROGRAM_SETTINGS,
} from "@/constants";

import type {
  Recording,
  AudioSettings,
  SpectrogramSettings,
  SpectrogramState,
  SpectrogramWindow,
  DrawFn,
  HoverHandler,
  MoveStartHandler,
  MoveEndHandler,
  MoveHandler,
  PressHandler,
  ScrollHandler,
  DoublePressHandler,
} from "@/types";

export default function RecordingSpectrogram({
  recording,
  viewport,
  bounds,
  height = 384,
  spectrogramState = "panning",
  audioSettings = DEFAULT_AUDIO_SETTINGS,
  spectrogramSettings = DEFAULT_SPECTROGRAM_SETTINGS,
  audioCurrentTime = 0,
  audioIsPlaying = false,
  audioLoop = false,
  onAudioPlay,
  onAudioPause,
  onAudioSeek,
  onAudioLoopToggle,
  onAudioSpeedChange,
  onAudioSettingsChange,
  onSpectrogramSettingsChange,
  onViewportReset,
  onViewportBack,
  onViewportEnablePanning,
  onViewportEnableZooming,
  onSpectrogramHover,
  onSpectrogramMoveStart,
  onSpectrogramMoveEnd,
  onSpectrogramMove,
  onSpectrogramPress,
  onSpectrogramScroll,
  onSpectrogramDoubleClick,
  onBarMoveStart,
  onBarMoveEnd,
  onBarMove,
  onBarPress,
  onBarScroll,
  onSettingsReset,
  onSettingsSave,
  spectrogramDrawFn,
}: {
  recording: Recording;
  viewport: SpectrogramWindow;
  bounds: SpectrogramWindow;
  height?: number;
  audioSettings?: AudioSettings;
  spectrogramSettings?: SpectrogramSettings;
  spectrogramState?: SpectrogramState;
  audioCurrentTime?: number;
  audioIsPlaying?: boolean;
  audioLoop?: boolean;
  onSpectrogramHover: HoverHandler;
  onSpectrogramMoveStart: MoveStartHandler;
  onSpectrogramMoveEnd: MoveEndHandler;
  onSpectrogramMove: MoveHandler;
  onSpectrogramPress: PressHandler;
  onSpectrogramScroll: ScrollHandler;
  onSpectrogramDoubleClick: DoublePressHandler;
  spectrogramDrawFn: DrawFn;
  onAudioPlay: () => void;
  onAudioPause: () => void;
  onAudioSeek: (time: number) => void;
  onAudioLoopToggle: () => void;
  onAudioSpeedChange: (speed: number) => void;
  onAudioSettingsChange?: (settings: AudioSettings) => void;
  onSpectrogramSettingsChange?: (settings: SpectrogramSettings) => void;
  onViewportReset?: () => void;
  onViewportBack?: () => void;
  onViewportEnablePanning?: () => void;
  onViewportEnableZooming?: () => void;
  onSettingsReset?: () => void;
  onSettingsSave?: () => void;
  onBarMoveStart?: MoveStartHandler;
  onBarMoveEnd?: MoveEndHandler;
  onBarMove?: MoveHandler;
  onBarPress?: PressHandler;
  onBarScroll?: ScrollHandler;
}) {
  const speedOptions = useMemo(() => {
    return getSpeedOptions(recording.samplerate);
  }, [recording.samplerate]);

  return (
    <Card>
      <div className="flex flex-row gap-4">
        <ViewportToolbar
          state={spectrogramState}
          onResetClick={onViewportReset}
          onBackClick={onViewportBack}
          onDragClick={onViewportEnablePanning}
          onZoomClick={onViewportEnableZooming}
        />
        <Player
          currentTime={audioCurrentTime}
          startTime={bounds.time.min}
          endTime={bounds.time.max}
          isPlaying={audioIsPlaying}
          loop={audioLoop}
          speed={audioSettings.speed}
          play={onAudioPlay}
          pause={onAudioPause}
          seek={onAudioSeek}
          toggleLoop={onAudioLoopToggle}
          setSpeed={onAudioSpeedChange}
          speedOptions={speedOptions}
        />
        <SettingsMenu
          audioSettings={audioSettings}
          spectrogramSettings={spectrogramSettings}
          samplerate={recording.samplerate}
          onAudioSettingsChange={onAudioSettingsChange}
          onSpectrogramSettingsChange={onSpectrogramSettingsChange}
          onResetClick={onSettingsReset}
          onSaveClick={onSettingsSave}
        />
      </div>
      <Canvas
        height={height}
        viewport={viewport}
        onHover={onSpectrogramHover}
        onMoveStart={onSpectrogramMoveStart}
        onMoveEnd={onSpectrogramMoveEnd}
        onMove={onSpectrogramMove}
        onPress={onSpectrogramPress}
        onScroll={onSpectrogramScroll}
        onDoubleClick={onSpectrogramDoubleClick}
        drawFn={spectrogramDrawFn}
      />
      <SpectrogramBar
        bounds={bounds}
        viewport={viewport}
        onMoveStart={onBarMoveStart}
        onMoveEnd={onBarMoveEnd}
        onMove={onBarMove}
        onPress={onBarPress}
        onScroll={onBarScroll}
      />
    </Card>
  );
}
