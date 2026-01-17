import {Clock, WebGLRenderer} from "three";
import {SceneManager} from "@/game/core/SceneManager.ts";

export class Engine {
    public static renderer: WebGLRenderer = new WebGLRenderer({antialias: true,})
    private static clock: Clock = new Clock(false)

    public static init(container: HTMLDivElement) {
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        container.appendChild(this.renderer.domElement);
    }

    public static start() {
        this.clock.start()
        this.renderer.setAnimationLoop(this.loop.bind(this))
    }

    public static stop() {
        this.clock.stop()
        this.renderer.setAnimationLoop(null)
    }

    public static loop() {
        const delta = this.clock.getDelta();

        SceneManager.active?.gameObjects.forEach(o => o.update(delta))
        SceneManager.active?.world.step(1 / 60, delta)

        if (SceneManager.active)
            this.renderer.render(SceneManager.active.scene, SceneManager.active.camera)
    }
}
