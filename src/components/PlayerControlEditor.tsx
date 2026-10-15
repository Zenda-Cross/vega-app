import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {Modal, Text, View, useWindowDimensions} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import {isTV} from '../lib/tv/constants';
import {TVFocusable, TVFocusGuide} from './tv';
import {PlayerControl, PlayerControlIcon} from './PlayerControlBar';
import {
  defaultPlayerControlLayout,
  getTopControlLimit,
  movePlayerControl,
  normalizePlayerControlLayout,
  PlayerControlBar,
  PlayerControlId,
  PlayerControlLayout,
} from '../lib/player/controlLayout';

const TOP_Y = 24;
const BOTTOM_Y = 96;
const CELL_HEIGHT = 50;
const noop = () => {};
const EDITOR_LABELS: Record<PlayerControlId, string> = {
  sleep: 'Sleep',
  lock: 'Lock',
  cast: 'Cast',
  audio: 'Audio',
  subtitle: 'Subtitles',
  speed: 'Speed',
  pip: 'PiP',
  server: 'Quality',
  resize: 'Fit',
  episodes: 'Episodes',
  next: 'Next',
};

type TokenProps = {
  control: PlayerControl;
  x: number;
  y: number;
  width: number;
  top: boolean;
  selected: boolean;
  hidden: boolean;
  epoch: number;
  color: string;
  onSelect: (id: PlayerControlId) => void;
  onDragStart: (id: PlayerControlId) => void;
  onDrop: (id: PlayerControlId, x: number, y: number) => void;
};

