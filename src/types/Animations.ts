import * as Three from "three";

export type AnimationsImportMap = Record<string, string>;

export interface Animations {
  mixer: Three.AnimationMixer;
  actions: Record<string, Three.AnimationAction>;
}
