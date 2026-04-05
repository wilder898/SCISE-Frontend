export type ScannerMode = "camera";

export type ScannerStatus =
  | "idle"
  | "checking-support"
  | "requesting-permission"
  | "ready"
  | "scanning"
  | "detected"
  | "stopped"
  | "error";

export type ScannerErrorCode =
  | "not_supported"
  | "invalid_target"
  | "permission_denied"
  | "no_camera"
  | "stream_error"
  | "playback_error"
  | "detection_error";

export interface ScannerDetectedPayload {
  mode: ScannerMode;
  value: string;
  format?: string;
  detectedAt: string;
}

export interface ScannerCameraDevice {
  id: string;
  label: string;
}

export interface ScannerErrorPayload {
  code: ScannerErrorCode;
  message: string;
  cause?: unknown;
}

export interface ScannerStatusPayload {
  mode: ScannerMode;
  status: ScannerStatus;
  message: string;
}

export interface CameraScannerOptions {
  videoElement: HTMLVideoElement;
  formats?: string[];
  facingMode?: "user" | "environment";
  onDetected?: (payload: ScannerDetectedPayload) => void;
  onError?: (payload: ScannerErrorPayload) => void;
  onStatusChange?: (payload: ScannerStatusPayload) => void;
}

export interface ScannerControllerOptions {
  inputElement: HTMLInputElement;
  videoElement: HTMLVideoElement;
  formats?: string[];
  facingMode?: "user" | "environment";
  onDetected?: (payload: ScannerDetectedPayload) => void;
  onError?: (payload: ScannerErrorPayload) => void;
  onStatusChange?: (payload: ScannerStatusPayload) => void;
}
