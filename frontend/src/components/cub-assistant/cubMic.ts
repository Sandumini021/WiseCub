import { apiPostForm } from "../../services/apiClient";
import type { CubLang } from "./cubAssistantTypes";
import { concatFloat32, downsample, encodeWavPcm16 } from "./cubWav";

export type TranscribeResponse = {
  text: string;
  language: string;
  error?: string;
};

export type CaptureSession = {
  stop: () => Promise<Blob>;
};

function pickRecorderType() {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  const Recorder = window.MediaRecorder;
  if (!Recorder) {
    return "";
  }
  return types.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

export function browserCanRecord() {
  return Boolean(navigator.mediaDevices?.getUserMedia) && (typeof AudioContext !== "undefined" || typeof MediaRecorder !== "undefined");
}

export async function openMicStream() {
  return navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
  });
}

export function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export async function startCaptureSession(stream: MediaStream): Promise<CaptureSession> {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (AudioCtx) {
    const context = new AudioCtx();
    const source = context.createMediaStreamSource(stream);
    const processor = context.createScriptProcessor(4096, 1, 1);
    const chunks: Float32Array[] = [];
    processor.onaudioprocess = (event) => {
      chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
    };
    const mute = context.createGain();
    mute.gain.value = 0;
    source.connect(processor);
    processor.connect(mute);
    mute.connect(context.destination);
    if (context.state === "suspended") {
      await context.resume();
    }
    return {
      stop: async () => {
        processor.onaudioprocess = null;
        processor.disconnect();
        source.disconnect();
        mute.disconnect();
        const joined = concatFloat32(chunks);
        const samples = downsample(joined, context.sampleRate, 16000);
        await context.close();
        stopStream(stream);
        return encodeWavPcm16(samples, 16000);
      },
    };
  }
  return startMediaRecorderSession(stream);
}

function startMediaRecorderSession(stream: MediaStream): CaptureSession {
  const mimeType = pickRecorderType();
  const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };
  recorder.start(250);
  return {
    stop: async () => {
      await new Promise<void>((resolve) => {
        if (recorder.state === "inactive") {
          resolve();
          return;
        }
        recorder.addEventListener("stop", () => resolve(), { once: true });
        recorder.stop();
      });
      stopStream(stream);
      const blob = new Blob(chunks, { type: chunks[0]?.type || "audio/webm" });
      const context = new AudioContext();
      const buffer = await context.decodeAudioData(await blob.arrayBuffer());
      await context.close();
      return encodeWavPcm16(downsample(buffer.getChannelData(0), buffer.sampleRate, 16000), 16000);
    },
  };
}

export async function transcribeWav(wav: Blob, lang: CubLang): Promise<TranscribeResponse> {
  const body = new FormData();
  body.append("audio", wav, "cub.wav");
  body.append("language", lang === "en" ? "en" : "si");
  try {
    const result = await apiPostForm<TranscribeResponse>("/api/cub/transcribe", body);
    return {
      text: (result.text || "").trim(),
      language: result.language || lang,
      error: result.error || undefined,
    };
  } catch {
    return { text: "", language: lang, error: "api" };
  }
}