function ControlToken({
  control,
  x,
  y,
  width,
  top,
  selected,
  hidden,
  epoch,
  color,
  onSelect,
  onDragStart,
  onDrop,
}: TokenProps) {
  const id = control.id;
  const dx = useSharedValue(0);
  const dy = useSharedValue(0);
  const active = useSharedValue(false);
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  useEffect(() => {
    dx.set(0);
    dy.set(0);
    active.set(false);
  }, [x, y, epoch, dx, dy, active]);
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(250)
        .onStart(event => {
          originX.set(event.absoluteX - event.x - x);
          originY.set(event.absoluteY - event.y - y);
          active.set(true);
          runOnJS(onDragStart)(id);
        })
        .onUpdate(event => {
          dx.set(event.translationX);
          dy.set(event.translationY);
        })
        .onEnd(event => {
          runOnJS(onDrop)(
            id,
            event.absoluteX - originX.get(),
            event.absoluteY - originY.get(),
          );
        })
        .onFinalize((_event, success) => {
          if (!success) {
            dx.set(0);
            dy.set(0);
            active.set(false);
          }
        }),
    [id, x, y, dx, dy, active, originX, originY, onDragStart, onDrop],
  );
  const tap = useMemo(
    () => Gesture.Tap().onEnd(() => runOnJS(onSelect)(id)),
    [id, onSelect],
  );
  const gesture = useMemo(() => Gesture.Exclusive(pan, tap), [pan, tap]);
  const style = useAnimatedStyle(() => ({
    transform: [
      {translateX: dx.get()},
      {translateY: dy.get()},
      {scale: active.get() ? 1.08 : 1},
    ],
    zIndex: active.get() ? 100 : selected ? 2 : 1,
    opacity: hidden ? 0.4 : 1,
  }));
  const content = (
    <>
      <PlayerControlIcon control={control} size={20} />
      {!top && (
        <Text
          numberOfLines={1}
          style={{color: 'white', fontSize: 11, marginTop: 2}}>
          {EDITOR_LABELS[control.id]}
        </Text>
      )}
    </>
  );
  const tokenStyle = {
    width,
    height: top ? 42 : 44,
    paddingVertical: 4,
    borderRadius: top ? 21 : 10,
    borderWidth: 1,
    borderColor: selected ? color : 'transparent',
    backgroundColor: selected ? '#353535' : '#242424',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
  if (isTV)
    return (
      <View style={{position: 'absolute', left: x, top: y}}>
        <TVFocusable
          registerScreenFocus={false}
          onPress={() => onSelect(control.id)}
          focusBorderColor={color}
          accessibilityLabel={`Move ${control.title}`}
          borderRadius={12}
          style={tokenStyle}>
          {content}
        </TVFocusable>
      </View>
    );
  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Move ${control.title}`}
        accessibilityHint="Hold and drag, or tap and use the move buttons"
        accessibilityActions={[{name: 'activate', label: 'Select control'}]}
        onAccessibilityAction={event => {
          if (event.nativeEvent.actionName === 'activate') onSelect(control.id);
        }}
        onAccessibilityTap={() => onSelect(control.id)}
        style={[{position: 'absolute', left: x, top: y}, tokenStyle, style]}>
        {content}
      </Animated.View>
    </GestureDetector>
  );
}

type Props = {
  layout: PlayerControlLayout;
  controls: PlayerControl[];
  color: string;
  hiddenControls?: PlayerControlId[];
  onSave: (layout: PlayerControlLayout, hidden: PlayerControlId[]) => void;
  onClose: () => void;
  onHaptic?: () => void;
};

function PlayerControlEditor({
  layout,
  controls,
  color,
  hiddenControls,
  onSave,
  onClose,
  onHaptic = noop,
}: Props) {
  const {width} = useWindowDimensions();
  const limit = getTopControlLimit(width);
  const [draft, setDraft] = useState(() =>
    normalizePlayerControlLayout(layout, limit),
  );
  const [hidden, setHidden] = useState<PlayerControlId[]>(
    () => hiddenControls || [],
  );
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const [selected, setSelected] = useState<PlayerControlId | null>(
    isTV ? 'sleep' : null,
  );
  const [canvasWidth, setCanvasWidth] = useState(
    Math.max(240, Math.min(600, width - 32) - 28),
  );
  const [epoch, setEpoch] = useState(0);
  const [message, setMessage] = useState(
    'Hold and drag to rearrange. Tap a control for more options.',
  );
  const columns = Math.max(2, Math.floor(canvasWidth / 96));
  const cellWidth = canvasWidth / columns;
  const startDrag = useCallback(
    (id: PlayerControlId) => {
      setSelected(id);
      onHaptic();
    },
    [onHaptic],
  );
  useEffect(() => {
    setDraft(current => normalizePlayerControlLayout(current, limit));
  }, [limit]);
  const move = useCallback(
    (id: PlayerControlId, bar: PlayerControlBar, index: number) => {
      const current = draftRef.current;
      const next = movePlayerControl(current, id, bar, index, limit);
      if (
        current.top.indexOf(id) !== next.top.indexOf(id) ||
        current.bottom.indexOf(id) !== next.bottom.indexOf(id)
      ) {
        onHaptic();
      }
      draftRef.current = next;
      setDraft(next);
      setMessage(
        next === current
          ? `Top bar is full (${limit} controls maximum)`
          : 'Hold and drag to rearrange. Tap a control for more options.',
      );
      setEpoch(value => value + 1);
    },
    [limit, onHaptic],
  );
  const drop = useCallback(
    (id: PlayerControlId, x: number, y: number) => {
      if (
        x < 0 ||
        x > canvasWidth ||
        y < TOP_Y - 8 ||
        y >
          BOTTOM_Y +
            Math.ceil(draftRef.current.bottom.length / columns) * CELL_HEIGHT
      ) {
        setEpoch(value => value + 1);
        return;
      }
      const top = y < BOTTOM_Y - 18;
      const index = top
        ? Math.floor(x / 48)
        : Math.floor((y - BOTTOM_Y) / CELL_HEIGHT) * columns +
          Math.floor(x / cellWidth);
      move(id, top ? 'top' : 'bottom', Math.max(0, index));
    },
    [canvasWidth, columns, cellWidth, move],
  );
  const activeId = selected ?? 'sleep';
  const bar: PlayerControlBar = draft.top.includes(activeId) ? 'top' : 'bottom';
  const index = draft[bar].indexOf(activeId);
  const selectedTitle =
    controls.find(control => control.id === activeId)?.title || activeId;
  const action = (
    title: string,
    onPress: () => void,
    icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'],
    filled = false,
  ) => (
    <TVFocusable
      registerScreenFocus={false}
      hasTVPreferredFocus={filled}
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      borderRadius={14}
      focusBorderColor={color}
      style={{
        minWidth: icon ? 32 : 56,
        height: 32,
        paddingHorizontal: icon ? 6 : 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: filled ? color : 'transparent',
        borderRadius: 16,
      }}>
      {icon ? (
        <MaterialCommunityIcons name={icon} size={19} color="#bbbbbb" />
      ) : (
        <Text
          style={{
            color: filled ? '#111111' : '#bbbbbb',
            fontSize: 13,
            fontWeight: '600',
          }}>
          {title}
        </Text>
      )}
    </TVFocusable>
  );
  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
      animationType="fade">
      <GestureHandlerRootView
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.62)',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 8,
        }}>
        <TVFocusGuide
          trapFocusLeft
          trapFocusRight
          trapFocusUp
          trapFocusDown
          style={{
            width: '92%',
            maxWidth: 600,
            maxHeight: '100%',
            padding: 14,
            borderRadius: 22,
            backgroundColor: '#151515',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              marginBottom: 6,
            }}>
            <Text
              style={{
                flex: 1,
                color: '#eeeeee',
                fontSize: 16,
                fontWeight: '600',
              }}>
              Arrange controls
            </Text>
            {action(
              'Reset',
              () => {
                setDraft(
                  normalizePlayerControlLayout(
                    defaultPlayerControlLayout(),
                    limit,
                  ),
                );
                setEpoch(value => value + 1);
                setHidden([]);
              },
              'restore',
            )}
            {action('Cancel', onClose, 'close')}
            {action('Save', () => onSave(draft, hidden), undefined, true)}
          </View>
          <Text
            numberOfLines={1}
            style={{color: '#999999', fontSize: 11, marginBottom: 10}}>
            {message}
          </Text>
          <View
            onLayout={event => setCanvasWidth(event.nativeEvent.layout.width)}
            style={{
              height:
                BOTTOM_Y +
                Math.max(1, Math.ceil(draft.bottom.length / columns)) *
                  CELL_HEIGHT,
            }}>
            <Text style={{color: '#aaaaaa', fontSize: 11}}>Top row</Text>
            <Text
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                color: '#777777',
                fontSize: 11,
              }}>
              {draft.top.length} / {limit}
            </Text>
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: TOP_Y - 2,
                left: 0,
                right: 0,
                height: 50,
                borderRadius: 12,
                backgroundColor: '#1c1c1c',
              }}
            />
            {Array.from({length: limit}, (_, slot) => (
              <View
                key={slot}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: TOP_Y,
                  left: slot * 48 + 4,
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: '#3b3b3b',
                }}
              />
            ))}
            <Text
              style={{
                position: 'absolute',
                top: BOTTOM_Y - 18,
                color: '#aaaaaa',
                fontSize: 11,
              }}>
              Bottom row
            </Text>
            <Text
              style={{
                position: 'absolute',
                top: BOTTOM_Y - 18,
                right: 0,
                color: '#777777',
                fontSize: 11,
              }}>
              Swipe for more
            </Text>
            {(['top', 'bottom'] as const).flatMap(lane =>
              draft[lane].map((id, slot) => {
                const control = controls.find(item => item.id === id);
                if (!control) return null;
                const top = lane === 'top';
                return (
                  <ControlToken
                    key={id}
                    control={control}
                    x={top ? slot * 48 + 4 : (slot % columns) * cellWidth}
                    y={
                      top
                        ? TOP_Y
                        : BOTTOM_Y + Math.floor(slot / columns) * CELL_HEIGHT
                    }
                    width={top ? 42 : cellWidth - 6}
                    top={top}
                    selected={selected === id}
                    hidden={hidden.includes(id)}
                    epoch={epoch}
                    color={color}
                    onSelect={setSelected}
                    onDragStart={startDrag}
                    onDrop={drop}
                  />
                );
              }),
            )}
          </View>
          <View
            style={{
              height: 36,
              marginTop: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}>
            {selected ? (
              <>
                <Text
                  numberOfLines={1}
                  style={{flex: 1, color: '#bbbbbb', fontSize: 12}}>
                  {selectedTitle}
                </Text>
                {action(
                  hidden.includes(activeId) ? 'Show control' : 'Hide control',
                  () =>
                    setHidden(current =>
                      current.includes(activeId)
                        ? current.filter(id => id !== activeId)
                        : [...current, activeId],
                    ),
                  hidden.includes(activeId) ? 'eye-outline' : 'eye-off-outline',
                )}
                {action(
                  'Move left',
                  () => move(activeId, bar, Math.max(0, index - 1)),
                  'arrow-left',
                )}
                {action(
                  'Move right',
                  () => move(activeId, bar, index + 1),
                  'arrow-right',
                )}
                <View
                  style={{
                    height: 16,
                    width: 1,
                    backgroundColor: '#333333',
                    marginHorizontal: 4,
                  }}
                />
                {action(
                  'To top',
                  () => move(activeId, 'top', draft.top.length),
                  'arrow-up',
                )}
                {action(
                  'To bottom',
                  () => move(activeId, 'bottom', draft.bottom.length),
                  'arrow-down',
                )}
              </>
            ) : (
              <Text style={{color: '#777777', fontSize: 11}}>
                Top controls use icons. Bottom controls include labels.
              </Text>
            )}
          </View>
        </TVFocusGuide>
      </GestureHandlerRootView>
    </Modal>
  );
}

export default memo(PlayerControlEditor);
