import {Friend, GroupUser, User} from "@heroiclabs/nakama-js";
import {Clock, Crown, Plus} from "lucide-react";
import {observer} from "mobx-react-lite";
import {Fragment, JSX, useCallback, useRef, useState} from "react";
import {Button} from "@/ui/components/button.tsx";
import {Popover, PopoverContent, PopoverTrigger} from "@/ui/components/popover.tsx";
import {cn} from "@/ui/lib/utils.ts";
import SelectFriendDialog from "../friends/dialogs/SelectFriendDialog.tsx";
import {clientStates} from "@/ui/store/client-states.ts";
import {Client} from "@/client/Client.ts";

interface EmptyUserItemProps {
    openAddUserDialog: () => void;
}

const EmptyUserItem = (props: EmptyUserItemProps) => {
    const {openAddUserDialog} = props;

    const handleClick = () => {
        openAddUserDialog();
    };

    return (
        <div className="w-[48px] h-[48px] border-2 rounded border-gray-300 bg-gray-400">
            <Button size={"icon"} variant={"link"} className="w-full h-full" onClick={handleClick}>
                <Plus/>
            </Button>
        </div>
    );
};

interface PopoverItem {
    id: string;
    onClick: (user: GroupUser) => Promise<void>;
    text: (props: { user: User }) => JSX.Element;
}

const items: PopoverItem[] = [
    {
        id: "kick",
        onClick: async (user: GroupUser) => {
            await Client.api.groups.leaveUserFromGroup(user);
        },
        text: (props) => <p className="p-2">{props.user.id === clientStates.userId ? "Покинуть группу" : "Выгнать"}</p>,
    },
];

const GroupUserItem = observer((props: { user: User; state: number }) => {
    const {user, state} = props;
    const [open, setOpen] = useState<boolean>(false);
    const closeTimer = useRef<any>(null);

    const handleMouseEnter = () => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        if (clientStates.groupMembers.length <= 1) return;

        setOpen(true);
    };

    const handleMouseLeave = useCallback(() => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(() => setOpen(false), 300);
    }, []);

    const isMe = user.id === clientStates.userId;
    const isParticipant = clientStates.group?.creator_id !== clientStates.userId;
    const isMeInvited = isMe && isParticipant && state === 3;
    const isLeader = clientStates.group?.creator_id === user.id;

    // const handleApplyGroupInvite = async () => {
    //   console.log("Is me invited", isMeInvited);
    //   if (!isMeInvited) return;
    //   await joinGroup();
    // };

    console.log(user.username, "state: ", state);

    return (
        <Popover open={(isParticipant && !isMeInvited && isMe && open) || (open && !isParticipant)}>
            <PopoverTrigger onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                <div
                    onClick={() => console.log("Click")}
                    className={cn(
                        "w-[48px] h-[48px] border-2 rounded border-gray-300 relative select-none",
                        state !== 3 ? (isMe ? "bg-green-300" : "bg-blue-300") : "bg-gray-400"
                    )}
                >
                    {state === 3 ?
                        <Clock className="absolute right-[1px] top-[1px] z-20 opacity-[.2] w-[16px] h-[16px]"/> : null}
                    {state !== 3 && isLeader ?
                        <Crown className="absolute left-[1px] top-[1px] w-[16px] h-[16px] text-yellow-500"/> : null}
                    <img src={user.avatar_url}
                         className={cn("pointer-events-none", state === 3 ? "grayscale" : undefined)}/>
                </div>
            </PopoverTrigger>
            <PopoverContent className="!p-0" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                <div className="flex flex-col">
                    {items.map((item) => (
                        <Fragment key={item.id}>
                            <Button variant={"link"} onClick={() => item.onClick({user, state})}>
                                {<item.text user={user}/>}
                            </Button>
                        </Fragment>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
});

export const GroupBlock = observer(() => {
    const account = clientStates.account;
    const [addUserOpen, setAddUserOpen] = useState<boolean>(false);

    const handleFriendSelected = async (friend: Friend) => {
        if (!friend.user?.username || !friend.user.id) return;
        await Client.api.groups.createGroup(friend.user.id, friend.user.username);
    };

    const handleSelectFriendDialogClose = () => {
        setAddUserOpen(false);
        if (SelectFriendDialog.states.selected.length) handleFriendSelected(SelectFriendDialog.states.selected[0]);
    };

    const emptyLength = clientStates.maxGroupSize - clientStates.groupMembers.length - (clientStates.group ? 0 : 1);
    console.log(account?.user, clientStates.group);
    return (
        <Fragment>
            <SelectFriendDialog.SelectFriendDialog open={addUserOpen} onClose={handleSelectFriendDialogClose}/>
            <div className="flex flex-row gap-1 p-1 bg-gray-600">
                {account?.user && !clientStates.group ? <GroupUserItem user={account.user} state={0}/> : null}
                {clientStates.groupMembers.map((member) => (
                    <GroupUserItem key={member.user?.username} user={member.user!} state={member.state!}/>
                ))}

                {emptyLength > 0
                    ? new Array(emptyLength).fill(() => 1).map((_, index) => <EmptyUserItem key={index}
                                                                                            openAddUserDialog={() => setAddUserOpen(true)}/>)
                    : null}
            </div>
        </Fragment>
    );
});
