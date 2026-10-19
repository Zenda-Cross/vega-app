import React from 'react';
import {Circle, G, Path} from 'react-native-svg';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedProps,
} from 'react-native-reanimated';
import type {SharedValue} from 'react-native-reanimated';
import type {AnimatedTabIconName} from './AnimatedTabIcon';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
// SVG groups expose their native affine matrix through setNativeProps.
const AnimatedG = Animated.createAnimatedComponent(G<{matrix?: number[]}>);
const PATH_LENGTH = 80;

type StrokePathProps = {
  d: string;
  progress: SharedValue<number>;
  color: string;
  start?: number;
  end?: number;
  strokeWidth?: number;
};

const AnimatedStrokePath = ({
  d,
  progress,
  color,
  start = 0,
  end = 1,
  strokeWidth = 1.9,
}: StrokePathProps) => {
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: interpolate(
      progress.value,
      [start, end],
      [PATH_LENGTH, 0],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <AnimatedPath
      animatedProps={animatedProps}
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={PATH_LENGTH}
    />
  );
};

type StrokeCircleProps = {
  progress: SharedValue<number>;
  color: string;
  cx: number;
  cy: number;
  r: number;
  start?: number;
  end?: number;
  strokeWidth?: number;
};

const AnimatedStrokeCircle = ({
  progress,
  color,
  cx,
  cy,
  r,
  start = 0,
  end = 1,
  strokeWidth = 1.9,
}: StrokeCircleProps) => {
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: interpolate(
      progress.value,
      [start, end],
      [PATH_LENGTH, 0],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <AnimatedCircle
      animatedProps={animatedProps}
      cx={cx}
      cy={cy}
      r={r}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeDasharray={PATH_LENGTH}
    />
  );
};

type RotatingPartProps = {
  progress: SharedValue<number>;
  start: number;
  end: number;
  from: number;
  originX: number;
  originY: number;
  children: React.ReactNode;
};

const RotatingPart = ({
  children,
  progress,
  start,
  end,
  from,
  originX,
  originY,
}: RotatingPartProps) => {
  const animatedProps = useAnimatedProps(() => {
    const angle = interpolate(
      progress.value,
      [start, end],
      [from, 0],
      Extrapolation.CLAMP,
    ) * Math.PI / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      matrix: [
        cos, sin, -sin, cos,
        originX - cos * originX + sin * originY,
        originY - sin * originX - cos * originY,
      ],
    };
  });
  return <AnimatedG animatedProps={animatedProps}>{children}</AnimatedG>;
};

export const FilledTabIcon = ({
  name,
  color,
}: {
  name: AnimatedTabIconName;
  color: string;
}) => {
  switch (name) {
    case 'home':
      return (
        <Path
          fill={color}
          fillRule="evenodd"
          clipRule="evenodd"
          d="M11.025 3.63a1.5 1.5 0 0 1 1.95 0l7.6 6.515a1 1 0 0 1-1.3 1.52L19 11.43V19a2.25 2.25 0 0 1-2.25 2.25h-9.5A2.25 2.25 0 0 1 5 19v-7.57l-.275.235a1 1 0 1 1-1.3-1.52l7.6-6.515ZM9.25 21.25v-5.5A1.75 1.75 0 0 1 11 14h2a1.75 1.75 0 0 1 1.75 1.75v5.5h-5.5Z"
        />
      );
    case 'search':
      return (
        <Path
          fill={color}
          fillRule="evenodd"
          clipRule="evenodd"
          d="M10.75 3a7.75 7.75 0 1 0 4.77 13.86l3.773 3.773a1 1 0 0 0 1.414-1.414l-3.81-3.81A7.75 7.75 0 0 0 10.75 3Zm-5.5 7.75a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0Z"
        />
      );
    case 'watchlist':
      return (
        <Path
          fill={color}
          d="M8.5 2.75A3.25 3.25 0 0 0 5.25 6v14.25a1.25 1.25 0 0 0 1.828 1.108L12 18.79l4.922 2.568a1.25 1.25 0 0 0 1.828-1.108V6a3.25 3.25 0 0 0-3.25-3.25h-7Z"
        />
      );
    case 'download':
      return (
        <>
          <Path
            fill={color}
            d="M10.75 3.25a1.25 1.25 0 0 1 2.5 0v8.232l2.116-2.116a1.25 1.25 0 1 1 1.768 1.768l-4.25 4.25a1.25 1.25 0 0 1-1.768 0l-4.25-4.25a1.25 1.25 0 0 1 1.768-1.768l2.116 2.116V3.25Z"
          />
          <Path
            fill={color}
            d="M3.25 17.25A2.75 2.75 0 0 1 6 14.5h1.25a1.25 1.25 0 0 1 0 2.5H6a.25.25 0 0 0-.25.25V19c0 .138.112.25.25.25h12a.25.25 0 0 0 .25-.25v-1.75A.25.25 0 0 0 18 17h-1.25a1.25 1.25 0 0 1 0-2.5H18a2.75 2.75 0 0 1 2.75 2.75V19A2.75 2.75 0 0 1 18 21.75H6A2.75 2.75 0 0 1 3.25 19v-1.75Z"
          />
        </>
      );
    case 'settings':
      return (
        <Path
          fill={color}
          fillRule="evenodd"
          clipRule="evenodd"
          d="M9.393 2.75A1.25 1.25 0 0 1 10.57 1.9h2.86a1.25 1.25 0 0 1 1.177.83l.474 1.329a1 1 0 0 0 1.31.59l1.277-.554a1.25 1.25 0 0 1 1.58.52l1.43 2.477a1.25 1.25 0 0 1-.4 1.615l-1.104.857a1 1 0 0 0 0 1.578l1.103.856a1.25 1.25 0 0 1 .4 1.616l-1.429 2.476a1.25 1.25 0 0 1-1.58.52l-1.276-.553a1 1 0 0 0-1.311.59l-.474 1.328a1.25 1.25 0 0 1-1.177.83h-2.86a1.25 1.25 0 0 1-1.177-.83l-.474-1.329a1 1 0 0 0-1.31-.59l-1.277.554a1.25 1.25 0 0 1-1.58-.52l-1.43-2.477a1.25 1.25 0 0 1 .4-1.615l1.104-.857a1 1 0 0 0 0-1.578l-1.103-.856a1.25 1.25 0 0 1-.4-1.616l1.429-2.476a1.25 1.25 0 0 1 1.58-.52l1.276.553a1 1 0 0 0 1.311-.59l.474-1.328ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        />
      );
  }
};

