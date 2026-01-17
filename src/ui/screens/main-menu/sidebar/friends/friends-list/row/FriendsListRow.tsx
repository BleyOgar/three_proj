import { Friend } from "@heroiclabs/nakama-js";
import { observer } from "mobx-react-lite";
import { JSX } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar.tsx";
import { Card } from "@/ui/components/card.tsx";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/ui/components/item.tsx";

export type FriendsListRowActionsProps = { friend: Friend };

interface FriendsListRowProps {
  friend: Friend;
  actions: (props: FriendsListRowActionsProps) => JSX.Element | null;
}

export const FriendsListRow = observer((props: FriendsListRowProps) => {
  const { friend } = props;
  if (!friend.user || !friend.user.username || !friend.user.id) return null;

  const Actions = props.actions;

  return (
    <Card className="p-1!">
      <Item className="!py-1 !px-2">
        <ItemMedia>
          <Avatar>
            <AvatarImage src={friend.user?.avatar_url} className={friend.state === 1 ? "grayscale" : undefined} />
            <AvatarFallback>{friend.user?.username?.charAt(0)}</AvatarFallback>
          </Avatar>
        </ItemMedia>
        <ItemContent className="gap-1">
          <ItemTitle>{friend.user?.username} </ItemTitle>
          <ItemDescription>{friend.user?.display_name}</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Actions friend={friend} />
        </ItemActions>
      </Item>
    </Card>
  );
});
