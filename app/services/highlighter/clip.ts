import execa from 'execa';
import { FrameSource } from './frame-source';
import { AudioSource } from './audio-source';
import { FFPROBE_EXE } from './constants';
import fs from 'fs';

export class Clip {
  frameSource: FrameSource;
  audioSource: AudioSource;

  duration: number;

  // TODO: Trim validation
  startTrim: number;
  endTrim: number;

  initPromise: Promise<void>;

  deleted = false;

  constructor(public readonly sourcePath: string) {}

  /**
   * Performs all async operations needed to display
   * this clip to the user and starting working with it:
   * - Read duration
   * - Generate scrubbing sprite on disk
   */
  init() {
    if (!this.initPromise) {
      this.initPromise = new Promise<void>((resolve, reject) => {
        this.doInit().then(resolve).catch(reject);
      });
    }

    return this.initPromise;
  }

  /**
   * FrameSource and AudioSource are disposable. Call this to reset them
   * to start reading from the file again.
   */
  async reset(preview: boolean) {
    this.deleted = !(await this.fileExists());
    if (this.deleted) return;

    if (!this.duration) await this.readDuration();

    this.frameSource = new FrameSource(
      this.sourcePath,
      this.duration,
      this.startTrim,
      this.endTrim,
      preview,
    );
    this.audioSource = new AudioSource(
      this.sourcePath,
      this.duration,
      this.startTrim,
      this.endTrim,
    );
  }

  /**
   * Checks if the underlying file exists and is readable
   */
  private async fileExists() {
    return new Promise(resolve => {
      fs.access(this.sourcePath, fs.constants.R_OK, e => {
        if (e) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  private async doInit() {
    await this.reset(false);
    if (this.deleted) return;
    await this.frameSource.exportScrubbingSprite();
  }

  private async readDuration() {
    if (this.duration) return;

    const { stdout } = await execa(FFPROBE_EXE, [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      this.sourcePath,
    ]);
    this.duration = parseFloat(stdout);
  }
}
