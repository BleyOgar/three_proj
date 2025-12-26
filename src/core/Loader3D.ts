import * as Three from "three";
import { FBXLoader, GLTFLoader } from "three/examples/jsm/Addons.js";
import type { Animations } from "../types/Animations";

const fbxLoader = new FBXLoader();
const gltfLoader = new GLTFLoader();

export default class Loader3D {
  public static async loadMeshGltf(url: string): Promise<Three.Object3D> {
    const gltf = await gltfLoader.loadAsync(url);
    const model = gltf.scene;
    console.log("model animations", model.animations, "gltf animations", gltf.animations);
    model.traverse((obj) => {
      if ((obj as Three.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    return model;
  }

  public static async loadAnimationsFromFbx(mixer: Three.AnimationMixer, url: string): Promise<Three.AnimationAction[]> {
    const fbx = await fbxLoader.loadAsync(url);
    return fbx.animations.map((anim) => mixer.clipAction(anim));
  }

  public static async loadMeshGltfWithAnimations(url: string): Promise<{ model: Three.Object3D; animations: Animations }> {
    const model = await this.loadMeshGltf(url);
    return { model, animations: this.handleAnimationsFromModel(model) };
  }

  public static async loadMeshFbx(url: string): Promise<Three.Object3D> {
    const model = await fbxLoader.loadAsync(url);
    model.traverse((obj) => {
      if ((obj as Three.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    model.scale.set(0.01, 0.01, 0.01);
    return model;
  }

  public static async loadMeshFbxWithAnimations(url: string): Promise<{ model: Three.Object3D; animations: Animations }> {
    const model = await this.loadMeshFbx(url);
    return { model, animations: this.handleAnimationsFromModel(model) };
  }

  private static handleAnimationsFromModel(model: Three.Object3D): Animations {
    const mixer = new Three.AnimationMixer(model);
    const actions: Record<string, Three.AnimationAction> = {};
    model.animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      actions[clip.name] = action;
    });
    return { mixer, actions };
  }
}
