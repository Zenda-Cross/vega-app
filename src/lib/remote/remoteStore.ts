import {create} from 'zustand';
import {
  RemoteAudioTrack,
  RemoteCapabilities,
  RemoteDevice,
  RemotePlaybackStatus,
  RemoteQuality,
  RemoteServer,
  RemoteSubtitleTrack,
} from './types';

interface RemoteStoreState {
  connectedDevice: RemoteDevice | null;
  status: RemotePlaybackStatus;
  currentTime: number;
  duration: number;
  // reloadStart: where a reloaded (remuxed) stream really begins, at or before target.
  pendingSeek: {id: number; target: number; acknowledged: boolean; reportedTime?: number; reloadStart?: number} | null;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  activeAudioTrackId?: string;
  activeSubtitleTrackId?: string;
  activeQualityId?: string;
  activeServerId?: string;
  // User delays in milliseconds, applied by reloading the stream.
  // Positive shows subtitles later or plays the sound later.
  subtitleDelayMs: number;
  audioDelayMs: number;
  audioTracks: RemoteAudioTrack[];
  subtitleTracks: RemoteSubtitleTrack[];
  qualities: RemoteQuality[];
  servers: RemoteServer[];
  errorMessage?: string;
  preparingSubtitle: boolean;
  capabilities: RemoteCapabilities;

  // Device discovery
  availableDlnaDevices: RemoteDevice[];
  isSearchingDlna: boolean;

  // Actions
  setConnectedDevice: (device: RemoteDevice | null) => void;
  setStatus: (status: RemotePlaybackStatus) => void;
  setTimeline: (currentTime: number, duration: number) => void;
  beginSeek: (id: number, target: number) => void;
  acknowledgeSeek: (id: number, reloadStart?: number) => void;
  cancelSeek: (id?: number) => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number, isMuted?: boolean) => void;
  setAudioTracks: (tracks: RemoteAudioTrack[], activeId?: string) => void;
  setSubtitleTracks: (tracks: RemoteSubtitleTrack[], activeId?: string) => void;
  setQualities: (qualities: RemoteQuality[], activeId?: string) => void;
  setServers: (servers: RemoteServer[], activeId?: string) => void;
  setActiveAudioTrackId: (id?: string) => void;
  setActiveSubtitleTrackId: (id?: string) => void;
  setActiveQualityId: (id?: string) => void;
  setActiveServerId: (id?: string) => void;
  setDelays: (subtitleDelayMs: number, audioDelayMs: number) => void;
  setCapabilities: (capabilities: Partial<RemoteCapabilities>) => void;
  setErrorMessage: (msg?: string) => void;
  setAvailableDlnaDevices: (devices: RemoteDevice[]) => void;
  addDlnaDevice: (device: RemoteDevice) => void;
  removeDlnaDevice: (deviceId: string) => void;
  setIsSearchingDlna: (isSearching: boolean) => void;
  resetSession: () => void;
}

const defaultCapabilities: RemoteCapabilities = {
  canSeek: true,
  canChangeSpeed: true,
  canChangeVolume: true,
  canChangeAudio: true,
  canChangeSubtitles: true,
  canChangeQuality: true,
};

/**
 * A plain seek lands within 2s of its target. A reloaded stream starts at the
 * keyframe before the target (up to ~10s early) and plays on while it loads,
 * so any time from that keyframe onward counts.
 */
const seekReached = (
  pending: {target: number; reloadStart?: number},
  time: number,
): boolean =>
  pending.reloadStart !== undefined
    ? time >= pending.reloadStart - 2 && time <= pending.target + 30
    : Math.abs(time - pending.target) <= 2;

