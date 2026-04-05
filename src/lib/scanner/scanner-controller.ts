import { CameraScanner } from "./scanner-camera";
import type {
  ScannerCameraDevice,
  ScannerControllerOptions,
  ScannerDetectedPayload,
  ScannerErrorPayload,
  ScannerStatusPayload,
} from "./scanner-types";

export class ScannerController {
  private readonly inputElement: HTMLInputElement;
  private readonly cameraScanner: CameraScanner;
  private readonly onDetected?: (payload: ScannerDetectedPayload) => void;
  private readonly onError?: (payload: ScannerErrorPayload) => void;
  private readonly onStatusChange?: (payload: ScannerStatusPayload) => void;

  constructor(options: ScannerControllerOptions) {
    this.inputElement = options.inputElement;
    this.onDetected = options.onDetected;
    this.onError = options.onError;
    this.onStatusChange = options.onStatusChange;

    this.cameraScanner = new CameraScanner({
      videoElement: options.videoElement,
      formats: options.formats,
      facingMode: options.facingMode,
      onDetected: (payload) => {
        this.applyDetectedValue(payload.value);
        this.onDetected?.(payload);
      },
      onError: (payload) => {
        this.onError?.(payload);
      },
      onStatusChange: (payload) => {
        this.onStatusChange?.(payload);
      },
    });
  }

  static isCameraSupported() {
    return CameraScanner.isSupported();
  }

  static listCameraDevices(): Promise<ScannerCameraDevice[]> {
    return CameraScanner.listVideoDevices();
  }

  startCamera() {
    return this.cameraScanner.start();
  }

  stopCamera() {
    this.cameraScanner.stop();
  }

  setCameraDevice(deviceId: string | null) {
    this.cameraScanner.setDeviceId(deviceId);
  }

  captureAndDetect() {
    return this.cameraScanner.captureAndDetect();
  }

  private applyDetectedValue(value: string) {
    this.inputElement.value = value;
    this.inputElement.dispatchEvent(new Event("input", { bubbles: true }));
    this.inputElement.dispatchEvent(new Event("change", { bubbles: true }));
    this.inputElement.focus();
    this.inputElement.select();
  }
}
