import * as Cannon from "cannon";
import * as Three from "three";
import Input from "../core/Input";
import NetworkComponent from "../core/NetworkComponent";
import ThirdPersonCamera from "../core/ThirdPersonCamera";
import AnimationComponent from "../core/components/AnimationComponent";
import BodyComponent from "../core/components/BodyComponent";
import MeshComponent from "../core/components/MeshComponent";

const up = new Three.Vector3(0, 1, 0);

export default class Player extends NetworkComponent {
  private _horizontal: number = 0;
  private _vertical: number = 0;
  private _camera: ThirdPersonCamera | null = null;
  private _moveSpeed: number = 5;

  private _lastDirection: Three.Vector3 = new Three.Vector3(0, 0, 1);

  private _threeDirection: Three.Vector3 = new Three.Vector3();

  private body: BodyComponent | undefined;
  private anim: AnimationComponent | undefined;

  public constructor(userId: string, private camera: Three.PerspectiveCamera, private renderer: Three.WebGLRenderer) {
    super(userId);
  }

  public override async start(): Promise<void> {
    this.body = this.gameObject.findComponentOfType(BodyComponent);
    this.anim = this.gameObject.findComponentOfType(AnimationComponent);
    console.log("ANIM", this.anim);
    const mesh = this.gameObject.findComponentOfType(MeshComponent)?.mesh;
    if (mesh) {
      this._camera = new ThirdPersonCamera(this.renderer, this.camera, mesh);
    }
    console.log("Start", mesh);
  }

  public override update(delta: number): void {
    this.handleCamera(delta);
    this.handleInputMovement(delta);
    this.handleAnimations(delta);
  }

  private handleCamera(delta: number) {
    if (!this.isOwner()) return;
    this._camera!.update(delta);

    if (Input.isMouseButtonPressed(2)) {
      const direction = new Three.Vector3(0, 0, 0);
      this.camera.getWorldDirection(direction);
      direction.y = 0;
      direction.normalize();

      const yaw = Math.atan2(direction.x, direction.z);
      const quat = new Cannon.Quaternion();
      quat.setFromEuler(0, yaw, 0, "YZX");
      this.transform.rotation = quat;
      this._lastDirection.copy(direction);
    }
  }

  private handleInputMovement(delta: number) {
    if (!this.isOwner()) return;
    const right = new Three.Vector3();
    right.crossVectors(this._lastDirection, up).normalize();
    this._horizontal = Input.getAxis("KeyA", "KeyD");
    this._vertical = Input.getAxis("KeyS", "KeyW");

    if (Input.isMouseButtonPressed(0) && Input.isMouseButtonPressed(2)) {
      this._vertical = 1;
    }

    const dir = new Three.Vector3();
    dir.add(right.multiplyScalar(this._horizontal)).add(this._lastDirection.clone().multiplyScalar(this._vertical)).normalize();

    this._threeDirection = this._lastDirection
      .clone()
      .multiplyScalar(this._vertical)
      .add(right.multiplyScalar(Math.abs(this._horizontal)))
      .setY(0)
      .normalize()
      .multiplyScalar(this._moveSpeed);

    const cannonDir = toCannonVector3(this._threeDirection);
    this.body!.body.velocity.x = cannonDir.x;
    this.body!.body.velocity.z = cannonDir.z;
  }

  private handleAnimations(delta: number) {
    if (this._threeDirection.lengthSq() > 0.0001) {
      const normalisedDir = this._threeDirection.clone().normalize();
      const dotForward = normalisedDir.dot(this._lastDirection);
      const crossP = normalisedDir.cross(this._lastDirection);

      if (dotForward > 0.9) {
        this.anim?.playAnimation("run");
      } else if (dotForward < -0.9) {
        this.anim?.playAnimation("runBack");
      } else if (crossP.y > 0.001) {
        this.anim?.playAnimation("runRight");
      } else if (crossP.y < -0.001) {
        this.anim?.playAnimation("runLeft");
      } else {
        this.anim?.playAnimation("idle");
      }
    } else {
      this.anim?.playAnimation("idle");
    }
  }
}

const toCannonVector3 = (vec: Three.Vector3): Cannon.Vec3 => {
  return new Cannon.Vec3(vec.x, vec.y, vec.z);
};
