import * as THREE from "three";

export default class ThirdPersonCamera {
  private camera: THREE.PerspectiveCamera;
  private target: THREE.Object3D;
  private renderer: THREE.WebGLRenderer;

  private distance = 5;
  private minDistance = 2;
  private maxDistance = 10;

  private yaw = 0;
  private pitch = 0.3;
  private minPitch = -Math.PI / 2;
  private maxPitch = Math.PI / 2 - 0.1;

  private isRotating = false;
  private mouseSensitivity = 0.002;

  private offset = new THREE.Vector3(0, 1.5, 0); // высота над персонажем
  private currentPosition = new THREE.Vector3();

  constructor(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera, target: THREE.Object3D) {
    this.renderer = renderer;
    this.camera = camera;
    this.target = target;

    this.addEventListeners();
  }

  private addEventListeners(): void {
    const el = this.renderer.domElement;
    el.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
    el.addEventListener("mousedown", this.onMouseDown.bind(this));
    el.addEventListener("mouseup", this.onMouseUp.bind(this));
    el.addEventListener("mousemove", this.onMouseMove.bind(this));
    el.addEventListener("wheel", this.onMouseWheel.bind(this), { passive: true });
  }

  private onMouseDown = (event: MouseEvent): void => {
    if (event.button === 2 || event.button === 0) {
      this.renderer.domElement.requestPointerLock();
      this.isRotating = true;
    }
  };

  private onMouseUp = (event: MouseEvent): void => {
    if (event.button === 2 || event.button === 0) {
      document.exitPointerLock();
      this.isRotating = false;
    }
  };

  private onMouseMove = (event: MouseEvent): void => {
    if (!this.isRotating) return;

    this.yaw -= event.movementX * this.mouseSensitivity;
    this.pitch -= event.movementY * this.mouseSensitivity;

    this.pitch = THREE.MathUtils.clamp(this.pitch, this.minPitch, this.maxPitch);
  };

  private onMouseWheel = (event: WheelEvent): void => {
    this.distance += event.deltaY * 0.01;
    this.distance = THREE.MathUtils.clamp(this.distance, this.minDistance, this.maxDistance);
  };

  public update(deltaTime: number): void {
    const targetPosition = new THREE.Vector3().copy(this.target.position).add(this.offset);

    // сферические координаты
    const x = targetPosition.x + this.distance * Math.cos(this.pitch) * Math.sin(this.yaw);
    const y = targetPosition.y - this.distance * Math.sin(this.pitch);
    const z = targetPosition.z + this.distance * Math.cos(this.pitch) * Math.cos(this.yaw);

    const desiredPosition = new THREE.Vector3(x, y, z);

    // сглаживание
    // this.currentPosition.lerp(desiredPosition, 1 - Math.exp(-deltaTime * 10));
    this.currentPosition = desiredPosition;

    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(targetPosition);
  }

  public dispose(): void {
    const el = this.renderer.domElement;
    el.removeEventListener("mousedown", this.onMouseDown.bind(this));
    el.removeEventListener("mouseup", this.onMouseUp.bind(this));
    el.removeEventListener("mousemove", this.onMouseMove.bind(this));
    el.removeEventListener("wheel", this.onMouseWheel.bind(this));
  }
}
