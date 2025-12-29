import { Quaternion as Q } from "cannon";
import { Quaternion, Vector3 } from "three";
import Component from "./Component";

export default class TransformComponent extends Component {
  private _position: Vector3 = new Vector3();
  private _rotation: Quaternion = new Quaternion();

  public readonly dirty: Record<"position" | "rotation", number> = { position: 0, rotation: 0 };

  public constructor(position: Vector3 = new Vector3(), rotation: Quaternion = new Quaternion()) {
    super();
    this._position = position;
    this._rotation = rotation;
  }

  public set position(vec: Vector3) {
    this.dirty["position"] = 2;
    this._position.copy(vec);
  }

  public get position(): Vector3 {
    return this._position;
  }

  public set rotation(rot: Quaternion | Q) {
    this.dirty["rotation"] = 2;
    this._rotation.copy(rot);
  }

  public get rotation(): Quaternion | Q {
    return this._rotation;
  }

  public setPosition(x: number, y: number, z: number, makeDirty: boolean = false) {
    this._position.set(x, y, z);
    if (makeDirty) this.dirty["position"] = 2;
  }

  public setRotation(x: number, y: number, z: number, w: number, makeDirty: boolean = false) {
    this._rotation.set(x, y, z, w);
    if (makeDirty) this.dirty["rotation"] = 2;
  }

  public override update(dt: number): void {
    Object.entries(this.dirty).map(([key, value]) => {
      if (value > 0) this.dirty[key as "position" | "rotation"]--;
    });
  }

  public isDirty(key: "position" | "rotation"): boolean {
    return this.dirty[key] > 0;
  }
}
