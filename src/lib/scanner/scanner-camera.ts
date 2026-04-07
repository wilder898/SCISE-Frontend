import {
  BarcodeFormat,
  BrowserCodeReader,
  BrowserMultiFormatOneDReader,
  type IScannerControls,
} from "@zxing/browser";
import { DecodeHintType, NotFoundException } from "@zxing/library";
import type {
  ScannerCameraAvailability,
  CameraScannerOptions,
  ScannerCameraDevice,
  ScannerDetectedPayload,
  ScannerErrorCode,
  ScannerErrorPayload,
  ScannerStatus,
} from "./scanner-types";

interface DetectedBarcodeLike {
  rawValue?: string;
  format?: string;
}

interface BarcodeDetectorLike {
  detect(source: ImageBitmapSource): Promise<DetectedBarcodeLike[]>;
}

interface BarcodeDetectorConstructorLike {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
}

type NavigatorWithMediaDevices = Navigator & {
  mediaDevices?: MediaDevices;
  permissions?: Permissions;
};

type ScannerEngine = "native" | "zxing";
type ExtendedMediaTrackCapabilities = MediaTrackCapabilities & {
  focusMode?: string[];
  focusDistance?: { min?: number; max?: number };
};

const CAMERA_MODE = "camera" as const;
const DEFAULT_NATIVE_FORMATS = ["code_128", "ean_13", "ean_8", "code_39", "codabar"];
const DEFAULT_ZXING_FORMATS = [
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.CODABAR,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.ITF,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
];

function getBarcodeDetectorConstructor(): BarcodeDetectorConstructorLike | null {
  const globalWindow = window as Window & {
    BarcodeDetector?: BarcodeDetectorConstructorLike;
  };

  return globalWindow.BarcodeDetector ?? null;
}

function hasCameraAccessSupport() {
  const navigatorWithMedia = navigator as NavigatorWithMediaDevices;
  return Boolean(navigatorWithMedia.mediaDevices?.getUserMedia);
}

