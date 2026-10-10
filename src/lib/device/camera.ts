export type CameraCaptureResult =
  | { status: "captured"; blob: Blob }
  | { status: "denied" }
  | { status: "unavailable" };

export function isCameraSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
}

/**
 * Debe llamarse desde un gesto del usuario (clic en "Adjuntar foto").
 * Nunca se invoca al cargar la página.
 */
export async function captureEvidence(): Promise<CameraCaptureResult> {
  if (!isCameraSupported()) {
    return { status: "unavailable" };
  }

  let stream: MediaStream | null = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });
    const blob = await grabFrame(stream);
    return blob ? { status: "captured", blob } : { status: "unavailable" };
  } catch (error) {
    const name = error instanceof DOMException ? error.name : "";
    if (name === "NotAllowedError" || name === "SecurityError") {
      return { status: "denied" };
    }
    return { status: "unavailable" };
  } finally {
    stream?.getTracks().forEach((track) => track.stop());
  }
}

async function grabFrame(stream: MediaStream): Promise<Blob | null> {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.srcObject = stream;
  await video.play();

  const { videoWidth: width, videoHeight: height } = video;
  if (!width || !height) return null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.drawImage(video, 0, 0, width, height);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.8));
}