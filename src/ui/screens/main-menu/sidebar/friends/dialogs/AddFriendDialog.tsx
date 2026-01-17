import {User} from "@heroiclabs/nakama-js";
import debounce from "debounce";
import {PlusIcon} from "lucide-react";
import {observer} from "mobx-react-lite";
import {ChangeEvent, Fragment, useState} from "react";
import {Avatar, AvatarFallback, AvatarImage} from "@/ui/components/avatar.tsx";
import {Button} from "@/ui/components/button.tsx";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/ui/components/dialog.tsx";
import {Input} from "@/ui/components/input.tsx";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle
} from "@/ui/components/item.tsx";
import {clientStates} from "@/ui/store/client-states.ts";
import {Client} from "@/client/Client.ts";

export const AddFriendDialog = observer((props: { open: boolean; onClose: VoidFunction }) => {
    const {open, onClose} = props;
    const [users, setUsers] = useState<User[]>([]);
    const invitedLogins = (clientStates.friends || []).filter((f) => f.state !== 0).map((f) => f.user!.username) as string[];

    const findUserDebounced = debounce((text: string) => {
        Client.api.users.findUser(text).then((u) => {
            setUsers(u);
        });
    }, 500);

    const handleInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        findUserDebounced(text);
    };

    const handleAddUser = async (userName: string | undefined) => {
        if (!userName) return;
        const success = await Client.api.friends.addFriend(userName);
        console.log("Add user result", success);
    };

    return (
        <Dialog
            modal={true}
            open={open}
            onOpenChange={(s) => {
                if (!s) onClose();
                setUsers([]);
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Поиск игроков</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col">
                    <Input type="text" onChange={handleInputChange}/>
                    <div className="flex w-full flex-col gap-6">
                        <ItemGroup>
                            {users.map((user, _) => (
                                <Fragment key={user.username}>
                                    <Item>
                                        <ItemMedia>
                                            <Avatar>
                                                <AvatarImage src={user.avatar_url}
                                                             className={invitedLogins.includes(user.username!) ? "grayscale" : undefined}/>
                                                <AvatarFallback>{user.username?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        </ItemMedia>
                                        <ItemContent className="gap-1">
                                            <ItemTitle>{user.username} </ItemTitle>
                                            <ItemDescription>{user.display_name}</ItemDescription>
                                        </ItemContent>
                                        <ItemActions>
                                            {!invitedLogins.includes(user.username!) ? (
                                                <Button variant={"ghost"} size="icon" className="rounded-full"
                                                        onClick={() => handleAddUser(user.username)}>
                                                    <PlusIcon/>
                                                </Button>
                                            ) : null}
                                        </ItemActions>
                                    </Item>
                                </Fragment>
                            ))}
                        </ItemGroup>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
});
