import {getPlayerVolumeLevels} from '../src/lib/playerVolume';

describe('local player volume boost', () => {
  it('uses system volume below 100% without attenuating twice', () => {
    expect(getPlayerVolumeLevels(0.45, 2)).toEqual({level: 0.45, system: 0.45, boost: 1});
    expect(getPlayerVolumeLevels(0, 2)).toEqual({level: 0, system: 0, boost: 1});
  });

  it('keeps system volume at 100% while amplifying up to 200%', () => {
    expect(getPlayerVolumeLevels(1.5, 2)).toEqual({level: 1.5, system: 1, boost: 1.5});
    expect(getPlayerVolumeLevels(3, 2)).toEqual({level: 2, system: 1, boost: 2});
  });

  it('caps both controls at 100% when boosting is disabled or unsupported', () => {
    expect(getPlayerVolumeLevels(1.8, 1)).toEqual({level: 1, system: 1, boost: 1});
  });

  it('handles invalid input and rounds gesture noise to percentage steps', () => {
    expect(getPlayerVolumeLevels(NaN, 2)).toEqual({level: 0, system: 0, boost: 1});
    expect(getPlayerVolumeLevels(-1, 2)).toEqual({level: 0, system: 0, boost: 1});
    expect(getPlayerVolumeLevels(1.23456, 2).level).toBe(1.23);
  });
});
