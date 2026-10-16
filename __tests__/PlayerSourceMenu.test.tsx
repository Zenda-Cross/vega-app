import React from 'react';
import renderer, {act} from 'react-test-renderer';
import PlayerSourceMenu from '../src/components/PlayerSourceMenu';
import PlayerMenuRow from '../src/components/PlayerMenuRow';
import type {Stream} from '../src/lib/providers/types';

const mockRowRender = jest.fn();
let mockIsTV = false;
jest.mock('../src/lib/tv/constants', () => ({
  get isTV() {
    return mockIsTV;
  },
}));
jest.mock('../src/components/PlayerMenuRow', () => {
  const ReactModule = require('react');
  return {
    __esModule: true,
    default: ReactModule.forwardRef((props: {title: string}, ref: unknown) => {
      mockRowRender(props.title);
      return ReactModule.createElement('MenuRow', {...props, ref});
    }),
  };
});

const streams: Stream[] = Array.from({length: 200}, (_, index) => ({
  server: `Server ${index}`,
  link: `https://files.example/${index}.mp4`,
  type: 'mp4',
  quality: '1080',
  tags: ['1080', 'HDR'],
}));
const props = {
  streams,
  selectedUrl: streams[0].link,
  isLocal: false,
  videoTracks: [
    {index: 7, height: 1080, bitrate: 5000000},
    {index: 3, height: 720, bitrate: 2000000},
  ],
  selectedQualityIndex: 1000,
  videoLoaded: true,
  loading: false,
  accentColor: '#ffffff',
  preferredRef: React.createRef<any>(),
  getQualityIcon: () => 'hd' as const,
  onSelectStream: jest.fn(),
  onSelectQuality: jest.fn(),
  onSelectLocal: jest.fn(),
  onTVFocus: jest.fn(),
};

beforeEach(() => {
  mockIsTV = false;
  jest.clearAllMocks();
});

it('mounts a small visible server window instead of all 200 rows on opening', () => {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<PlayerSourceMenu {...props} />);
  });
  const rows = tree.root.findAllByType(PlayerMenuRow);
  const servers = rows.filter(row => row.props.title.startsWith('Server '));
  expect(servers.length).toBeGreaterThan(0);
  expect(servers.length).toBeLessThanOrEqual(6);
  expect(servers[0].props.tags).toEqual(['HDR']);
  act(() => tree.unmount());
});

it('keeps server rows unchanged during unrelated updates and quality selections', () => {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<PlayerSourceMenu {...props} />);
  });
  const serverRenders = () =>
    mockRowRender.mock.calls.filter(([title]) => title.startsWith('Server '))
      .length;
  const initial = serverRenders();
  act(() => tree.update(<PlayerSourceMenu {...props} />));
  expect(serverRenders()).toBe(initial);
  act(() =>
    tree.update(<PlayerSourceMenu {...props} selectedQualityIndex={1} />),
  );
  expect(serverRenders()).toBe(initial);
  act(() => tree.unmount());
});

it('preserves stream objects and quality indexes when selecting visible rows', () => {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<PlayerSourceMenu {...props} />);
  });
  const select = (title: string) =>
    act(() => {
      tree.root
        .findAllByType(PlayerMenuRow)
        .find(row => row.props.title === title)!
        .props.onPress();
    });
  select('Server 1');
  expect(props.onSelectStream).toHaveBeenCalledWith(streams[1]);
  select('720p');
  expect(props.onSelectQuality).toHaveBeenCalledWith(1);
  select('Auto');
  expect(props.onSelectQuality).toHaveBeenCalledWith(1000);
  select('Local video');
  expect(props.onSelectLocal).toHaveBeenCalledTimes(1);
  act(() => tree.unmount());
});

it('shows live resolution under Auto without changing the adaptive selection or repainting server rows', () => {
  let tree!: renderer.ReactTestRenderer;
  act(() => {tree = renderer.create(<PlayerSourceMenu {...props} activeResolution="720p" />);});
  const auto = () => tree.root.findAllByType(PlayerMenuRow).find(row => row.props.title === 'Auto')!;
  expect(auto().props.detail).toBe('Adaptive bitrate · 720p');
  expect(auto().props.selected).toBe(true);
  const renders = mockRowRender.mock.calls.filter(([title]) => title.startsWith('Server ')).length;
  act(() => tree.update(<PlayerSourceMenu {...props} activeResolution="1080p" />));
  expect(auto().props.detail).toBe('Adaptive bitrate · 1080p');
  expect(mockRowRender.mock.calls.filter(([title]) => title.startsWith('Server ')).length).toBe(renders);
  act(() => tree.update(<PlayerSourceMenu {...props} />));
  expect(auto().props.detail).toBe('Adaptive bitrate');
  act(() => tree.unmount());
});

const tvStreams = streams.slice(0, 2);

const rowByTitle = (tree: renderer.ReactTestRenderer, title: string) =>
  tree.root.findAllByType(PlayerMenuRow).find(row => row.props.title === title)!;

it('focuses the first online server when a local file is selected', () => {
  mockIsTV = true;
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <PlayerSourceMenu
        {...props}
        streams={tvStreams}
        selectedUrl="file:///downloads/movie.mp4"
        isLocal
      />,
    );
  });
  const first = rowByTitle(tree, 'Server 0');
  const second = rowByTitle(tree, 'Server 1');
  expect(first.props.ref).toBe(props.preferredRef);
  expect(first.props.hasTVPreferredFocus).toBe(true);
  expect(first.props.selected).toBe(false);
  expect(second.props.hasTVPreferredFocus).toBe(false);
  expect(rowByTitle(tree, 'Local video').props.selected).toBe(true);
  act(() => first.props.onPress());
  expect(props.onSelectStream).toHaveBeenCalledWith(tvStreams[0]);
  act(() => tree.unmount());
});

it('keeps focus and selection on the matching online server', () => {
  mockIsTV = true;
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <PlayerSourceMenu
        {...props}
        streams={tvStreams}
        selectedUrl={tvStreams[1].link}
        isLocal={false}
      />,
    );
  });
  const first = rowByTitle(tree, 'Server 0');
  const second = rowByTitle(tree, 'Server 1');
  expect(second.props.ref).toBe(props.preferredRef);
  expect(second.props.hasTVPreferredFocus).toBe(true);
  expect(second.props.selected).toBe(true);
  expect(first.props.hasTVPreferredFocus).toBe(false);
  expect(first.props.selected).toBe(false);
  act(() => tree.unmount());
});

it('assigns no preferred server row when the server list is empty', () => {
  mockIsTV = true;
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <PlayerSourceMenu
        {...props}
        streams={[]}
        selectedUrl=""
        isLocal={false}
        loading
      />,
    );
  });
  const rows = tree.root.findAllByType(PlayerMenuRow);
  expect(rows.some(row => row.props.ref === props.preferredRef)).toBe(false);
  expect(rows.some(row => row.props.hasTVPreferredFocus)).toBe(false);
  act(() => rowByTitle(tree, '720p').props.onPress());
  expect(props.onSelectQuality).toHaveBeenCalledWith(1);
  act(() => tree.unmount());
});
