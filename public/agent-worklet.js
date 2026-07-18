// Captures mic audio (context runs at 24 kHz), converts Float32 -> Int16 PCM,
// and posts ~100ms chunks to the main thread for the AssemblyAI voice agent.
class PCMWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buf = [];
    this._target = 2400; // ~100ms at 24kHz
  }
  process(inputs) {
    const input = inputs[0];
    if (input && input[0]) {
      const f32 = input[0];
      for (let i = 0; i < f32.length; i++) this._buf.push(f32[i]);
      if (this._buf.length >= this._target) {
        const chunk = this._buf.splice(0, this._buf.length);
        const i16 = new Int16Array(chunk.length);
        for (let i = 0; i < chunk.length; i++) {
          const s = Math.max(-1, Math.min(1, chunk[i]));
          i16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        this.port.postMessage(i16.buffer, [i16.buffer]);
      }
    }
    return true;
  }
}
registerProcessor("pcm-worklet", PCMWorklet);
