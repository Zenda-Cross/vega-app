import {create} from 'zustand';

export interface Downloads {
  activeDownloads: String[];
  setActiveDownloads: (download: string) => void;
  removeActiveDownloads: (download: string) => void;
}

const useDownloadsStore = create<Downloads>(set => ({
  activeDownloads: [],
  setActiveDownloads: (download: string) =>
    set(state => ({
      activeDownloads: state.activeDownloads.includes(download)
        ? state.activeDownloads
        : [...state.activeDownloads, download],
    })),
  removeActiveDownloads: (download: string) =>
    set(state => ({
      activeDownloads: state.activeDownloads.filter(item => item !== download),
    })),
}));

export default useDownloadsStore;
