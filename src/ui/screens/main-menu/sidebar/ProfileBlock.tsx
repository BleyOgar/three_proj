import {Card} from "@/ui/components/card.tsx";
import {ApiAccount} from "@/types/client-types.ts";

export const Profile = (props: { account: ApiAccount }) => {
    const {account} = props;
    return (
        <Card className="flex flex-col mx-1">
            <div className="flex flex-row p-1 items-center">
                <div className="w-[48px] h-[48px]">
                    <img src={account?.user?.avatar_url}/>
                </div>
                <div className="flex flex-col flex-1">
                    <p>{account?.user?.display_name}</p>
                    <p>Status</p>
                </div>
                <div>Rank</div>
            </div>
        </Card>
    );
};
