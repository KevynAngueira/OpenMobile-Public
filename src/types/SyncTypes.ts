import { FieldAnnotation, PlantAnnotation, LeafAnnotation } from "./AnnotationTypes";

// types/SyncTypes.ts
export interface SyncEntry {
  id: string;
  videoPath: string;
  params?: Record<string, any>;
  leafConfig?: Record<string, any>;

  videoUploadStatus: 'new' | 'uploading' | 'uploaded' | 'failed';
  paramUploadStatus: 'new' | 'uploading' | 'uploaded' | 'failed';
  videoUploadResponse?: any;
  paramUploadResponse?: any;
  
  inferenceStatus: 'new' | 'waiting' | 'running' | 'completed' | 'failed';  
  inferenceResponse?: any;
}

export interface ManifestSyncEntry {
  endpoint: string;
  artifact: any;
  manifestConfig: Record<string, string>;
}

export interface PlantArtifact {
  id: string;
  name: string;
  fieldId: string;
  leaves: string[];
}

export interface FieldArtifact {
  id: string;
  name: string;
  plants: string[];
}