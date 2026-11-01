/**
 * FrameForge Studio: Fast Waveform Peak Generator
 * 
 * Computes min/max peak caches from AudioBuffers for fast timeline canvas rendering.
 */

export interface WaveformData {
  peaks: Float32Array; // Interleaved min/max pairs
  length: number;
  sampleRate: number;
}

export class WaveformGenerator {
  /**
   * Generates a decimated peak cache from an AudioBuffer
   * @param buffer Raw Web Audio AudioBuffer
   * @param peaksPerSecond Number of peak samples to generate per second of audio
   */
  static generatePeaks(buffer: AudioBuffer, peaksPerSecond: number = 100): WaveformData {
    const channelData = buffer.getChannelData(0); // Primary channel
    const totalSamples = channelData.length;
    const duration = buffer.duration;
    const numBuckets = Math.max(1, Math.floor(duration * peaksPerSecond));
    const bucketSize = Math.floor(totalSamples / numBuckets);

    const peaks = new Float32Array(numBuckets * 2); // [min0, max0, min1, max1, ...]

    for (let i = 0; i < numBuckets; i++) {
      let min = 1.0;
      let max = -1.0;
      const offset = i * bucketSize;

      for (let j = 0; j < bucketSize; j++) {
        const val = channelData[offset + j];
        if (val < min) min = val;
        if (val > max) max = val;
      }

      peaks[i * 2] = min;
      peaks[i * 2 + 1] = max;
    }

    return {
      peaks,
      length: numBuckets,
      sampleRate: buffer.sampleRate,
    };
  }

  /**
   * Generates a realistic synthetic waveform for procedural or un-decoded audio clips
   */
  static generateSyntheticPeaks(durationSeconds: number, peaksPerSecond: number = 60): WaveformData {
    const numBuckets = Math.max(1, Math.floor(durationSeconds * peaksPerSecond));
    const peaks = new Float32Array(numBuckets * 2);

    for (let i = 0; i < numBuckets; i++) {
      // Natural speech/music envelope simulation
      const envelope = 0.3 + 0.5 * Math.sin((i / numBuckets) * Math.PI);
      const noise = (Math.random() * 0.4 + 0.6) * envelope;
      peaks[i * 2] = -noise;
      peaks[i * 2 + 1] = noise;
    }

    return {
      peaks,
      length: numBuckets,
      sampleRate: 48000,
    };
  }
}

