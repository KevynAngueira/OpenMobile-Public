import React from 'react';
import { Text } from 'react-native';
import Ionicons from '@react-native-vector-icons/material-icons';
import { LeafAnnotation } from '../../types/AnnotationTypes';
import { SyncEntry } from '../../types/SyncTypes';
import {
  getLeafSyncUIState,
  LeafSyncUIConfig
} from '../utils/LeafSyncUIState';
import { getDefoliationValue } from '../utils/DefoliationValues';


export const getLeafSyncDisplayState = (
  annotation: LeafAnnotation,
  entry?: SyncEntry
) => {
  const uiState = getLeafSyncUIState(annotation, entry);
  const config = LeafSyncUIConfig[uiState];

  const defoliationValue = getDefoliationValue(entry);

  return {
    uiState,
    config,
    defoliationValue,
    isCompleted: uiState === 'completed',
  };
};

export const LeafStatusIndicator = ({
  displayState,
}: {
  displayState: ReturnType<typeof getLeafSyncDisplayState>;
}) => {
  const { config, isCompleted, defoliationValue } = displayState;

  if (isCompleted) {
    return (
      <Text style={{ fontSize: 16, color: config.color }}>
        {Math.round(defoliationValue)}%
      </Text>
    );
  }

  return (
    <Ionicons
      name={config.icon!}
      size={18}
      color={config.color}
    />
  );
};