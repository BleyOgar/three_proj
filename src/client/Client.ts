import {
    Client as NakamaClient,
    MatchData,
    MatchmakerMatched,
    MatchmakerTicket,
    MatchPresenceEvent,
    Party,
    PartyJoinRequest,
    PartyLeader,
    PartyMatchmakerTicket,
    PartyPresenceEvent,
    Session,
    Socket,
} from "@heroiclabs/nakama-js";
import {toast} from "sonner";
import InviteInGroupDialog from "@/ui/screens/main-menu/sidebar/group/dialogs/InviteInGroupDialog";
import {ApiList, Getter} from "@/types/client-types.ts";
import {clientStates} from "@/ui/store/client-states.ts";
import {AuthApi} from "@/client/api/AuthApi.ts";
import {FriendsApi} from "@/client/api/FriendsApi.ts";
import {UsersApi} from "@/client/api/UsersApi.ts";
import {GroupsApi} from "@/client/api/GroupsApi.ts";

export class Client {
    private static session?: Session
    private static client: NakamaClient = new NakamaClient("defaultkey", "127.0.0.1", "7350", false, 10000);
    private static socket: Socket = this.client.createSocket(false, true)

    private static sessionGetter: Getter<Session> = {
        get value() {
            if (!Client.session) throw new Error("404 Not authorized!")
            return Client.session
        }
    }

    public static readonly api: ApiList = {
        auth: new AuthApi(this.client, this.socket,
            (session) => {
                this.session = session
            }),
        friends: new FriendsApi(this.client, this.sessionGetter),
        users: new UsersApi(this.client, this.sessionGetter),
        groups: new GroupsApi(this.client, this.socket, this.sessionGetter)
    }

    async recoverSession() {
        // const lsTokens = localStorage.getItem("session");
        // if (lsTokens) {
        //     const {token, refresh_token, refresh_expires_at} = JSON.parse(lsTokens);
        //     session = Session.restore(token, refresh_token);
        //     console.log("Сессия восстановлена", session);
        //     try {
        //         await getAccountInfo();
        //         clientStates.token = token;
        //         clientStates.refreshToken = refresh_token;
        //         clientStates.refreshTokenExpireAt = refresh_expires_at;
        //         onLogin(token, refresh_token, refresh_expires_at, session.user_id);
        //     } catch (e) {
        //         console.error("Не удалось восстановить сессию!");
        //         logout();
        //     }
        // }
    }


    static async disconnectSocket() {
        console.log("=======  SOCKET DISCONNECT  =========");
        if (!this.socket) return;
        this.socket.disconnect(true);
    }

