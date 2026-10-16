import React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {Control} from '../Control';

interface BackProps {
  onBack: () => void;
  resetControlTimeout?: () => void;
  showControls: boolean;
  scale?: number;
}

export const Back = ({onBack, showControls, scale = 1}: BackProps) => {
  return (
    <Control callback={onBack} disabled={!showControls}>
      <MaterialIcons
        name="arrow-back-ios-new"
        size={24 * scale}
        color="rgba(255,255,255,0.68)"
      />
    </Control>
  );
};
