import {create} from 'zustand';
import {Post} from '../providers/types';

export interface Hero {
  hero: Post;
  setHero: (hero: Hero['hero']) => void;
}

const useHeroStore = create<Hero>(set => ({
  hero: {title: '', link: '', image: ''},
  setHero: hero => set({hero}),
}));

export default useHeroStore;
