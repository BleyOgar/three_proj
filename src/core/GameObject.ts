import * as Cannon from "cannon";
import * as Three from "three";
import collections from "./collections";
import Component from "./components/Component";
import TransformComponent from "./components/TransformComponent";

export default class GameObject {
    public body: Cannon.Body | null = null;
    public mixer: Three.AnimationMixer | null = null;
    public mesh: Three.Object3D | null = null;
    public animationActions: Record<string, Three.AnimationAction> = {};
    public components: Component[] = [];
    public readonly transform: TransformComponent;

    private _isBuilded: boolean = false;

    protected constructor(protected world: Cannon.World, protected scene: Three.Scene) {
        this.transform = new TransformComponent();
        this.components.push(this.transform);

        if (this.mesh) {
            this.mixer = new Three.AnimationMixer(this.mesh);
            this.scene.add(this.mesh);
        }

        collections.gameObjects.push(this);
    }

    public build() {
        this._isBuilded = true;
    }

    public static NewBuilder(world: Cannon.World, scene: Three.Scene): GameObjectBuilder {
        return new GameObjectBuilder(new GameObject(world, scene));
    }

    public findComponentOfType<T extends Component>(type: new (...args: any[]) => T): T | undefined {
        return this.components.find((c): c is T => c instanceof type);
    }

    public _update(delta: number) {
        if (!this._isBuilded) return;
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
    public constructor(private go: GameObject) {
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
        this.go.build();
        return this.go;
    }
}
