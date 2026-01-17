import {LogOut} from "lucide-react";
import {Client} from "@/client/Client.ts";
import {Button} from "@/ui/components/button.tsx";

export const NavBar = () => {
    const handleLogout = async () => {
        await Client.api.auth.logout();
    };

    return (
        <div className="flex flex-row h-[54px] rounded-lg bg-gray-700 p-1 justify-between items-center">
            <div></div>
            <Button size="icon" onClick={handleLogout}>
                <LogOut/>
            </Button>
        </div>
    );
};
