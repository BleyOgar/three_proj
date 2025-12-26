import { observer } from "mobx-react-lite";
import { Toaster } from "sonner";
import { AuthProvider } from "./AuthProvider";
import { MainMenu } from "./MainMenu";
import { SocketProvider } from "./SocketProvider";

export const App = observer(() => {
  return (
    <AuthProvider>
      <SocketProvider>
        <MainMenu />
      </SocketProvider>
      <Toaster />
    </AuthProvider>
  );
});
