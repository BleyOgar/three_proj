import {Scene} from "@/game/core/Scene.ts";

export class SceneManager {
    private static _active: Scene | undefined = undefined
    private static _sceneLoaders: { [sceneName: string]: new (...args: any[]) => Scene } = {}

    public static get active(): Scene | undefined {
        return this._active;
    }

    public static registerScene(name: string, loader: new (...args: any[]) => Scene) {
        this._sceneLoaders[name] = loader;
    }

    public static async load(sceneName: string) {
        if (this.active?.name === sceneName) return;
        if (this.active) this.active.dispose()
        if (!this._sceneLoaders[sceneName]) throw new Error(`Сцены ${sceneName} не зарегистрировано!`)
        this._active = new this._sceneLoaders[sceneName]();
        this._active.scene.add(this._active.camera) // Вызов здесь, чтобы не было такой публичной функции в Scene классе
        await this._active.load()

        this._active.start()
    }

    public static unload() {
        if (!this.active) return;
        this.active.dispose()
    }
}
