import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { ApiAccount, clientStates, disconnectSocket, getAccountInfo, startFindGame, stopFindGame } from "../client/Client";
import { Button } from "../components/ui/button";
import { SideBar } from "./SideBar";
import { NavBar } from "./navbar/NavBar";
import InviteInGroupDialog from "./sidebar/group/dialogs/InviteInGroupDialog";

export const MainMenu = observer(() => {
  const [account, setAccount] = useState<ApiAccount | null>();
  useEffect(() => {
    getAccountInfo().then((info) => {
      console.log(info);
      setAccount(info);
    });
    return () => {
      disconnectSocket();
    };
  }, []);
  const [findGameTime, setFindGameTime] = useState<number>(0);
  const timer = useRef<any>(null);

  const startInterval = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      console.log("tick");
      setFindGameTime((t) => t + 1);
    }, 1000);
  };

  useEffect(() => {
    console.log("ticket useEffect", clientStates.matchmakerTicker);
    if (clientStates.matchmakerTicker) startInterval();
    return () => {
      if (timer.current) clearInterval(timer.current);
      console.log("unmount", clientStates.matchmakerTicker);
    };
  }, [clientStates.matchmakerTicker]);

  if (!account) return null;

  const findGameDisabled =
    clientStates.groupMembers.some((m) => m.state === 3) ||
    (clientStates.group && clientStates.group?.creator_id !== clientStates.userId) ||
    Boolean(clientStates.matchmakerTicker);

  const handleFindGameClick = async () => {
    await startFindGame();
  };

  return (
    <div className="flex flex-col w-full h-full overflow-hidden p-2 gap-2">
      <InviteInGroupDialog.Form />
      <NavBar />
      <div className="flex flex-row flex-1 overflow-hidden">
        <SideBar account={account} />
        <div className="flex flex-col flex-[5]">
          <div className="flex flex-col justify-end items-end w-full h-full">
            {clientStates.matchmakerTicker ? (
              <div className="flex flex-col gap-2">
                <div className="flex flex-row justify-between">
                  <p>Поиск игры...</p>
                  <p>{findGameTime} с.</p>
                </div>
                <Button onClick={() => stopFindGame()}>Выйти из очереди</Button>
              </div>
            ) : clientStates.party ? (
              <p>Ожидание готовности участников...</p>
            ) : null}
            {!clientStates.party ? (
              <Button onClick={handleFindGameClick} disabled={findGameDisabled}>
                Найти игру
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
});
