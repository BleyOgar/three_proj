import * as Cannon from "cannon";
import * as Three from "three";
import collections from "./core/collections";
import Debug from "./core/Debug";
import GameObject from "./core/GameObject";
import Input from "./core/Input";
import Loader3D from "./core/Loader3D";
import { NoFrictionContactMaterial, noFrictionMaterial } from "./core/PhysicsMaterials";
import Player from "./gameobjects/Player";

export const game = () => {
  // Добавление rendeder в сцену
  const renderer = new Three.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.setAnimationLoop(animate);
  const app = document.getElementById("app");
  app?.appendChild(renderer.domElement);

  // Добавление сцены
  const scene = new Three.Scene();
  scene.background = new Three.Color(0x1e1e1e);
  scene.fog = new Three.Fog(0xa0a0a0, 200, 1000);

  Debug.init(scene);

  // Добавление камеры
  const camera = new Three.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

  // Обработчик изменения размеров окна
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Добавление освещения
  const ambientLight = new Three.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const directionalLight = new Three.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // Добавление физики
  const world = new Cannon.World();
  world.gravity.set(0, -9.82, 0);
  // world.defaultContactMaterial.friction = 0;
  world.addContactMaterial(NoFrictionContactMaterial);

  // Добавление платформы
  const groundMesh = new Three.Mesh(new Three.PlaneGeometry(2000, 2000), new Three.MeshStandardMaterial({ color: 0x808080 }));
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);

  // Добавленеи физики к платформе
  const groundBody = new Cannon.Body({ type: Cannon.Body.STATIC, shape: new Cannon.Plane() });
  groundBody.material = noFrictionMaterial;
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(groundBody);

  // Добавлене вспомогательной сетки мира
  const grid = new Three.GridHelper(2000, 20, 0x000000, 0x000000);
  grid.material.opacity = 0.2;
  grid.material.transparent = true;
  scene.add(grid);

  // Axes helper
  const axesHelper = new Three.AxesHelper(100);
  scene.add(axesHelper);

  // Добавление куба
  const cubeMesh = new Three.Mesh(new Three.BoxGeometry(1, 1, 1), new Three.MeshStandardMaterial({ color: 0xff0000 }));
  cubeMesh.castShadow = true;
  scene.add(cubeMesh);

  // Добавленеи физики тела куба
  const cubeBody = new Cannon.Body({ mass: 1, shape: new Cannon.Box(new Cannon.Vec3(0.5, 0.5, 0.5)), position: new Cannon.Vec3(0, 5, 0) });
  world.addBody(cubeBody);

  GameObject.Create(world, scene, { mesh: cubeMesh, body: cubeBody });

  // Добавление Game Loop
  const clock = new Three.Clock();
  Input.init(clock);

  function animate(): void {
    // requestAnimationFrame(animate);
    const delta = clock.getDelta();
    world.step(1 / 60, delta);

    collections.gameObjects.forEach((gameObject) => {
      gameObject._update(delta);
    });

    renderer.render(scene, camera);
  }

  // Загрузка 3D война
  Loader3D.loadMeshFbx("models/warrior-attack.fbx").then((model) => {
    new Player(camera, renderer, world, scene, model, {
      attack: "models/warrior-attack.fbx",
      run: "models/warrior-run.fbx",
      runBack: "models/warrior-run-back.fbx",
      idle: "models/warrior-idle.fbx",
      runRight: "models/warrior-run-right.fbx",
      runLeft: "models/warrior-run-left.fbx",
    });
  });
};
