import { pipeline, env } from "@huggingface/transformers";

// Use WASM backend, don't use Node.js
env.backends.onnx.wasm.proxy = false;

const MODEL_ID = "onnx-community/whisper-tiny.en";

let transcriber = null;

async function loadModel(onProgress) {
  if (transcriber) return transcriber;

  transcriber = await pipeline("automatic-speech-recognition", MODEL_ID, {
    dtype: "q8", // quantised — smaller download, still accurate
    device: "wasm",
    progress_callback: (progress) => {
      onProgress?.(progress);
    },
  });

  return transcriber;
}

self.addEventListener("message", async (event) => {
  const { type, audio, id } = event.data;

  if (type === "transcribe") {
    try {
      // Report loading progress back to main thread
      const model = await loadModel((progress) => {
        self.postMessage({ type: "loading", id, progress });
      });

      self.postMessage({ type: "transcribing", id });

      const result = await model(audio, {
        language: "english",
        task: "transcribe",
        chunk_length_s: 30,
        return_timestamps: false,
      });

      self.postMessage({
        type: "done",
        id,
        transcript: result.text?.trim() ?? "",
      });
    } catch (err) {
      self.postMessage({
        type: "error",
        id,
        message: err?.message ?? "Transcription failed",
      });
    }
  }
});
