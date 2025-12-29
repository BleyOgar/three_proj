import { observer } from "mobx-react-lite";
import { useEffect, useRef } from "react";
import { clientStates } from "../client/Client";
import { game } from "../game";

export const StartGame = observer(() => {
  const match = clientStates.match;
  const gameContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!gameContainerRef.current || !match) return;
    game(gameContainerRef.current, match);
  }, [gameContainerRef.current]);

  return (
    <div>
      <div className="fixed w-screen h-screehn overflow-hidden" id="game" ref={gameContainerRef} />
    </div>
  );
});
