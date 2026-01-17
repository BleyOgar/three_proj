import {observer} from "mobx-react-lite";
import {Toaster} from "sonner";
import {AuthProvider} from "./providers/AuthProvider.tsx";
import {MainMenu} from "./screens/main-menu/MainMenu.tsx";
import {SocketProvider} from "./providers/SocketProvider.tsx";
import {GameScreen} from "./screens/GameScreen.tsx";
import {clientStates} from "@/ui/store/client-states.ts";

export const App = observer(() => {
    return (
        <AuthProvider>
            <SocketProvider>{clientStates.match ? <GameScreen/> : <MainMenu/>}</SocketProvider>
            <Toaster/>
        </AuthProvider>
    );
});
