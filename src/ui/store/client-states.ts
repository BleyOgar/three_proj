import {Friend, Group, GroupUser, Match, Notification, Party,} from "@heroiclabs/nakama-js";
import {makeAutoObservable} from "mobx";
import {ApiAccount} from "@/types/client-types.ts";

class ClientStates {
    token: string | undefined;
    refreshToken: string | undefined;
    refreshTokenExpireAt: number | undefined;
    account: ApiAccount | undefined;
    maxGroupSize: number = 2;
    groupMembers: GroupUser[] = [];
    group: Group | undefined;
    party: Party | undefined;
    partySize: number = 0;
    matchmakerTicker: string | undefined;
    match: Match | undefined;

    userId: string | undefined;
    friends: Friend[] | undefined;
    notifications: Notification[] | undefined;

    constructor() {
        makeAutoObservable(this);
        // recoverSession();
    }
}

export const clientStates = new ClientStates()