export const useRemoteStore = create<RemoteStoreState>(set => ({
  connectedDevice: null,
  status: 'idle',
  currentTime: 0,
  duration: 0,
  pendingSeek: null,
  playbackRate: 1,
  volume: 1,
  isMuted: false,
  activeAudioTrackId: undefined,
  activeSubtitleTrackId: undefined,
  activeQualityId: undefined,
  activeServerId: undefined,
  subtitleDelayMs: 0,
  audioDelayMs: 0,
  audioTracks: [],
  subtitleTracks: [],
  qualities: [],
  servers: [],
  errorMessage: undefined,
  preparingSubtitle: false,
  capabilities: defaultCapabilities,

  availableDlnaDevices: [],
  isSearchingDlna: false,

  setConnectedDevice: device => set({connectedDevice: device}),
  setStatus: status => set({status}),
  setTimeline: (currentTime, duration) => set(state => {
    const pending = state.pendingSeek;
    const resolvedDuration = duration > 0 ? duration : state.duration;
    if (pending) {
      const confirmed = pending.acknowledged && seekReached(pending, currentTime);
      return {
        currentTime: confirmed ? currentTime : pending.target,
        duration: resolvedDuration,
        pendingSeek: confirmed ? null : {...pending, reportedTime: currentTime},
      };
    }
    return {currentTime, duration: resolvedDuration};
  }),
  beginSeek: (id, target) => set({currentTime: target, pendingSeek: {id, target, acknowledged: false}}),
  acknowledgeSeek: (id, reloadStart) => set(state => {
    const pending = state.pendingSeek;
    if (!pending || pending.id !== id) return {};
    const next = {...pending, acknowledged: true, reloadStart};
    const confirmed = pending.reportedTime !== undefined && seekReached(next, pending.reportedTime);
    return {pendingSeek: confirmed ? null : next};
  }),
  cancelSeek: id => set(state => {
    if (!state.pendingSeek || (id !== undefined && state.pendingSeek.id !== id)) return {};
    return {currentTime: state.pendingSeek.reportedTime ?? state.currentTime, pendingSeek: null};
  }),
  setPlaybackRate: rate => set({playbackRate: rate}),
  setVolume: (volume, isMuted) =>
    set(state => ({
      volume,
      isMuted: isMuted !== undefined ? isMuted : state.isMuted,
    })),
  setAudioTracks: (audioTracks, activeAudioTrackId) =>
    set(state => ({
      audioTracks,
      activeAudioTrackId:
        activeAudioTrackId !== undefined
          ? activeAudioTrackId
          : state.activeAudioTrackId,
    })),
  setSubtitleTracks: (subtitleTracks, activeSubtitleTrackId) =>
    set(state => ({
      subtitleTracks,
      activeSubtitleTrackId:
        activeSubtitleTrackId !== undefined
          ? activeSubtitleTrackId
          : state.activeSubtitleTrackId,
    })),
  setQualities: (qualities, activeQualityId) =>
    set(state => ({
      qualities,
      activeQualityId:
        activeQualityId !== undefined
          ? activeQualityId
          : state.activeQualityId,
    })),
  setServers: (servers, activeServerId) =>
    set(state => ({
      servers,
      activeServerId:
        activeServerId !== undefined
          ? activeServerId
          : state.activeServerId,
    })),
  setActiveAudioTrackId: id => set({activeAudioTrackId: id}),
  setActiveSubtitleTrackId: id => set({activeSubtitleTrackId: id}),
  setActiveQualityId: id => set({activeQualityId: id}),
  setActiveServerId: id => set({activeServerId: id}),
  setDelays: (subtitleDelayMs, audioDelayMs) =>
    set({subtitleDelayMs, audioDelayMs}),
  setCapabilities: caps =>
    set(state => ({capabilities: {...state.capabilities, ...caps}})),
  setErrorMessage: errorMessage => set({errorMessage}),

  setAvailableDlnaDevices: devices => set({availableDlnaDevices: devices}),
  addDlnaDevice: device =>
    set(state => {
      const exists = state.availableDlnaDevices.some(d => d.id === device.id);
      if (exists) {
        return {
          availableDlnaDevices: state.availableDlnaDevices.map(d =>
            d.id === device.id ? device : d,
          ),
        };
      }
      return {availableDlnaDevices: [...state.availableDlnaDevices, device]};
    }),
  removeDlnaDevice: deviceId =>
    set(state => ({
      availableDlnaDevices: state.availableDlnaDevices.filter(
        d => d.id !== deviceId,
      ),
    })),
  setIsSearchingDlna: isSearchingDlna => set({isSearchingDlna}),

  resetSession: () =>
    set({
      connectedDevice: null,
      status: 'idle',
      currentTime: 0,
      duration: 0,
      pendingSeek: null,
      playbackRate: 1,
      volume: 1,
      isMuted: false,
      activeAudioTrackId: undefined,
      activeSubtitleTrackId: undefined,
      activeQualityId: undefined,
      subtitleDelayMs: 0,
      audioDelayMs: 0,
      audioTracks: [],
      subtitleTracks: [],
      qualities: [],
      errorMessage: undefined,
      preparingSubtitle: false,
      capabilities: defaultCapabilities,
    }),
}));
