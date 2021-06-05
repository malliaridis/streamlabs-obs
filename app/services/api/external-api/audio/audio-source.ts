import { ServiceHelper, Inject } from 'services';
import { ISerializable } from 'services/api/rpc-api';
import {
  AudioService as InternalAudioService,
  AudioSource as InternalAudioSource,
} from 'services/audio';
import { SourcesService as InternalSourcesService } from 'services/sources';
import { Fallback } from 'services/api/external-api';
import * as obs from '../../../../../obs-api';

export interface IFader {
  db: number;
  deflection: number;
  mul: number;
}

export interface IAudioSourceModel {
  sourceId: string;
  name: string;
  fader: IFader;
  audioMixers: number;
  monitoringType: obs.EMonitoringType;
  forceMono: boolean;
  syncOffset: number;
  muted: boolean;
  mixerHidden: boolean;
}

@ServiceHelper()
export class AudioSource implements ISerializable {
  @Inject() private audioService: InternalAudioService;
  @Inject() private sourcesService: InternalSourcesService;
  @Fallback() private audioSource: InternalAudioSource;

  constructor(private sourceId: string) {
    this.audioSource = this.audioService.views.getSource(sourceId);
  }

  private isDestroyed(): boolean {
    return this.audioSource.isDestroyed();
  }

  getModel(): IAudioSourceModel {
    const sourceModel = this.sourcesService.views.getSource(this.sourceId).getModel();
    return {
      name: sourceModel.name,
      sourceId: this.audioSource.sourceId,
      fader: this.audioSource.fader,
      audioMixers: this.audioSource.audioMixers,
      monitoringType: this.audioSource.monitoringType,
      forceMono: this.audioSource.forceMono,
      syncOffset: this.audioSource.syncOffset,
      muted: this.audioSource.muted,
      mixerHidden: this.audioSource.mixerHidden,
    };
  }

  setDeflection(deflection: number) {
    this.audioSource.setDeflection(deflection);
  }

  /**
   * Sets the audio volume in mul. Note that the value needs to be between
   * 0.0 (exclusive) and 1.0 (inclusive). Also note that the value is not
   * equivalent to the volume in percentage. Values equal to or smaller than 0.0
   * set the volume to 0% (-inf dB). The values are exponentially related with
   * the volume in dB. The formula from dB to mul is `10^(dB / 20) = mul`.
   * ```
   * Volume => Formula      = Mul
   * ------------------------------
   *    0 => 10^(   0 / 20) = 1.0
   *  -20 => 10^( -20 / 20) = 0.1
   *  -40 => 10^( -40 / 20) = 0.01
   *  -60 => 10^( -60 / 20) = 0.001
   *  -80 => 10^( -80 / 20) = 0.0001
   * -100 => 10^(-100 / 20) = 0.00001
   * ```
   *
   * @param mul The volume to set in mul, between 0.0 and 1.0
   */
  setMul(mul: number) {
    this.audioSource.setMul(mul);
  }

  setMuted(muted: boolean) {
    this.audioSource.setMuted(muted);
  }
}
