import { Friend } from "@heroiclabs/nakama-js";
import { Plus } from "lucide-react";
import { makeAutoObservable } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { Button } from "@/ui/components/button.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/components/dialog.tsx";
import { FriendsList } from "../friends-list/FriendsList.tsx";
import { FriendsListRowActionsProps } from "../friends-list/row/FriendsListRow.tsx";

class SelectFriendDialogStates {
  selected: Friend[] = [];
  onClose: VoidFunction = () => {};

  constructor() {
    makeAutoObservable(this);
  }

  selectChange(friend: Friend) {
    const idx = this.selected.findIndex((f) => f.user?.username === friend.user?.username);
    if (idx >= 0) {
      this.selected.splice(idx, 1);
    } else {
      this.selected.push(friend);
    }
  }

  clear() {
    this.selected = [];
  }
}

const states = new SelectFriendDialogStates();

const handleSelected = (friend: Friend) => {
  states.selectChange(friend);
  states.onClose();
};

const RowActions = observer((props: FriendsListRowActionsProps) => {
  const { friend } = props;
  if (friend.state !== 0) return null;
  return (
    <div>
      <Button size="icon" variant="ghost" onClick={() => handleSelected(friend)}>
        <Plus />
      </Button>
    </div>
  );
});

interface SelectFriendDialogProps {
  open: boolean;
  onClose: VoidFunction;
}

const SelectFriendDialog = observer((props: SelectFriendDialogProps) => {
  const { onClose, open } = props;
  useEffect(() => {
    states.onClose = () => {
      onClose();
      states.clear();
    };
  }, [onClose]);
  return (
    <Dialog
      modal={true}
      open={open}
      onOpenChange={(s) => {
        if (!s) {
          states.onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Выбор друга</DialogTitle>
        </DialogHeader>
        <FriendsList rowActions={RowActions} />
      </DialogContent>
    </Dialog>
  );
});

export default {
  SelectFriendDialog,
  states,
};
