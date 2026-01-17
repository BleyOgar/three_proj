import {Client as NakamaClient, Session} from "@heroiclabs/nakama-js";
import {Getter} from "@/types/client-types.ts";

export class UsersApi {
    constructor(private client: NakamaClient, private session: Getter<Session>) {
    }

    async findUser(username: string) {
        if (!this.session.value) return Promise.reject("Not authorized!");
        const s = await this.client.getUsers(this.session.value, [], [username]);
        return s.users || [];
    }
}
