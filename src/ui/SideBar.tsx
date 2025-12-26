import { ApiAccount } from "../client/Client";
import { FriendsBlock } from "./sidebar/friends/FriendsBlock";
import { GroupBlock } from "./sidebar/group/GroupBlock";
import { Profile } from "./sidebar/ProfileBlock";

export const SideBar = (props: { account: ApiAccount }) => {
  const { account } = props;

  return (
    <div className="flex flex-col flex-1 bg-gray-500 py-1 rounded-lg min-w-[250px] gap-y-1 justify-between">
      <div className="flex flex-col gap-y-1">
        <Profile account={account} />
        <FriendsBlock />
      </div>
      <GroupBlock />
    </div>
  );
};
