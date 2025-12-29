import { Body, World } from "cannon";
import Component from "./Component";

export default class BodyComponent extends Component {
  public constructor(private readonly world: World, public readonly body: Body) {
    super();
  }

  public override async awake(): Promise<void> {
    this.world.addBody(this.body);
  }

  public update(): void {
    const { x: tx, y: ty, z: tz } = this.transform.position;
    const { x: tqx, y: tqy, z: tqz, w: tqw } = this.transform.rotation;

    if (this.transform.dirty["position"]) this.body.position.set(tx, ty, tz);
    if (this.transform.dirty["rotation"]) this.body.quaternion.set(tqx, tqy, tqz, tqw);

    const { x, y, z } = this.body.position;
    const { x: qx, y: qy, z: qz, w } = this.body.quaternion;

    this.gameObject.transform.setPosition(x, y, z);
    this.gameObject.transform.setRotation(qx, qy, qz, w);
  }
}
