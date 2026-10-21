import { describe, expect, it } from "vitest";
import { concatFloat32, encodeWavPcm16 } from "./cubWav";

describe("cub wav", () => {
  it("writes a PCM wav header", async () => {
    const blob = encodeWavPcm16(new Float32Array(320), 16000);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])).toBe("RIFF");
    expect(String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11])).toBe("WAVE");
    expect(blob.type).toBe("audio/wav");
  });

  it("joins pcm chunks in order", () => {
    const joined = concatFloat32([new Float32Array([1, 2]), new Float32Array([3])]);
    expect(Array.from(joined)).toEqual([1, 2, 3]);
  });
});
