import React from 'react';
import renderer, {act} from 'react-test-renderer';
import PlayerSourceMenu from '../src/components/PlayerSourceMenu';
import PlayerMenuRow from '../src/components/PlayerMenuRow';
import type {Stream} from '../src/lib/providers/types';

const mockRowRender = jest.fn();
jest.mock('../src/lib/tv/constants', () => ({isTV: false}));
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

beforeEach(() => jest.clearAllMocks());

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
