import {Object3D} from "three";
import Loader3D from "../Loader3D.ts";
import Component from "./Component.ts";

export default class MeshComponent extends Component {
    public mesh: Object3D | undefined;
    private readonly meshLink: string | undefined;

    public constructor(mesh: Object3D | string) {
        super();
        if (typeof mesh === "string") this.meshLink = mesh;
    }

    public override async awake(): Promise<void> {
        if (this.meshLink) {
            this.mesh = await Loader3D.loadMeshFbx(this.meshLink);
            this.gameObject.scene.add(this.mesh);
        }
        this.transform.obj = this.mesh
    }

    public update(): void {
        const {x, y, z} = this.gameObject.transform.position;
        if (!this.mesh) return;
        this.mesh.position.set(x, y, z);
        this.mesh.rotation.setFromQuaternion(this.gameObject.transform.rotation as any);
    }
}
