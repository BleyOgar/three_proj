import { observer } from "mobx-react-lite";
import { Toaster } from "sonner";
import { clientStates } from "../client/Client";
import { AuthProvider } from "./AuthProvider";
import { MainMenu } from "./MainMenu";
import { SocketProvider } from "./SocketProvider";
import { StartGame } from "./StartGame";

export const App = observer(() => {
  return (
    <AuthProvider>
      <SocketProvider>{clientStates.match ? <StartGame /> : <MainMenu />}</SocketProvider>
      <Toaster />
    </AuthProvider>
  );
});
