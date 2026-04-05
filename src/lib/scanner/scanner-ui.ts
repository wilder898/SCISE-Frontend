import { ScannerController } from "./scanner-controller";
import type { ScannerCameraDevice, ScannerErrorPayload, ScannerStatusPayload } from "./scanner-types";

interface InitializeDocumentScannerOptions {
  onDetected: () => void;
  onManualSubmit: () => void;
  unsupportedMessage: string;
  initializationErrorMessage?: string;
  manualCloseMessage?: string;
  detectedMessage?: string;
}

interface DocumentScannerBindings {
  barcodeInput: HTMLInputElement | null;
  stopCameraScanner: (message?: string) => void;
  focusInput: () => void;
}

export function initializeDocumentScanner(
  options: InitializeDocumentScannerOptions
): DocumentScannerBindings {
  const barcodeInput = document.getElementById("barcodeUser") as HTMLInputElement | null;
  const scanReaderButton = document.getElementById("scanReaderButton") as HTMLButtonElement | null;
  const scanReaderButtonLabel = document.getElementById("scanReaderButtonLabel") as HTMLElement | null;
  const scanReaderStatus = document.getElementById("scanReaderStatus") as HTMLElement | null;
  const cameraScannerBox = document.getElementById("cameraScannerBox") as HTMLElement | null;
  const cameraScannerVideo = document.getElementById("cameraScannerVideo") as HTMLVideoElement | null;
  const cameraDeviceSelect = document.getElementById("cameraDeviceSelect") as HTMLSelectElement | null;
  const cameraRefreshButton = document.getElementById("cameraRefreshButton") as HTMLButtonElement | null;
  const cameraMirrorToggleButton = document.getElementById(
    "cameraMirrorToggleButton"
  ) as HTMLButtonElement | null;
  const cameraMirrorToggleLabel = document.getElementById(
    "cameraMirrorToggleLabel"
  ) as HTMLElement | null;
  const cameraCaptureButton = document.getElementById("cameraCaptureButton") as HTMLButtonElement | null;
  const cameraScannerCloseButton = document.getElementById(
    "cameraScannerCloseButton"
  ) as HTMLButtonElement | null;

  let scannerController: ScannerController | null = null;
  let isCameraActive = false;
  let availableCameraDevices: ScannerCameraDevice[] = [];
  let selectedCameraDeviceId = "";
  let isPreviewCorrected = true;

  const initializationErrorMessage =
    options.initializationErrorMessage ||
    "No fue posible inicializar el lector de camara en esta vista.";
  const manualCloseMessage =
    options.manualCloseMessage || "Camara cerrada. Puedes escribir el documento manualmente.";
  const detectedMessage =
    options.detectedMessage || "Documento detectado. Consultando usuario...";

  function updateScanStatus(
    message: string,
    tone: "info" | "error" | "success" = "info"
  ) {
    if (!scanReaderStatus) {
      return;
    }

    scanReaderStatus.textContent = message;
    scanReaderStatus.classList.remove("oculto", "is-error", "is-success");
    if (tone === "error") {
      scanReaderStatus.classList.add("is-error");
    } else if (tone === "success") {
      scanReaderStatus.classList.add("is-success");
    }
  }

  function hideScanStatus() {
    if (!scanReaderStatus) {
      return;
    }

    scanReaderStatus.textContent = "";
    scanReaderStatus.classList.add("oculto");
    scanReaderStatus.classList.remove("is-error", "is-success");
  }

  function updateScanButtonState() {
    if (!scanReaderButton) {
      return;
    }

    scanReaderButton.setAttribute(
      "aria-label",
      isCameraActive ? "Cerrar camara del lector" : "Usar camara para escanear el carnet"
    );
    if (scanReaderButtonLabel) {
      scanReaderButtonLabel.textContent = isCameraActive ? "Cerrar Camara" : "Usar Camara";
    }
  }

  function showCameraScanner() {
    cameraScannerBox?.classList.remove("oculto");
    isCameraActive = true;
    updateScanButtonState();
  }

  function hideCameraScanner() {
    cameraScannerBox?.classList.add("oculto");
    isCameraActive = false;
    updateScanButtonState();
  }

  function updateMirrorPreviewState() {
    if (!cameraScannerVideo) {
      return;
    }

    cameraScannerVideo.classList.toggle("is-flipped", isPreviewCorrected);
    cameraMirrorToggleButton?.classList.toggle("is-active", isPreviewCorrected);
    if (cameraMirrorToggleLabel) {
      cameraMirrorToggleLabel.textContent = isPreviewCorrected
        ? "Eje Corregido"
        : "Corregir Eje";
    }
  }

  function renderCameraDevices() {
    if (!cameraDeviceSelect) {
      return;
    }

    const currentValue = selectedCameraDeviceId;
    const optionsMarkup = [
      `<option value="">Camara predeterminada</option>`,
      ...availableCameraDevices.map(
        (device) =>
          `<option value="${device.id}" ${device.id === currentValue ? "selected" : ""}>${device.label}</option>`
      ),
    ];

    cameraDeviceSelect.innerHTML = optionsMarkup.join("");
    if (!currentValue) {
      cameraDeviceSelect.value = "";
    }
  }

  async function refreshCameraDevices() {
    availableCameraDevices = await ScannerController.listCameraDevices();

    if (
      selectedCameraDeviceId &&
      !availableCameraDevices.some((device) => device.id === selectedCameraDeviceId)
    ) {
      selectedCameraDeviceId = "";
      scannerController?.setCameraDevice(null);
    }

    renderCameraDevices();
  }

  function handleScannerStatus(payload: ScannerStatusPayload) {
    const tone =
      payload.status === "detected"
        ? "success"
        : payload.status === "error"
          ? "error"
          : "info";
    updateScanStatus(payload.message, tone);

    if (payload.status === "ready" || payload.status === "scanning") {
      showCameraScanner();
      return;
    }

    if (payload.status === "stopped") {
      hideCameraScanner();
    }
  }

  function handleScannerError(payload: ScannerErrorPayload) {
    updateScanStatus(payload.message, "error");
    hideCameraScanner();
  }

  async function startCameraScanner() {
    if (!scannerController) {
      updateScanStatus(initializationErrorMessage, "error");
      return;
    }

    if (!ScannerController.isCameraSupported()) {
      updateScanStatus(options.unsupportedMessage, "error");
      return;
    }

    await refreshCameraDevices();
    scannerController.setCameraDevice(selectedCameraDeviceId || null);
    showCameraScanner();
    updateScanStatus("Preparando camara para leer el carnet...", "info");
    await scannerController.startCamera();
    await refreshCameraDevices();
  }

  function stopCameraScanner(message?: string) {
    scannerController?.stopCamera();
    hideCameraScanner();
    if (message) {
      updateScanStatus(message, "info");
      return;
    }

    hideScanStatus();
  }

  async function restartCameraScannerForDeviceChange() {
    if (!isCameraActive || !scannerController) {
      return;
    }

    updateScanStatus("Cambiando de camara...", "info");
    scannerController.stopCamera();
    hideCameraScanner();
    scannerController.setCameraDevice(selectedCameraDeviceId || null);
    await startCameraScanner();
  }

  async function captureCurrentFrame() {
    if (!scannerController || !isCameraActive) {
      updateScanStatus("Primero abre la camara para capturar el carnet.", "error");
      return;
    }

    updateScanStatus("Capturando imagen del carnet...", "info");
    await scannerController.captureAndDetect();
  }

  if (barcodeInput && cameraScannerVideo) {
    scannerController = new ScannerController({
      inputElement: barcodeInput,
      videoElement: cameraScannerVideo,
      facingMode: "environment",
      onDetected: () => {
        hideCameraScanner();
        updateScanStatus(detectedMessage, "success");
        options.onDetected();
      },
      onError: handleScannerError,
      onStatusChange: handleScannerStatus,
    });
  }

  barcodeInput?.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      options.onManualSubmit();
    }
  });

  scanReaderButton?.addEventListener("click", () => {
    if (isCameraActive) {
      stopCameraScanner(manualCloseMessage);
      return;
    }

    void startCameraScanner();
  });

  cameraScannerCloseButton?.addEventListener("click", () => {
    stopCameraScanner(manualCloseMessage);
  });

  cameraRefreshButton?.addEventListener("click", () => {
    void refreshCameraDevices();
  });

  cameraMirrorToggleButton?.addEventListener("click", () => {
    isPreviewCorrected = !isPreviewCorrected;
    updateMirrorPreviewState();
  });

  cameraDeviceSelect?.addEventListener("change", () => {
    selectedCameraDeviceId = cameraDeviceSelect.value;
    scannerController?.setCameraDevice(selectedCameraDeviceId || null);
    void restartCameraScannerForDeviceChange();
  });

  cameraCaptureButton?.addEventListener("click", () => {
    void captureCurrentFrame();
  });

  updateScanButtonState();
  updateMirrorPreviewState();
  void refreshCameraDevices();
  window.addEventListener("pagehide", () => {
    stopCameraScanner();
  });

  return {
    barcodeInput,
    stopCameraScanner,
    focusInput() {
      barcodeInput?.focus();
    },
  };
}
