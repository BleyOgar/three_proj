import { Object3D, Scene } from "three";
import Loader3D from "../Loader3D";
import Component from "./Component";

export default class MeshComponent extends Component {
  public mesh: Object3D | undefined;
  private meshLink: string | undefined;

  public constructor(private scene: Scene, mesh: Object3D | string) {
    super();
    if (typeof mesh === "string") this.meshLink = mesh;
  }

  public override async awake(): Promise<void> {
    if (this.meshLink) {
      this.mesh = await Loader3D.loadMeshFbx(this.meshLink);
      this.scene.add(this.mesh);
    }
  }

  public update(): void {
    const { x, y, z } = this.gameObject.transform.position;
    if (!this.mesh) return;
    this.mesh.position.set(x, y, z);
    this.mesh.rotation.setFromQuaternion(this.gameObject.transform.rotation);
  }
}
