import * as Three from 'three'
import {Camera} from 'three'
import {World} from "cannon";
import {NoFrictionContactMaterial} from "@/game/core/PhysicsMaterials.ts";
import GameObject from "@/game/core/GameObject.ts";

export abstract class Scene {
    public scene: Three.Scene = new Three.Scene()
    public world: World = new World()

    public abstract get camera(): Camera

    public gameObjects: GameObject[] = []

    protected constructor(public readonly name: string) {
        this.world.gravity.set(0, -9.82, 0);
        this.world.addContactMaterial(NoFrictionContactMaterial);
    }

    public abstract load(): Promise<void>

    public abstract start(): void

    public abstract update(): void

    public abstract dispose(): void
}
