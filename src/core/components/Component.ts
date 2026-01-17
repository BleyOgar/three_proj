import GameObject from "../GameObject";
import TransformComponent from "./TransformComponent";

export default abstract class Component {
    public active: boolean = true;
    private _gameObject: GameObject | undefined;
    public get gameObject(): GameObject {
        if (!this._gameObject) throw new Error("Компонент не примонтирован к GameObject!");
        return this._gameObject;
    }

    public async _awake(gameObject: GameObject): Promise<void> {
        console.log("_awake");
        this._gameObject = gameObject;
        await this.awake();
    }

    public async _start() {
        console.log("_start");
        await this.start();
    }

    public async awake(): Promise<void> {
    }

    public async start(): Promise<void> {
    }

    public update(_: number): void {
    }

    public get transform(): TransformComponent {
        return this.gameObject.transform;
    }
}
