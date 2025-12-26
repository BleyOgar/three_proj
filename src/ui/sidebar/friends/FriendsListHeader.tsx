import { UserPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { AddFriendDialog } from "./dialogs/AddFriendDialog";

export const FriendsListHeader = () => {
  const [addFrientOpen, setAddFrientOpen] = useState<boolean>(false);
  const handleAddFriend = () => {
    setAddFrientOpen(true);
  };

  return (
    <div className="flex flex-row items-center justify-between bg-gray-900 text-white px-2 py-[2px]">
      <AddFriendDialog open={addFrientOpen} onClose={() => setAddFrientOpen(false)} />
      <p>Друзья</p>
      <div className="flex flex-row gap-2">
        <Button variant={"ghost"} onClick={handleAddFriend} size={"icon"}>
          <UserPlus />
        </Button>
      </div>
    </div>
  );
};
