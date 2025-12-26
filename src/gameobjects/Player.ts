import * as Cannon from "cannon";
import * as Three from "three";
import GameObject from "../core/GameObject";
import Input from "../core/Input";
import Loader3D from "../core/Loader3D";
import { noFrictionMaterial } from "../core/PhysicsMaterials";
import ThirdPersonCamera from "../core/ThirdPersonCamera";
import type { AnimationsImportMap } from "../types/Animations";

const up = new Three.Vector3(0, 1, 0);

export default class Player extends GameObject {
  private _horizontal: number = 0;
  private _vertical: number = 0;
  private _camera: ThirdPersonCamera | null = null;
  private _moveSpeed: number = 5;

  private _lastDirection: Three.Vector3 = new Three.Vector3(0, 0, 1);
  private _currentAnimation: string = "";

  private _runningActions: Set<Three.AnimationAction> = new Set();
  private _stoppingActions: Set<Three.AnimationAction> = new Set();

  public constructor(
    private camera: Three.PerspectiveCamera,
    renderer: Three.WebGLRenderer,
    world: Cannon.World,
    scene: Three.Scene,
    model: Three.Object3D,
    animationsMap: AnimationsImportMap
  ) {
    const body = new Cannon.Body({
      mass: 70,
      shape: new Cannon.Box(new Cannon.Vec3(0.3, 0.1, 0.1)),
      position: new Cannon.Vec3(0, 5, 0),
      fixedRotation: true,
      linearDamping: 0.9,
      material: noFrictionMaterial,
    });
    body.material.friction = 0;
    world.addBody(body);
    super(world, scene, { mesh: model, body });
    this._camera = new ThirdPersonCamera(renderer, camera, this.mesh!);

    this.loadAnimations(animationsMap);
  }

  public async loadAnimations(animationsMap: AnimationsImportMap) {
    for (const [key, value] of Object.entries(animationsMap)) {
      if (value.endsWith(".fbx")) {
        const animations = await Loader3D.loadAnimationsFromFbx(this.mixer!, value);
        this.setAnimationAction(key, animations[0]);
      }
    }
  }

  public update(delta: number): void {
    this._camera!.update(delta);

    if (Input.isMouseButtonPressed(2)) {
      const direction = new Three.Vector3(0, 0, 0);
      this.camera.getWorldDirection(direction);
      direction.y = 0;
      direction.normalize();

      const yaw = Math.atan2(direction.x, direction.z);
      const quat = new Cannon.Quaternion();
      quat.setFromEuler(0, yaw, 0, "YZX");
      this.mesh!.rotation.y = yaw;
      this.body?.quaternion.copy(this.mesh!.quaternion as unknown as Cannon.Quaternion);
      this._lastDirection.copy(direction);
    }
    const right = new Three.Vector3();
    right.crossVectors(this._lastDirection, up).normalize();
    this._horizontal = Input.getAxis("KeyA", "KeyD");
    this._vertical = Input.getAxis("KeyS", "KeyW");

    if (Input.isMouseButtonPressed(0) && Input.isMouseButtonPressed(2)) {
      this._vertical = 1;
    }

    const dir = new Three.Vector3();
    dir.add(right.multiplyScalar(this._horizontal)).add(this._lastDirection.clone().multiplyScalar(this._vertical)).normalize();

    const threeDir = this._lastDirection
      .clone()
      .multiplyScalar(this._vertical)
      .add(right.multiplyScalar(Math.abs(this._horizontal)))
      .setY(0)
      .normalize()
      .multiplyScalar(this._moveSpeed);

    const cannonDir = toCannonVector3(threeDir);
    this.body!.velocity.x = cannonDir.x;
    this.body!.velocity.z = cannonDir.z;
    this.body!.velocity;

    if (threeDir.lengthSq() > 0.0001) {
      const normalisedDir = threeDir.clone().normalize();
      const dotForward = normalisedDir.dot(this._lastDirection);
      const crossP = normalisedDir.cross(this._lastDirection);

      if (dotForward > 0.9) {
        this.playAnimation("run");
      } else if (dotForward < -0.9) {
        this.playAnimation("runBack");
      } else if (crossP.y > 0.001) {
        this.playAnimation("runRight");
      } else if (crossP.y < -0.001) {
        this.playAnimation("runLeft");
      } else {
        this.playAnimation("idle");
      }
    } else {
      this.playAnimation("idle");
    }

    for (const action of this._runningActions) {
      if (action.getEffectiveWeight() < 1 - delta * 5) action?.setEffectiveWeight(action.getEffectiveWeight() + delta * 5);
    }
    for (const action of this._stoppingActions) {
      action?.setEffectiveWeight(action.getEffectiveWeight() - delta * 5);
      if (action.getEffectiveWeight() <= 0) {
        this._stoppingActions.delete(action);
        action.stop();
      }
    }
  }

  public playAnimation(name: string) {
    if (!this._currentAnimation.length) {
      const action = this.animationActions[name];
      if (!action) return;

      this._currentAnimation = name;
      action?.play();
      action?.setEffectiveWeight(0.5);
      this._runningActions.add(action);
      this._stoppingActions.delete(action);
      return;
    }

    if (this._currentAnimation === name) return;

    const action = this.animationActions[name];
    this._currentAnimation = name;
    this._runningActions.add(action);
    this._stoppingActions.delete(action);
    action?.play();
    action.setEffectiveWeight(0.5);

    for (const [actionName, action] of Object.entries(this.animationActions)) {
      if (actionName === name) continue;
      this._runningActions.delete(action);
      this._stoppingActions.add(action);
    }
  }
}

const toCannonVector3 = (vec: Three.Vector3): Cannon.Vec3 => {
  return new Cannon.Vec3(vec.x, vec.y, vec.z);
};
