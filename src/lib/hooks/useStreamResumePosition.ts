import {MutableRefObject, useCallback, useRef} from 'react';

export interface StreamResumeState {
  episodeKey: string;
  stream: unknown;
  // Whether a stream has loaded since this episode was opened. Until then the
  // live position can still belong to the previous episode.
  loaded: boolean;
  // Position carried over from the stream that was playing before a switch.
  // null means nothing was carried, so the saved resume point applies.
  carriedPosition: number | null;
}

// Works out what the next stream should start from. A new episode always
// starts from its own saved progress. Switching streams within the same
// episode keeps the position that was playing, so a server change never jumps
// back to the resume point the episode was opened with (or to 0 once the saved
// progress counts as watched).
export const nextStreamResumeState = (
  state: StreamResumeState,
  episodeKey: string,
  stream: unknown,
  livePosition: number,
): StreamResumeState => {
  if (state.episodeKey !== episodeKey) {
    return {episodeKey, stream, loaded: false, carriedPosition: null};
  }
  if (state.stream === stream) {
    return state;
  }
  const carriedPosition =
    state.loaded && Number.isFinite(livePosition) && livePosition > 5
      ? livePosition
      : state.carriedPosition;
  return {...state, stream, carriedPosition};
};

export const getStreamStartPosition = (
  state: StreamResumeState,
  savedPosition: number,
) => state.carriedPosition ?? savedPosition;

// Where a newly loaded stream should seek to. Updated during render, before
// the new source reaches the player, so the live position still belongs to the
// stream being replaced.
export const useStreamResumePosition = ({
  episodeKey,
  stream,
  savedPosition,
  videoPositionRef,
}: {
  episodeKey: string;
  stream: unknown;
  savedPosition: number;
  videoPositionRef: MutableRefObject<{position: number}>;
}) => {
  const stateRef = useRef<StreamResumeState>({
    episodeKey,
    stream,
    loaded: false,
    carriedPosition: null,
  });
  stateRef.current = nextStreamResumeState(
    stateRef.current,
    episodeKey,
    stream,
    videoPositionRef.current.position,
  );
  const savedPositionRef = useRef(savedPosition);
  savedPositionRef.current = savedPosition;

  const getStartPosition = useCallback(
    () => getStreamStartPosition(stateRef.current, savedPositionRef.current),
    [],
  );
  const markStreamLoaded = useCallback(() => {
    stateRef.current = {...stateRef.current, loaded: true};
  }, []);
  // Reloading the same stream after an error continues from `position`.
  const keepPosition = useCallback((position: number) => {
    stateRef.current = {...stateRef.current, carriedPosition: position};
  }, []);

  return {getStartPosition, markStreamLoaded, keepPosition};
};
