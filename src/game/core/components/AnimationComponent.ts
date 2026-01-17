import {AnimationAction, AnimationMixer, Object3D} from "three";
import {AnimationsImportMap} from "@/types/Animations.ts";
import Loader3D from "../Loader3D.ts";
import Component from "./Component.ts";
import MeshComponent from "./MeshComponent.ts";

export default class AnimationComponent extends Component {
    public animationActions: Record<string, AnimationAction> = {};
    private _currentAnimation: string = "";

    private _runningActions: Set<AnimationAction> = new Set();
    private _stoppingActions: Set<AnimationAction> = new Set();

    public constructor(private _defaultImportsMap?: AnimationsImportMap) {
        super();
    }

    public override async awake(): Promise<void> {
        if (this._defaultImportsMap) {
            await this.loadAnimations(this._defaultImportsMap);
        }
    }

    public async loadAnimations(animationsMap: AnimationsImportMap) {
        if (!this.checkMixer()) return;

        for (const [key, value] of Object.entries(animationsMap)) {
            if (value.endsWith(".fbx")) {
                const animations = await Loader3D.loadAnimationsFromFbx(this.mixer!, value);
                this.setAnimationAction(key, animations[0]);
            }
        }
    }

    public setAnimationAction(name: string, action: AnimationAction) {
        this.animationActions[name] = action;
    }

    private checkMixer(): boolean {
        if (this.mixer) return true;
        this.mesh = this.gameObject.getComponentOfType(MeshComponent)?.mesh;
        if (!this.mesh) return false;
        this.mixer = new AnimationMixer(this.mesh);
        return true;
    }

    public override update(delta: number): void {
        for (const action of this._runningActions) {
            if (action.getEffectiveWeight() < 1 - delta * 5) action?.setEffectiveWeight(action.getEffectiveWeight() + delta * 5);
        }
        for (const action of this._stoppingActions) {
            action?.setEffectiveWeight(action.getEffectiveWeight() - delta * 5);
            if (action.getEffectiveWeight() <= 0) {
                this._stoppingActions.delete(action);
                action.stop();
            }
        }
        this.mixer?.update(delta);
    }

    private mesh: Object3D | undefined;
    private mixer: AnimationMixer | undefined;

    public playAnimation(name: string) {
        if (!this._currentAnimation.length) {
            const action = this.animationActions[name];
            if (!action) return;

            this._currentAnimation = name;
            action?.play();
            action?.setEffectiveWeight(0.5);
            this._runningActions.add(action);
            this._stoppingActions.delete(action);
            return;
        }

        if (this._currentAnimation === name) return;

        const action = this.animationActions[name];
        this._currentAnimation = name;
        this._runningActions.add(action);
        this._stoppingActions.delete(action);
        action?.play();
        action.setEffectiveWeight(0.5);

        for (const [actionName, action] of Object.entries(this.animationActions)) {
            if (actionName === name) continue;
            this._runningActions.delete(action);
            this._stoppingActions.add(action);
        }
    }
}