    static async setupSocket() {
        console.log("==========  Invoke setup socket!!!  ============");
        if (!this.session) return Promise.reject("");
        try {
            const socketSession = await this.socket.connect(this.session, true);
            this.socket.onnotification = async (notification) => {
                console.log("Notification", notification);
                switch (notification.code) {
                    case -2: // A user wants to add you as a friend
                    case -3: // A user accepted your friend invite
                        if (notification.subject) toast.info(notification.subject);
                        await this.api.friends.getFriends();
                        break;
                    case 101: // Ваш запрос в друзья был отклонен
                    case 102: // Пользователь удалил Вас из друзей
                        if (notification.content) toast.error((notification.content as any).message as string);
                        await this.api.friends.getFriends();
                        break;
                    case 103: // Вас приглашают вступить в группу
                        const groupId = (notification.content as any).group_id;
                        if (clientStates.group && clientStates.group.id !== groupId) toast.error("Вас пригласили в группу, но Вы уже состоите в другой группе!");
                        await this.api.groups.joinGroupRequest(groupId);
                        try {
                            await InviteInGroupDialog.open(groupId);
                            await this.api.groups.joinGroup();
                        } catch (e) {
                            await this.api.groups.leaveGroup();
                        }
                        break;
                    case 104: // Пользователь приглашен в группу
                    case 105: // Пользователь присоединился к группе
                    case 106: // Пользователь покинул группу
                        if (notification.subject) toast.info(notification.subject);
                        await this.api.groups.getGroupMembers();
                        if (clientStates.group && clientStates.group.creator_id === clientStates.userId && clientStates.groupMembers.length <= 1) await this.api.groups.deleteGroup();
                        break;
                    case 107: // Вы были исключены из группы
                        if (notification.subject) toast.info(notification.subject);
                        await this.api.groups.getGroup();
                        await this.api.groups.getGroupMembers();
                        break;
                    case 108: // Группа расформирована
                        if (notification.subject) toast.info(notification.subject);
                        await this.api.groups.getGroup();
                        await this.api.groups.getGroupMembers();
                        break;
                    case 109: // Указание на вступление в party
                        if (!this.socket) throw new Error("Сокет подключение не открыто!");
                        await this.socket.joinParty((notification.content as any).partyId);
                        break;
                }
            };

            this.socket.onmatchmakermatched = async (mm: MatchmakerMatched) => {
                const match = await this.socket.joinMatch(mm.match_id, mm.token);
                console.log("Match joined:", match);
                clientStates.match = match;
            };

            this.socket.onmatchpresence = async (mp: MatchPresenceEvent) => {
                console.log(`Match presense: joins: ${mp.joins}, leaves: ${mp.leaves}`);
            };

            this.socket.onmatchdata = async (md: MatchData) => {
                console.log("Match data: ", md);
            };

            this.socket.onparty = (p: Party) => {
                console.log("On party: ", p);
                clientStates.party = p;
                clientStates.partySize = 0;
            };

            this.socket.onpartyjoinrequest = async (req: PartyJoinRequest) => {
                console.log("On party join request: ", req);
                for (const presence of req.presences) {
                    if (!clientStates.groupMembers.some((m) => m.user?.id === presence.user_id)) {
                        await this.socket.removePartyMember(req.party_id, presence);
                        continue;
                    }
                    await this.socket.acceptPartyMember(req.party_id, presence);
                }
            };

            this.socket.onpartyleader = async (pl: PartyLeader) => {
                await this.socket.closeParty(pl.party_id);
                if (clientStates.matchmakerTicker) await this.socket.removeMatchmakerParty(pl.party_id, clientStates.matchmakerTicker);
            };

            this.socket.onpartyclose = async (pc) => {
                console.log("On party close: ", pc);
                clientStates.party = undefined;
                clientStates.partySize = 0;
                clientStates.matchmakerTicker = undefined;
            };

            this.socket.onpartydata = (pd) => {
                console.log("On party data: ", pd);
            };

            this.socket.onpartymatchmakerticket = (pmt: PartyMatchmakerTicket) => {
                console.log("On party matchmaiker ticket: ", pmt);
                clientStates.matchmakerTicker = pmt.ticket;
            };

            this.socket.onpartypresence = async (presence: PartyPresenceEvent) => {
                if (clientStates.group?.creator_id !== clientStates.userId) return;
                if (presence.party_id !== clientStates.party?.party_id) return;
                clientStates.partySize -= presence.leaves?.length || 0;
                clientStates.partySize += presence.joins?.length || 0;

                if (clientStates.partySize === clientStates.groupMembers.length) {
                    await this.continueFindGameParty();
                } else {
                    if (presence.leaves) {
                        await this.socket.closeParty(presence.party_id);
                        clientStates.matchmakerTicker = undefined;
                    }
                }
                console.log("On party presence: ", presence);
                console.log("Party size", clientStates.partySize);
            };

            this.socket.onmatchmakerticket = (mt: MatchmakerTicket) => {
                console.log("On matchmaker ticker: ", mt.ticket);
                clientStates.matchmakerTicker = mt.ticket;
            };

            console.log("Сокет успешно подключен", socketSession);
            return this.socket;
        } catch (e) {
            return Promise.reject(`Ошибка при подключении сокета ${e}`);
        }
    }

    static async getNotifications() {
        if (!this.session) return Promise.reject("Not authorized!");
        const response = await this.client.listNotifications(this.session);
        clientStates.notifications = response.notifications || [];
        console.log("Your notifications: ", response.notifications);
        return clientStates.notifications;
    }

    static async startFindGame() {
        if (!this.socket || !this.session) throw new Error("Нет подключения");

        if (clientStates.group && clientStates.group.id && clientStates.groupMembers.length > 1) {
            const party = await this.socket.createParty(false, clientStates.groupMembers.length);
            clientStates.party = party;
            clientStates.partySize = 0;
            await this.client.rpc(this.session, "create_party_js", {partyId: party.party_id});
        } else {
            const ticket = await this.socket.addMatchmaker("*", 2, 2);
            clientStates.matchmakerTicker = ticket.ticket;
        }
    }

    static async stopFindGame() {
        if (!clientStates.matchmakerTicker) return;
        if (!this.socket) return;

        if (clientStates.party) {
            if (clientStates.party.leader.user_id === clientStates.userId) {
                await this.socket.closeParty(clientStates.party.party_id);
            } else {
                await this.leaveParty();
            }
            clientStates.matchmakerTicker = undefined;
        } else {
            await this.socket.removeMatchmaker(clientStates.matchmakerTicker);
            clientStates.matchmakerTicker = undefined;
        }
    }

    static async leaveParty() {
        if (!clientStates.party) return;
        await this.socket.leaveParty(clientStates.party.party_id);
        clientStates.party = undefined;
        clientStates.partySize = 0;
        clientStates.matchmakerTicker = undefined;
    }

    static async getAccountInfo() {
        if (!this.session) return Promise.reject();
        const account = await this.client.getAccount(this.session);
        clientStates.account = account;
        return account;
    }

    private static async continueFindGameParty() {
        if (!this.socket || !this.session) throw new Error("Нет подключения");
        if (!clientStates.group || !clientStates.group.id) throw new Error("Вы не состоите в группе!");
        if (!clientStates.party?.party_id) throw new Error("Party не создана!");
        if (clientStates.partySize !== clientStates.groupMembers.length) throw new Error("Не все пользователи из группы вступили в Party для начала поиска матча!");

        const query = "*";
        const count = clientStates.partySize * 2;
        const pmt = await this.socket.addMatchmakerParty(clientStates.party.party_id, query, count, count, {group_id: clientStates.group.id});
        clientStates.matchmakerTicker = pmt.ticket;
    }
}
