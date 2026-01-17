import {Clock, UserCheck, UserMinus, UserRoundX, Users} from "lucide-react";
import {observer} from "mobx-react-lite";
import {Button} from "@/ui/components/button.tsx";
import {FriendsListRowActionsProps} from "./FriendsListRow.tsx";
import {Client} from "@/client/Client.ts";

export const FriendsListRowActions = observer((props: FriendsListRowActionsProps) => {
    const {
        friend: {state, user},
    } = props;

    if (!user || state === undefined) return null;

    const handleApplyInvite = async () => {
        if (!user.username) return;
        await Client.api.friends.addFriend(user.username);
    };

    const handleRejectInvite = async () => {
        if (!user.username || !user.id) return;
        console.log("reject invite user", user.username);
        await Client.api.friends.rejectFriendInvite(user.username, user.id);
    };

    const handleInviteParty = async () => {
        if (!user.username || !user.id) return;
        await Client.api.groups.createGroup(user.id, user.username);
    };

    const handleDeleteFriend = async () => {
        if (!user.username || !user.id) return;
        await Client.api.friends.deleteFriend(user.username, user.id);
    };

    switch (state) {
        case 1:
            return <Clock/>;
        case 2:
            return (
                <div className="flex flex-row gap-2 items-center">
                    <Button size="icon" variant={"ghost"} onClick={handleApplyInvite}>
                        <UserCheck/>
                    </Button>
                    <Button size="icon" variant={"destructive"} onClick={handleRejectInvite}>
                        <UserRoundX/>
                    </Button>
                </div>
            );
        case 0:
            return (
                <div className="flex flex-row gap-2 items-center">
                    <Button size="icon" variant={"ghost"} onClick={handleInviteParty}>
                        <Users/>
                    </Button>
                    <Button size="icon" variant={"ghost"} onClick={handleDeleteFriend}>
                        <UserMinus/>
                    </Button>
                </div>
            );
        default:
            return <div>{state}</div>;
    }
});
