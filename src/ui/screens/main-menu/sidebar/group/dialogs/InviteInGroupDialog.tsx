import { DialogTitle } from "@radix-ui/react-dialog";
import { makeAutoObservable } from "mobx";
import { observer } from "mobx-react-lite";
import { Button } from "@/ui/components/button.tsx";
import { Dialog, DialogContent, DialogHeader } from "@/ui/components/dialog.tsx";

class InviteInGroupDialogStates {
  public isOpen: boolean = false;
  groupId: string | undefined;
  resolve: ((groupId: string) => void) | undefined;
  reject: VoidFunction | undefined;

  constructor() {
    makeAutoObservable(this);
  }

  public clear() {
    this.resolve = undefined;
    this.reject = undefined;
    this.groupId = undefined;
  }
}

const InviteInGroupDialog = observer(() => {
  const handleAccept = () => {
    states.isOpen = false;
    if (states.resolve && states.groupId) states.resolve(states.groupId);
    states.clear();
  };

  const handleReject = () => {
    states.isOpen = false;
    if (states.reject) states.reject();
    states.clear();
  };

  return (
    <Dialog
      open={states.isOpen}
      onOpenChange={(s) => {
        console.log(s);
        if (!s) handleReject();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Вас приглашают вступить в группу!</DialogTitle>
        </DialogHeader>
        <div className="flex flex-row w-full justify-between items-center px-2">
          <Button onClick={handleAccept}>Вступить</Button>
          <Button onClick={handleReject}>Отклонить</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

const states = new InviteInGroupDialogStates();

const open = async (groupId: string): Promise<string> => {
  states.groupId = groupId;
  return new Promise<string>((resolve, reject) => {
    states.resolve = resolve;
    states.reject = reject;
    states.isOpen = true;
  });
};

export default {
  states: states,
  Form: InviteInGroupDialog,
  open: open,
};
