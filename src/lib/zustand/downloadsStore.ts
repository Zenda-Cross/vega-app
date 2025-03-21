import {create} from 'zustand';

interface Playload {
  title: string;
  url: string;
  fileName: string;
  fileType: string;
}

export interface Downloads {
  activeDownloads: Playload[];
  addActiveDownload: (playload: Playload) => void;
  removeActiveDownload: (download: string) => void;
}

const useDownloadsStore = create<Downloads>(set => ({
  activeDownloads: [],
  addActiveDownload: (playload: Playload) =>
    set(state => ({
      activeDownloads: [...state.activeDownloads, playload],
    })),
  removeActiveDownload: (download: string) =>
    set(state => ({
      activeDownloads: state.activeDownloads.filter(
        item => item.fileName !== download,
      ),
    })),
}));

export default useDownloadsStore;
