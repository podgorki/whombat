import {
  DEFAULT_CMAP,
  DEFAULT_FILTER_ORDER,
  DEFAULT_HOP_SIZE,
  DEFAULT_SCALE,
  DEFAULT_WINDOW,
  DEFAULT_WINDOW_SIZE,
  MIN_DB,
} from "@/constants";
import {
  IntervalSchema,
  AudioSettingsSchema,
  SpectrogramSettingsSchema,
} from "@/schemas";

import type {
  Interval,
  Recording,
  AudioSettings,
  SpectrogramSettings,
  SpectrogramParameters,
} from "@/types";

// NOTE: This duplication is temporary, while we update code to use the types
// and schemas files
export {
  DEFAULT_CMAP,
  DEFAULT_FILTER_ORDER,
  DEFAULT_HOP_SIZE,
  DEFAULT_SCALE,
  DEFAULT_WINDOW,
  DEFAULT_WINDOW_SIZE,
  MIN_DB,
};

const DEFAULT_ENDPOINTS = {
  get: "/api/v1/spectrograms/",
};

export const DEFAULT_SPECTROGRAM_PARAMETERS: SpectrogramParameters = {
  resample: false,
  scale: DEFAULT_SCALE,
  pcen: false,
  window_size: DEFAULT_WINDOW_SIZE,
  hop_size: DEFAULT_HOP_SIZE,
  cmap: DEFAULT_CMAP,
  window: DEFAULT_WINDOW,
  filter_order: DEFAULT_FILTER_ORDER,
  normalize: false,
  clamp: true,
  min_dB: MIN_DB,
  max_dB: 0,
  channel: 0,
};

export function registerSpectrogramAPI({
  endpoints = DEFAULT_ENDPOINTS,
  baseUrl = "",
}: {
  endpoints?: typeof DEFAULT_ENDPOINTS;
  baseUrl?: string;
}) {
  function getUrl({
    recording,
    interval,
    audioSettings,
    spectrogramSettings,
  }: {
    recording: Recording;
    interval: Interval;
    audioSettings: AudioSettings;
    spectrogramSettings: SpectrogramSettings;
  }) {
    // Validate parameters
    const parsed_audio_params = AudioSettingsSchema.parse(audioSettings);
    const parsed_spectrogram_params =
      SpectrogramSettingsSchema.parse(spectrogramSettings);
    const parsed_segment = IntervalSchema.parse(interval);

    // Construct query
    const query = {
      recording_uuid: recording.uuid,
      start_time: parsed_segment.min,
      end_time: parsed_segment.max,
      ...parsed_audio_params,
      ...parsed_spectrogram_params,
    };

    const params = new URLSearchParams(
      Object.fromEntries(
        Object.entries(query)
          .filter(([_, value]) => value != null)
          .map(([key, value]) => [key, value.toString()]),
      ),
    );

    // Get url
    return `${baseUrl}${endpoints.get}?${params}`;
  }

  return {
    getUrl,
  };
}
