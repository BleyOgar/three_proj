import {observer} from "mobx-react-lite";
import {useEffect, useRef} from "react";
import {clientStates} from "@/ui/store/client-states.ts";
import {SceneManager} from "@/game/core/SceneManager.ts";
import {Playground} from "@/game/scenes/Playground.ts";
import {Engine} from "@/game/core/Engine.ts";

export const GameScreen = observer(() => {
    const match = clientStates.match;
    const gameContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!gameContainerRef.current || !match) return;

        Engine.init(gameContainerRef.current)

        SceneManager.registerScene("playground", Playground)
        SceneManager.load("playground")

        Engine.start()
        // game(gameContainerRef.current, match);
        return () => {
            Engine.stop()
            SceneManager.unload();
        }
    }, [gameContainerRef.current]);

    return (
        <div>
            <div className="fixed w-screen h-screehn overflow-hidden" id="game" ref={gameContainerRef}/>
        </div>
    );
});
