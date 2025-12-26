import * as Cannon from "cannon";
import * as Three from "three";
import collections from "./collections";

export type GameObjectOpts = { mesh?: Three.Object3D; body?: Cannon.Body };

export default class GameObject {
  public body: Cannon.Body | null = null;
  public mixer: Three.AnimationMixer | null = null;
  public mesh: Three.Object3D | null = null;
  public animationActions: Record<string, Three.AnimationAction> = {};

  public get position() {
    if (this.body) return new Three.Vector3(this.body.position.x, this.body.position.y, this.body.position.z);
    if (this.mesh) return this.mesh.position;
    return new Three.Vector3(0, 0, 0);
  }

  protected constructor(protected world: Cannon.World, protected scene: Three.Scene, opts?: GameObjectOpts) {
    this.mesh = opts?.mesh || null;
    if (this.mesh) {
      this.mixer = new Three.AnimationMixer(this.mesh);
      this.scene.add(this.mesh);
    }
    this.body = opts?.body || null;
    collections.gameObjects.push(this);
  }

  public static Create(world: Cannon.World, scene: Three.Scene, opts?: GameObjectOpts): GameObject {
    return new GameObject(world, scene, opts);
  }

  public _update(delta: number) {
    if (this.body && this.mesh) {
      this.copyTransformFromBody(this.mesh, this.body);
    }
    this.mixer?.update(delta);
    this.update(delta);
  }

  private copyTransformFromBody(mesh: Three.Object3D, body: Cannon.Body) {
    mesh.position.copy(body.position as unknown as Three.Vector3);
    // mesh.quaternion.copy(body.quaternion as unknown as Three.Quaternion);
  }

  private copyTransformFromMesh(mesh: Three.Object3D, body: Cannon.Body) {
    body.position.copy(mesh.position as unknown as Cannon.Vec3);
    body.quaternion.copy(mesh.quaternion as unknown as Cannon.Quaternion);
  }

  public loadAnimationActionsFromMesh() {
    if (!this.mesh) return;
    if (!this.mixer) return;
    if (!this.mesh.animations.length) return;

    for (const anim of this.mesh.animations) {
      const action = this.mixer.clipAction(anim);
      this.animationActions[anim.name] = action;
    }
  }

  public setAnimationAction(name: string, action: Three.AnimationAction) {
    this.animationActions[name] = action;
  }

  public setAnimationMixer(mixer: Three.AnimationMixer) {
    this.mixer = mixer;
  }

  public setMesh(mesh: Three.Object3D) {
    this.scene.remove(mesh);
    this.mesh = mesh;
    this.scene.add(mesh);
    if (this.body) this.copyTransformFromBody(this.mesh, this.body);
  }

  public setBody(body: Cannon.Body) {
    if (this.body) this.world.remove(body);
    this.body = body;
    this.world.addBody(this.body);
    if (this.mesh) this.copyTransformFromMesh(this.mesh, this.body);
  }

  public update(delta: number): void {}
}
