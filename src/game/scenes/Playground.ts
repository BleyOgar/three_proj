import {Scene} from "@/game/core/Scene.ts";

export class Playground extends Scene {
    public constructor() {
        super("playground");
    }

    async load(): Promise<void> {
        return Promise.resolve(undefined);
    }

    start() {

    }

    update() {

    }

    dispose() {
    }
}
