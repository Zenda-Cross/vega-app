import renderer, {act} from 'react-test-renderer';
import {useStreamResumePosition} from '../src/lib/hooks/useStreamResumePosition';

const videoPositionRef = {current: {position: 0}};
let resume: ReturnType<typeof useStreamResumePosition>;
const Harness = ({
  episode,
  stream,
  saved,
}: {
  episode: string;
  stream: object;
  saved: number;
}) => {
  resume = useStreamResumePosition({
    episodeKey: episode,
    stream,
    savedPosition: saved,
    videoPositionRef,
  });
  return null;
};

const serverA = {link: 'a'};
const serverB = {link: 'b'};
const serverC = {link: 'c'};

let tree: renderer.ReactTestRenderer | undefined;
const render = (episode: string, stream: object, saved: number) =>
  act(() => {
    const element = <Harness episode={episode} stream={stream} saved={saved} />;
    if (tree) {
      tree.update(element);
    } else {
      tree = renderer.create(element);
    }
  });

// The player loads the current source and plays on to a position.
const loadAndPlayTo = (position: number) => {
  resume.markStreamLoaded();
  videoPositionRef.current.position = position;
};

beforeEach(() => {
  videoPositionRef.current.position = 0;
});

afterEach(() => {
  act(() => tree?.unmount());
  tree = undefined;
});

it('starts the first stream of an episode from its saved progress', () => {
  render('ep1', serverA, 600);
  expect(resume.getStartPosition()).toBe(600);
});

it('keeps the live position when switching server mid-playback', () => {
  render('ep1', serverA, 600);
  loadAndPlayTo(2400);
  render('ep1', serverB, 600);
  expect(resume.getStartPosition()).toBe(2400);
});

it('keeps the live position after the saved progress counted as watched', () => {
  // Saved progress past 85% resumes from 0.
  render('ep1', serverA, 0);
  loadAndPlayTo(1800);
  render('ep1', serverB, 0);
  expect(resume.getStartPosition()).toBe(1800);
});

it('keeps the carried position when the next server fails before loading', () => {
  render('ep1', serverA, 600);
  loadAndPlayTo(2400);
  render('ep1', serverB, 600);
  render('ep1', serverC, 600);
  expect(resume.getStartPosition()).toBe(2400);
});

it('uses the saved progress when the first server fails before loading', () => {
  render('ep1', serverA, 600);
  render('ep1', serverB, 600);
  expect(resume.getStartPosition()).toBe(600);
});

it('uses the new episode saved progress after an episode change', () => {
  render('ep1', serverA, 600);
  loadAndPlayTo(2400);
  render('ep2', serverA, 120);
  // The old episode's video can still report progress until the stream resets.
  videoPositionRef.current.position = 2410;
  render('ep2', {link: ''}, 120);
  render('ep2', serverB, 120);
  expect(resume.getStartPosition()).toBe(120);
  loadAndPlayTo(300);
  render('ep2', serverC, 120);
  expect(resume.getStartPosition()).toBe(300);
});

it('follows saved progress that arrives late for the first stream', () => {
  render('ep1', serverA, 0);
  render('ep1', serverA, 900);
  expect(resume.getStartPosition()).toBe(900);
});

it('keeps the position a playing stream is reloaded at', () => {
  render('ep1', serverA, 600);
  loadAndPlayTo(2400);
  resume.keepPosition(2400);
  expect(resume.getStartPosition()).toBe(2400);
  // A server switch after the reload still follows the live position.
  loadAndPlayTo(2500);
  render('ep1', serverB, 600);
  expect(resume.getStartPosition()).toBe(2500);
});
