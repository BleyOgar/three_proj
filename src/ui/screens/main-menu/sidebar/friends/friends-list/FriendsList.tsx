import {observer} from "mobx-react-lite";
import {JSX} from "react";
import {FriendsListRow, FriendsListRowActionsProps} from "./row/FriendsListRow.tsx";
import {clientStates} from "@/ui/store/client-states.ts";

interface FriendsListProps {
    rowActions: (props: FriendsListRowActionsProps) => JSX.Element | null;
}

export const FriendsList = observer((props: FriendsListProps) => {
    const {rowActions} = props;
    const friends = clientStates.friends;

    return (
        <div className="flex flex-col gap-1 my-1 w-full overflow-y-auto">
            {friends?.map((friend) => (
                <FriendsListRow friend={friend} key={friend.user?.username} actions={rowActions}/>
            ))}
        </div>
    );
});