function hasSecureCameraContext() {
  if (window.isSecureContext) {
    return true;
  }

  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

async function getCameraPermissionState(): Promise<PermissionState | "unknown"> {
  const navigatorWithPermissions = navigator as NavigatorWithMediaDevices;

  if (!navigatorWithPermissions.permissions?.query) {
    return "unknown";
  }

  try {
    const status = await navigatorWithPermissions.permissions.query({
      name: "camera" as PermissionName,
    });
    return status.state;
  } catch {
    return "unknown";
  }
}

export class CameraScanner {
  private readonly videoElement: HTMLVideoElement;
  private readonly nativeFormats: string[];
  private readonly facingMode: "user" | "environment";
  private readonly onDetected?: (payload: ScannerDetectedPayload) => void;
  private readonly onError?: (payload: ScannerErrorPayload) => void;
  private readonly onStatusChange?: CameraScannerOptions["onStatusChange"];

  private stream: MediaStream | null = null;
  private detector: BarcodeDetectorLike | null = null;
  private animationFrameId: number | null = null;
  private zxingControls: IScannerControls | null = null;
  private zxingReader: BrowserMultiFormatOneDReader | null = null;
  private isRunning = false;
  private lastDetectedValue = "";
  private engine: ScannerEngine | null = null;
  private selectedDeviceId: string | null = null;

  constructor(options: CameraScannerOptions) {
    this.videoElement = options.videoElement;
    this.nativeFormats = options.formats?.length ? options.formats : DEFAULT_NATIVE_FORMATS;
    this.facingMode = options.facingMode ?? "environment";
    this.onDetected = options.onDetected;
    this.onError = options.onError;
    this.onStatusChange = options.onStatusChange;
  }

  static isSupported() {
    return hasCameraAccessSupport();
  }

  static async getAvailability(): Promise<ScannerCameraAvailability> {
    const secureContext = hasSecureCameraContext();

    if (!secureContext) {
      return {
        supported: false,
        secureContext: false,
        permission: "unknown",
        message:
          "La cámara solo puede usarse en un contexto seguro. Abre la aplicación en localhost o HTTPS.",
      };
    }

    if (!hasCameraAccessSupport()) {
      return {
        supported: false,
        secureContext: true,
        permission: "unknown",
        message: "Este navegador no expone acceso a la cámara desde esta página.",
      };
    }

    const permission = await getCameraPermissionState();

    if (permission === "denied") {
      return {
        supported: false,
        secureContext: true,
        permission,
        message:
          "El permiso de cámara está bloqueado en el navegador. Habilítalo en la configuración del sitio.",
      };
    }

    return {
      supported: true,
      secureContext: true,
      permission,
      message:
        permission === "prompt"
          ? "La cámara solicitará permiso al iniciar el lector."
          : "La cámara está disponible para el escaneo.",
    };
  }

  static async listVideoDevices(): Promise<ScannerCameraDevice[]> {
    if (!hasCameraAccessSupport()) {
      return [];
    }

    try {
      const devices = await BrowserCodeReader.listVideoInputDevices();
      return devices.map((device, index) => ({
        id: device.deviceId,
        label: device.label?.trim() || `Camara ${index + 1}`,
      }));
    } catch {
      return [];
    }
  }

  setDeviceId(deviceId: string | null) {
    this.selectedDeviceId = deviceId && deviceId.trim() ? deviceId.trim() : null;
  }

  async start() {
    if (this.isRunning) {
      return;
    }

    this.emitStatus("checking-support", "Validando soporte del lector de cámara...");

    if (!hasCameraAccessSupport()) {
      this.emitError(
        "not_supported",
        "El navegador no permite acceder a la camara desde esta pagina."
      );
      return;
    }

    if (!hasSecureCameraContext()) {
      this.emitError(
        "insecure_context",
        "La camara solo puede usarse en localhost o HTTPS."
      );
      return;
    }

    this.lastDetectedValue = "";

    const BarcodeDetectorCtor = getBarcodeDetectorConstructor();
    if (BarcodeDetectorCtor) {
      try {
        this.detector = new BarcodeDetectorCtor({ formats: this.nativeFormats });
        this.engine = "native";
      } catch {
        this.detector = null;
        this.engine = null;
      }
    }

    if (this.engine === "native") {
      await this.startNativeScanner();
      return;
    }

    await this.startZxingScanner();
  }

  stop() {
    this.isRunning = false;

    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.zxingControls) {
      this.zxingControls.stop();
      this.zxingControls = null;
    }

    this.stopStream();
    this.videoElement.pause();
    this.videoElement.removeAttribute("src");
    this.videoElement.srcObject = null;
    BrowserCodeReader.cleanVideoSource(this.videoElement);
    this.emitStatus("stopped", "Camara detenida.");
  }

  async captureAndDetect() {
    if (!this.videoElement.videoWidth || !this.videoElement.videoHeight) {
      this.emitError(
        "detection_error",
        "La cámara aún no tiene una imagen lista para capturar."
      );
      return null;
    }

    this.emitStatus("scanning", "Analizando captura del carnet...");
    const canvas = BrowserCodeReader.createCanvasFromMediaElement(this.videoElement);

    if (this.engine === "native" && this.detector) {
      try {
        const barcodes = await this.detector.detect(canvas);
        const detected = barcodes.find((barcode) => Boolean(barcode.rawValue?.trim()));
        if (detected?.rawValue?.trim()) {
          const payload = this.buildDetectedPayload(
            detected.rawValue.trim(),
            detected.format
          );
          this.handleDetected(payload);
          return payload;
        }
      } catch (error) {
        this.emitError(
          "detection_error",
          "No fue posible analizar la captura del carnet.",
          error
        );
        return null;
      }
    }

    try {
      const reader = this.getOrCreateZxingReader();
      const result = reader.decodeFromCanvas(canvas);
      const value = result.getText().trim();
      if (!value) {
        this.emitError(
          "detection_error",
          "No se detectó un código legible en la captura."
        );
        return null;
      }

      const payload = this.buildDetectedPayload(
        value,
        result.getBarcodeFormat().toString()
      );
      this.handleDetected(payload);
      return payload;
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.emitError(
          "detection_error",
          "No se detectó un código legible en la captura."
        );
        return null;
      }

      this.emitError(
        "detection_error",
        "No fue posible analizar la captura del carnet.",
        error
      );
      return null;
    }
  }

  private async startNativeScanner() {
    this.emitStatus("requesting-permission", "Solicitando permiso para usar la cámara...");

    try {
      const navigatorWithMedia = navigator as NavigatorWithMediaDevices;

      this.stream = await navigatorWithMedia.mediaDevices!.getUserMedia({
        audio: false,
        video: this.buildPreferredVideoConstraints(),
      });
    } catch (error) {
      this.emitCameraStartError(error);
      return;
    }

    await this.enhanceVideoTrack(this.stream.getVideoTracks()[0] ?? null);

    try {
      this.videoElement.srcObject = this.stream;
      this.videoElement.playsInline = true;
      this.videoElement.muted = true;
      await this.videoElement.play();
    } catch (error) {
      this.stopStream();
      this.emitError("playback_error", "No fue posible reproducir la cámara.", error);
      return;
    }

    this.isRunning = true;
    this.emitStatus("ready", "Cámara activa. Ubica el código del carnet frente al lente.");
    void this.scanLoop();
  }

  private async startZxingScanner() {
    this.emitStatus(
      "requesting-permission",
      "Solicitando permiso para usar la cámara con lector compatible..."
    );

    this.zxingReader = this.getOrCreateZxingReader();

    const constraints: MediaStreamConstraints = {
      audio: false,
      video: this.buildPreferredVideoConstraints(),
    };

    try {
      this.isRunning = true;
      this.zxingControls = await this.zxingReader.decodeFromConstraints(
        constraints,
        this.videoElement,
        (result, error) => {
          if (result) {
            const value = result.getText().trim();
            if (!value || value === this.lastDetectedValue) {
              return;
            }

            const payload = this.buildDetectedPayload(
              value,
              result.getBarcodeFormat().toString()
            );
            this.handleDetected(payload);
            return;
          }

          if (!error || error instanceof NotFoundException) {
            this.emitStatus("scanning", "Leyendo código de barras del carnet...");
            return;
          }

          this.emitError(
            "detection_error",
            "Se produjo un error al analizar la imagen de la cámara.",
            error
          );
          this.stop();
        }
      );
    } catch (error) {
      this.isRunning = false;
      this.zxingControls = null;
      this.emitCameraStartError(error);
      return;
    }

    this.emitStatus("ready", "Cámara activa. Ubica el código del carnet frente al lente.");
    await this.enhanceVideoTrack(this.getCurrentVideoTrack());
  }

  private async scanLoop() {
    if (!this.isRunning || !this.detector) {
      return;
    }

    this.emitStatus("scanning", "Leyendo código de barras del carnet...");

    try {
      const barcodes = await this.detector.detect(this.videoElement);
      const detected = barcodes.find((barcode) => {
        const rawValue = barcode.rawValue?.trim() ?? "";
        return Boolean(rawValue);
      });

      if (detected?.rawValue) {
        const value = detected.rawValue.trim();

        if (value && value !== this.lastDetectedValue) {
          const payload = this.buildDetectedPayload(value, detected.format);
          this.handleDetected(payload);
          return;
        }
      }
    } catch (error) {
      this.emitError(
        "detection_error",
        "Se produjo un error al analizar la imagen de la cámara.",
        error
      );
      this.stop();
      return;
    }

    this.animationFrameId = window.requestAnimationFrame(() => {
      void this.scanLoop();
    });
  }

  private emitCameraStartError(error: unknown) {
    const errorName = error instanceof DOMException ? error.name : "";
    const code: ScannerErrorCode =
      errorName === "NotAllowedError" || errorName === "SecurityError"
        ? "permission_denied"
        : errorName === "NotFoundError" || errorName === "OverconstrainedError"
          ? "no_camera"
          : "stream_error";

    const message =
      code === "permission_denied"
        ? "Permiso de cámara denegado por el usuario."
        : code === "no_camera"
          ? "No se encontró una cámara disponible en el dispositivo."
          : "No fue posible iniciar la cámara.";

    this.emitError(code, message, error);
  }

  private buildPreferredVideoConstraints(): MediaTrackConstraints {
    const constraints: MediaTrackConstraints = {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      aspectRatio: { ideal: 4 / 3 },
      frameRate: { ideal: 30, max: 30 },
    };

    if (this.selectedDeviceId) {
      constraints.deviceId = { exact: this.selectedDeviceId };
    } else {
      constraints.facingMode = { ideal: this.facingMode };
    }

    return constraints;
  }

  private getOrCreateZxingReader() {
    if (this.zxingReader) {
      return this.zxingReader;
    }

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, DEFAULT_ZXING_FORMATS);
    this.zxingReader = new BrowserMultiFormatOneDReader(hints);
    return this.zxingReader;
  }

  private buildDetectedPayload(value: string, format?: string): ScannerDetectedPayload {
    return {
      mode: CAMERA_MODE,
      value,
      format,
      detectedAt: new Date().toISOString(),
    };
  }

  private handleDetected(payload: ScannerDetectedPayload) {
    if (!payload.value || payload.value === this.lastDetectedValue) {
      return;
    }

    this.lastDetectedValue = payload.value;
    this.isRunning = false;
    if (this.zxingControls) {
      this.zxingControls.stop();
      this.zxingControls = null;
    }
    this.stopStream();
    this.videoElement.pause();
    this.videoElement.srcObject = null;
    BrowserCodeReader.cleanVideoSource(this.videoElement);
    this.emitStatus("detected", `Codigo detectado: ${payload.value}`);
    this.onDetected?.(payload);
  }

  private getCurrentVideoTrack(): MediaStreamTrack | null {
    const stream = this.videoElement.srcObject;
    if (!(stream instanceof MediaStream)) {
      return null;
    }

    return stream.getVideoTracks()[0] ?? null;
  }

  private async enhanceVideoTrack(track: MediaStreamTrack | null) {
    if (!track || typeof track.applyConstraints !== "function") {
      return;
    }

    try {
      const capabilities = (typeof track.getCapabilities === "function"
        ? track.getCapabilities()
        : {}) as ExtendedMediaTrackCapabilities;

      const advanced: Array<Record<string, unknown>> = [];
      const focusModes = Array.isArray(capabilities.focusMode)
        ? capabilities.focusMode
        : [];

      if (focusModes.includes("continuous")) {
        advanced.push({ focusMode: "continuous" });
      } else if (focusModes.includes("single-shot")) {
        advanced.push({ focusMode: "single-shot" });
      }

      const focusDistance = capabilities.focusDistance;
      if (
        focusDistance &&
        typeof focusDistance.min === "number" &&
        typeof focusDistance.max === "number" &&
        focusDistance.max > focusDistance.min
      ) {
        advanced.push({
          focusDistance:
            focusDistance.min +
            (focusDistance.max - focusDistance.min) * 0.35,
        });
      }

      if (!advanced.length) {
        return;
      }

      await track.applyConstraints({
        advanced: advanced as MediaTrackConstraintSet[],
      });
    } catch {
      // Algunas webcams ignoran o rechazan estas constraints; no debe romper el escaneo.
    }
  }

  private stopStream() {
    if (!this.stream) {
      return;
    }

    this.stream.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }

  private emitStatus(status: ScannerStatus, message: string) {
    this.onStatusChange?.({
      mode: CAMERA_MODE,
      status,
      message,
    });
  }

  private emitError(code: ScannerErrorCode, message: string, cause?: unknown) {
    this.onError?.({
      code,
      message,
      cause,
    });

    this.emitStatus("error", message);
  }
}
