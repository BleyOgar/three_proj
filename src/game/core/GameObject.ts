import collections from "./collections.ts";
import Component from "./components/Component.ts";
import TransformComponent from "./components/TransformComponent.ts";
import {World} from "cannon";
import {Scene} from "three";

export default class GameObject {
    public components: Component[] = [];
    public readonly transform: TransformComponent;

    private _isBuild: boolean = false;

    protected constructor(public readonly world: World, public readonly scene: Scene) {
        this.transform = new TransformComponent();
        this.components.push(this.transform);
        collections.gameObjects.push(this);
    }

    public static NewBuilder(world: World, scene: Scene): GameObjectBuilder {
        const go = new GameObject(world, scene);
        return new GameObjectBuilder(go, () => {
            go._isBuild = true
        });
    }

    public getComponentOfType<T extends Component>(type: new (...args: any[]) => T): T | undefined {
        return this.components.find((c): c is T => c instanceof type);
    }

    public _update(delta: number) {
        if (!this._isBuild) return;
        for (const component of this.components) {
            if (!component.active) continue;
            component.update(delta);
        }

        this.update(delta);
    }

    public update(_: number): void {
    }
}

class GameObjectBuilder {
    public constructor(private go: GameObject, private buildCallback: () => void) {
    }

    public addComponent(component: Component): GameObjectBuilder {
        this.go.components.push(component);
        return this;
    }

    public async build(): Promise<GameObject> {
        for (const c of this.go.components) {
            await c._awake(this.go);
        }
        for (const c of this.go.components) {
            await c._start();
        }
        this.buildCallback();
        return this.go;
    }
}
