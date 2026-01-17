import {Body, Quaternion as Q} from "cannon";
import {Object3D, Quaternion, Vector3} from "three";
import Component from "@/game/core/components/Component.ts";

/**
 * GameObject (RigidBody(isKinematic = true))
 * При вызове transform.position = (0,0,0) должен обратиться к Body и установить позицию
 */

export default class TransformComponent extends Component {
    private readonly _position: Vector3 = new Vector3();
    private readonly _rotation: Quaternion = new Quaternion();

    public body?: Body
    public obj?: Object3D

    public constructor(position: Vector3 = new Vector3(),
                       rotation: Quaternion = new Quaternion()
    ) {
        super()
        this._position = position;
        this._rotation = rotation;
    }

    public set position(vec: Vector3) {
        this._position.copy(vec);
        if (this.body) this.body.position.set(vec.x, vec.y, vec.z)
        if (this.obj) this.obj.position.copy(vec)
    }

    public get position(): Vector3 {
        return this._position;
    }

    public set rotation(rot: Quaternion | Q) {
        this._rotation.copy(rot);
        if (this.body) this.body.quaternion.set(rot.x, rot.y, rot.z, rot.w)
        if (this.obj) this.obj.quaternion.copy(rot)
    }

    public get rotation(): Quaternion | Q {
        return this._rotation;
    }

    update(_: number) {
        if (this.body)
            if (this.obj) {
                this.obj.position.copy(this.body.position)
                this.obj.quaternion.copy(this.body.quaternion)
            }

        if (this.obj) {
            this._position.copy(this.obj.position)
            this._rotation.copy(this.obj.quaternion)
        }
    }
}
