import { clientStates } from "../client/Client";
import Component from "./components/Component";

export default class NetworkComponent extends Component {
  public constructor(public readonly userId: string) {
    super();
  }

  public isOwner() {
    return this.userId === clientStates.userId;
  }
}
