import { Clock, Vector2 } from "three";

export default class Input {
  private static _clock: Clock | null = null;
  private static keys: Record<string, { isPressed: boolean; pressTime: number; releaseTime: number }> = {};
  private static _mouseDelta: Vector2 = new Vector2(0, 0);

  public static init(clock: Clock) {
    this._clock = clock;
    document.addEventListener("keydown", (e) => {
      this.handleKeyPressed(e.code);
    });
    document.addEventListener("keyup", (e) => {
      this.handleKeyReleased(e.code);
    });
    document.addEventListener("mousedown", (e) => {
      console.log(e.button);
      this.handleKeyPressed(`mouse_${e.button}`);
    });
    document.addEventListener("mouseup", (e) => {
      this.handleKeyReleased(`mouse_${e.button}`);
    });
    document.addEventListener("blur", () => {
      console.log("focus out");
    });

    document.addEventListener("mousemove", (e) => {
      this._mouseDelta.set(e.movementX, e.movementY);
    });
  }

  private static handleKeyPressed(key: string) {
    // key = key.toLowerCase()
    if (!this.keys[key]) this.keys[key] = { isPressed: false, pressTime: 0, releaseTime: 0 };
    if (!this.keys[key].isPressed) this.keys[key].pressTime = this._clock?.elapsedTime || 0;
    this.keys[key].isPressed = true;
  }

  private static handleKeyReleased(key: string) {
    // key = key.toLowerCase()
    if (!this.keys[key]) this.keys[key] = { isPressed: false, pressTime: 0, releaseTime: 0 };
    if (this.keys[key].isPressed) this.keys[key].releaseTime = this._clock?.elapsedTime || 0;
    this.keys[key].isPressed = false;
  }

  /**
   * Нажата ли клавиша
   * @param key клавиша
   */
  public static isKeyPressed(key: string): boolean {
    // key = key.toLowerCase()
    if (!this.keys[key]) return false;
    return this.keys[key].isPressed;
  }

  /**
   * Была ли только что нажата клавиша (в последнем кадре)
   * @param key клавиша
   */
  public static isKeyJustPressed(key: string): boolean {
    // key = key.toLowerCase()
    const now = performance.now();
    if (now === 0) return false;
    const deltaTime = this._clock?.getDelta() || 0;
    if (!this.keys[key]) return false;
    if (!this.keys[key].isPressed) return false;
    return this.keys[key].isPressed && now - this.keys[key].pressTime <= 1.5 * deltaTime;
  }

  /**
   * Была ли только что отпущена клавиша (в текущем кадре)
   * @param key клавиша
   */
  public static isKeyJustReleased(key: string): boolean {
    // key = key.toLowerCase()
    const now = performance.now();
    if (now === 0) return false;
    const deltaTime = this._clock?.getDelta() || 0;
    if (!this.keys[key]) return false;
    if (this.keys[key].isPressed) return false;
    return !this.keys[key].isPressed && now - this.keys[key].releaseTime <= 1.5 * deltaTime;
  }

  /**
   * Была ли только что нажата кнопка мыши (в текущем кадре)
   * @param button кнопка мыши
   */
  public static isMouseButtonJustPressed(button: number): boolean {
    return this.isKeyJustPressed(`mouse_${button}`);
  }

  /**
   * Была ли только что отпущена кнопка мыши (в текущем кадре)
   * @param button кнопка мыши
   */
  public static isMouseButtonJustReleased(button: number): boolean {
    return this.isKeyJustReleased(`mouse_${button}`);
  }

  /**
   * Нажата ли кнопка мыши
   * @param button кнопка мыши
   */
  public static isMouseButtonPressed(button: number): boolean {
    return this.isKeyPressed(`mouse_${button}`);
  }

  /**
   * Получить значение оси [-1; 1]
   * @param negative клавиша для отрицательного значения оси
   * @param positive клавиша для положительного значения оси
   */
  public static getAxis(negative: string, positive: string): number {
    let axis = 0;
    if (this.isKeyPressed(negative)) axis--;
    if (this.isKeyPressed(positive)) axis++;
    return axis;
  }

  /**
   * Получить ускорение мыши за последний кадр
   */
  public static get mouseDelta(): Vector2 {
    const d = { x: this._mouseDelta.x, y: this._mouseDelta.y };
    this._mouseDelta.set(0, 0);
    console.log("D", d);
    return new Vector2(d.x, d.y);
  }
}
