import {AuthApi} from "@/client/api/AuthApi.ts";
import {Client as NakamaClient} from '@heroiclabs/nakama-js'
import {FriendsApi} from "@/client/api/FriendsApi.ts";
import {UsersApi} from "@/client/api/UsersApi.ts";
import {GroupsApi} from "@/client/api/GroupsApi.ts";

export interface ClientResponse {
    success: boolean;
    payload: any;
    error: { code: number; message: string } | null;
}

export type Getter<T> = { get value(): Readonly<T> }

export type ApiAccount = Awaited<ReturnType<typeof NakamaClient.prototype.getAccount>>

export type ApiList = {
    auth: AuthApi,
    friends: FriendsApi,
    users: UsersApi,
    groups: GroupsApi,
}