export const OutlineTabIcon = ({
  name,
  color,
  progress,
}: {
  name: AnimatedTabIconName;
  color: string;
  progress: SharedValue<number>;
}) => {
  switch (name) {
    case 'home':
      return (
        <>
          <AnimatedStrokePath
            progress={progress}
            color={color}
            end={0.42}
            d="M3.75 10.45 10.7 4.5a2 2 0 0 1 2.6 0l6.95 5.95"
          />
          <AnimatedStrokePath
            progress={progress}
            color={color}
            start={0.12}
            end={0.78}
            d="M5.5 9.25V19A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V9.25"
          />
          <AnimatedStrokePath
            progress={progress}
            color={color}
            start={0.48}
            d="M9.5 20.5v-5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5"
          />
        </>
      );
    case 'search':
      return (
        <>
          <AnimatedStrokeCircle
            progress={progress}
            color={color}
            cx={10.75}
            cy={10.75}
            r={6.75}
            end={0.74}
          />
          <RotatingPart
            progress={progress}
            start={0.48}
            end={1}
            from={-55}
            originX={15.75}
            originY={15.75}>
            <AnimatedStrokePath
              progress={progress}
              color={color}
              start={0.48}
              d="m15.75 15.75 4.25 4.25"
            />
          </RotatingPart>
        </>
      );
    case 'watchlist':
      return (
        <>
          <AnimatedStrokePath
            progress={progress}
            color={color}
            end={0.74}
            d="M6.25 20.5V5.75A2.25 2.25 0 0 1 8.5 3.5h7a2.25 2.25 0 0 1 2.25 2.25V20.5"
          />
          <RotatingPart
            progress={progress}
            start={0.44}
            end={0.9}
            from={-48}
            originX={12}
            originY={17.5}>
            <AnimatedStrokePath
              progress={progress}
              color={color}
              start={0.44}
              end={0.9}
              d="m6.25 20.5 5.75-3"
            />
          </RotatingPart>
          <RotatingPart
            progress={progress}
            start={0.54}
            end={1}
            from={48}
            originX={12}
            originY={17.5}>
            <AnimatedStrokePath
              progress={progress}
              color={color}
              start={0.54}
              d="m12 17.5 5.75 3"
            />
          </RotatingPart>
        </>
      );
    case 'download':
      return (
        <>
          <AnimatedStrokePath
            progress={progress}
            color={color}
            end={0.52}
            d="M12 3.5v10.25"
          />
          <RotatingPart
            progress={progress}
            start={0.22}
            end={0.72}
            from={-45}
            originX={12}
            originY={13.75}>
            <AnimatedStrokePath
              progress={progress}
              color={color}
              start={0.22}
              end={0.72}
              d="m12 13.75 4-4"
            />
          </RotatingPart>
          <RotatingPart
            progress={progress}
            start={0.22}
            end={0.72}
            from={45}
            originX={12}
            originY={13.75}>
            <AnimatedStrokePath
              progress={progress}
              color={color}
              start={0.22}
              end={0.72}
              d="m12 13.75-4-4"
            />
          </RotatingPart>
          <AnimatedStrokePath
            progress={progress}
            color={color}
            start={0.45}
            d="M4.5 16.5V19A1.5 1.5 0 0 0 6 20.5h12a1.5 1.5 0 0 0 1.5-1.5v-2.5"
          />
        </>
      );
    case 'settings':
      return (
        <>
          <RotatingPart
            progress={progress}
            start={0}
            end={0.82}
            from={-24}
            originX={12}
            originY={10.5}>
            <AnimatedStrokePath
              progress={progress}
              color={color}
              end={0.82}
              strokeWidth={1.8}
              d="M9.68 4.18 10.1 3h3.8l.42 1.18a2 2 0 0 0 2.62 1.18l1.13-.49 1.9 3.28-.98.76a2 2 0 0 0 0 3.18l.98.76-1.9 3.28-1.13-.49a2 2 0 0 0-2.62 1.18L13.9 18h-3.8l-.42-1.18a2 2 0 0 0-2.62-1.18l-1.13.49-1.9-3.28.98-.76a2 2 0 0 0 0-3.18l-.98-.76 1.9-3.28 1.13.49a2 2 0 0 0 2.62-1.18Z"
            />
          </RotatingPart>
          <AnimatedStrokeCircle
            progress={progress}
            color={color}
            cx={12}
            cy={10.5}
            r={2.75}
            start={0.48}
            strokeWidth={1.8}
          />
        </>
      );
  }
};
