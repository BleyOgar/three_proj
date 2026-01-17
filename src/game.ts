import {Match} from "@heroiclabs/nakama-js";
import * as Cannon from "cannon";
import {toJS} from "mobx";
import * as Three from "three";
import collections from "@/game/core/collections";
import AnimationComponent from "@/game/core/components/AnimationComponent";
import BodyComponent from "@/game/core/components/BodyComponent";
import MeshComponent from "@/game/core/components/MeshComponent";
import Debug from "@/game/core/Debug";
import GameObject from "@/game/core/GameObject";
import Input from "@/game/core/Input";
import {NoFrictionContactMaterial, noFrictionMaterial} from "@/game/core/PhysicsMaterials";
import Player from "@/game/gameobjects/Player";

export const game = async (gameContainer: HTMLDivElement, match: Match) => {
    // Добавление rendeder в сцену
    const renderer = new Three.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.setAnimationLoop(animate);
    gameContainer.appendChild(renderer.domElement);

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
    const groundMesh = new Three.Mesh(new Three.PlaneGeometry(2000, 2000), new Three.MeshStandardMaterial({color: 0x808080}));
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Добавленеи физики к платформе
    const groundBody = new Cannon.Body({type: Cannon.Body.STATIC, shape: new Cannon.Plane()});
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

    // Добавление Game Loop
    const clock = new Three.Clock();
    Input.init(clock);

    function animate(): void {
        // requestAnimationFrame(animate);
        const delta = clock.getDelta();

        collections.gameObjects.forEach((gameObject) => {
            gameObject._update(delta);
        });

        world.step(1 / 60, delta);

        renderer.render(scene, camera);
    }

    const teamA_spawnPonts = [new Three.Vector3(-50, 0, -50), new Three.Vector3(-70, 0, -50)];
    const teamB_spawnPonts = [new Three.Vector3(50, 0, -50), new Three.Vector3(70, 0, -50)];
    const noPartySpawnPoints = [teamA_spawnPonts[0], teamB_spawnPonts[0]];

    const spawnPlayer = async (userId: string, spawnPoint: Three.Vector3) => {
        const playerObj = await GameObject.NewBuilder(world, scene)
            .addComponent(new MeshComponent("models/warrior-attack.fbx"))
            .addComponent(
                new BodyComponent(
                    new Cannon.Body({
                        mass: 70,
                        shape: new Cannon.Box(new Cannon.Vec3(0.3, 0.1, 0.1)),
                        position: new Cannon.Vec3(0, 5, 0),
                        fixedRotation: true,
                        linearDamping: 0.9,
                        material: noFrictionMaterial,
                    })
                )
            )
            .addComponent(
                new AnimationComponent({
                    attack: "models/warrior-attack.fbx",
                    run: "models/warrior-run.fbx",
                    runBack: "models/warrior-run-back.fbx",
                    idle: "models/warrior-idle.fbx",
                    runRight: "models/warrior-run-right.fbx",
                    runLeft: "models/warrior-run-left.fbx",
                })
            )
            .addComponent(new Player(userId, camera, renderer))
            .build();

        playerObj.transform.position = spawnPoint;
    };

    console.log(`Match`, toJS(match));
    for (const user of match.presences || []) {
        let playerSpawnPoint: Three.Vector3;
        playerSpawnPoint = noPartySpawnPoints.shift()!;
        spawnPlayer(user.user_id, playerSpawnPoint);
    }

    spawnPlayer(match.self.user_id, noPartySpawnPoints.shift()!);
};
