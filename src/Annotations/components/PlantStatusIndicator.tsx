import React from 'react';
import { Text } from 'react-native';
import Ionicons from '@react-native-vector-icons/material-icons';
import { LeafAnnotation } from '../../types/AnnotationTypes';
import { SyncEntry } from '../../types/SyncTypes';
import {
  getLeafSyncUIState,
  LeafSyncUIConfig,
  LeafSyncSeverity,
  LeafSyncUIState
} from '../utils/LeafSyncUIState';

type LeafSyncMapEntry = {
  annotation: LeafAnnotation;
  entry?: SyncEntry;
};

export const getPlantSyncDisplayState = (
  leafSyncMap: LeafSyncMapEntry[]
) => {
  if (!leafSyncMap.length) {
    const uiState: LeafSyncUIState = 'incomplete';

    return {
      uiState,
      config: LeafSyncUIConfig[uiState],
      avgDefoliation: 0,
      isCompleted: false,
    };
  }

  const leafStates = leafSyncMap.map(({ annotation, entry }) =>
    getLeafSyncUIState(annotation, entry)
  );

  const lowestState = leafStates.reduce((lowest, current) =>
    LeafSyncSeverity[current] < LeafSyncSeverity[lowest]
      ? current
      : lowest
  );

  const completedLeaves = leafSyncMap.filter(
    ({ annotation, entry }) =>
      getLeafSyncUIState(annotation, entry) === 'completed'
  );

  const avgDefoliation =
    completedLeaves.length > 0
      ? completedLeaves.reduce((sum, { entry }) => {
          return (
            sum +
            (entry?.inferenceResponse?.results?.defoliation ?? 0)
          );
        }, 0) / completedLeaves.length
      : 0;

  return {
    uiState: lowestState,
    config: LeafSyncUIConfig[lowestState],
    avgDefoliation,
    isCompleted: lowestState === 'completed',
  };
};


export const PlantStatusIndicator = ({
  displayState,
}: {
  displayState: ReturnType<typeof getPlantSyncDisplayState>;
}) => {
  const { config, isCompleted, avgDefoliation } = displayState;

  if (isCompleted) {
    return (
      <Text
        style={{
          fontSize: 16,
          color: config.color,
        }}
      >
        {Math.round(avgDefoliation)}%
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