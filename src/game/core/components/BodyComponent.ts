import {Body} from "cannon";
import Component from "./Component.ts";

export default class BodyComponent extends Component {
    public constructor(public readonly body: Body) {
        super();
    }

    public override async awake(): Promise<void> {
        this.transform.body = this.body;
        this.gameObject.world.addBody(this.body);
    }
}
