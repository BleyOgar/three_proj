import {FriendsBlock} from "@/ui/screens/main-menu/sidebar/friends/FriendsBlock.tsx";
import {GroupBlock} from "@/ui/screens/main-menu/sidebar/group/GroupBlock.tsx";
import {Profile} from "@/ui/screens/main-menu/sidebar/ProfileBlock.tsx";
import {ApiAccount} from "@/types/client-types.ts";

export const SideBar = (props: { account: ApiAccount }) => {
    const {account} = props;

    return (
        <div className="flex flex-col flex-1 bg-gray-500 py-1 rounded-lg min-w-[250px] gap-y-1 justify-between">
            <div className="flex flex-col gap-y-1">
                <Profile account={account}/>
                <FriendsBlock/>
            </div>
            <GroupBlock/>
        </div>
    );
};
