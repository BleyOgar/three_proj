import * as Three from "three";

export default class Debug {
  private static _scene: Three.Scene | null = null;
  public static init(scene: Three.Scene) {
    this._scene = scene;
  }

  public static drawLine(pt0: Three.Vector3, pt1: Three.Vector3, color: string | number = 0x0000ff) {
    const material = new Three.LineBasicMaterial({ color: color });
    const points = [];
    points.push(pt0);
    points.push(pt1);
    const geometry = new Three.BufferGeometry().setFromPoints(points);
    const line = new Three.Line(geometry, material);
    this._scene?.add(line);
  }
}
