import {Client as NakamaClient, Session} from "@heroiclabs/nakama-js";
import {Getter} from "@/types/client-types.ts";
import {clientStates} from "@/ui/store/client-states.ts";

export class FriendsApi {
    constructor(private client: NakamaClient,
                private sessionRef: Getter<Session>) {
    }

    async getFriends() {
        if (!this.sessionRef) return Promise.reject("Not authorized!");
        const response = await this.client.listFriends(this.sessionRef.value);
        clientStates.friends = response.friends || [];
        console.log("Yout friends", response.friends);
        return clientStates.friends;
    }

    async addFriend(username: string) {
        if (!this.sessionRef.value) return Promise.reject("Not authorized!");
        const s = await this.client.addFriends(this.sessionRef.value, [], [username]);
        await this.getFriends();
        return s;
    }

    async rejectFriendInvite(userName: string, userId: string) {
        if (!this.sessionRef.value) return Promise.reject("Not authorized!");
        await this.client.rpc(this.sessionRef.value, "reject_friend_invite_js", {userName, userId});
        await this.getFriends();
    }

    async deleteFriend(userName: string, userId: string) {
        if (!this.sessionRef.value) return Promise.reject("Not authorized!");
        const s = await this.client.rpc(this.sessionRef.value, "delete_friend_js", {userName, userId});
        await this.getFriends();
        return s;
    }
}
