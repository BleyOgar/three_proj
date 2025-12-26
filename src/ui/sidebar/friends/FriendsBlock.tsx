import { FriendsList } from "./friends-list/FriendsList";
import { FriendsListRowActions } from "./friends-list/row/FriendsListRowActions";
import { FriendsListHeader } from "./FriendsListHeader";

export const FriendsBlock = () => {
  return (
    <div className="flex flex-col overflow-hidden">
      <FriendsListHeader />
      <div className="flex-1 flex flex-col overflow-hidden px-1">
        <FriendsList rowActions={FriendsListRowActions} />
      </div>
    </div>
  );
};
