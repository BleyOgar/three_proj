import Component from "./components/Component";
import {clientStates} from "@/ui/store/client-states.ts";

export default class NetworkComponent extends Component {
    public constructor(public readonly userId: string) {
        super();
    }

    public isOwner() {
        return this.userId === clientStates.userId;
    }
}
