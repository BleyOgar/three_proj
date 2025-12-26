import { LogOut } from "lucide-react";
import { logout } from "../../client/Client";
import { Button } from "../../components/ui/button";

export const NavBar = () => {
  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex flex-row h-[54px] rounded-lg bg-gray-700 p-1 justify-between items-center">
      <div></div>
      <Button size="icon" onClick={handleLogout}>
        <LogOut />
      </Button>
    </div>
  );
};
