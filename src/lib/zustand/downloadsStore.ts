import {create} from 'zustand';

export interface Downloads {
  currentDownload: string;
  activeDownloads: String[];
  setCurrentDownload: (download: string) => void;
  setActiveDownloads: (playload: string) => void;
  removeActiveDownloads: (download: string) => void;
}

const useDownloadsStore = create<Downloads>(set => ({
  currentDownload: '',
  activeDownloads: [],
  setCurrentDownload: (download: string) => set({currentDownload: download}),
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
