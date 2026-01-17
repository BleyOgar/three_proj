import {Client as NakamaClient, GroupUser, Session, Socket} from "@heroiclabs/nakama-js";
import {Getter} from "@/types/client-types.ts";
import {clientStates} from "@/ui/store/client-states.ts";
import {parseError} from "@/utils.ts";
import {generateUUID} from "three/src/math/MathUtils.js";

export class GroupsApi {
    constructor(private client: NakamaClient,
                private socket: Socket,
                private session: Getter<Session>) {
    }

    async createGroup(userId: string, userName: string) {
        // Сначала выхожу из текущей группы или удаляю её
        if (clientStates.group) {
            if (clientStates.group.creator_id === clientStates.userId) {
                await this.client.deleteGroup(this.session.value, clientStates.group.id!);
            } else {
                await this.client.leaveGroup(this.session.value, clientStates.group.id!);
            }
        }
        if (clientStates.party) {
            if (clientStates.matchmakerTicker) await this.socket.removeMatchmakerParty(clientStates.party.party_id, clientStates.matchmakerTicker);
            await this.socket.closeParty(clientStates.party.party_id);
        }
        // Создаю новую группу на сервере
        try {
            const group = await this.client.createGroup(this.session.value, {
                max_count: 2,
                open: false,
                name: generateUUID(),
                avatar_url: "",
                description: "",
                lang_tag: "ru"
            });
            if (!group || !group.id) return Promise.reject("Не удалось создать группу!");
            console.log("Группа создана!");
            clientStates.group = group;
            // Приглашаю в группу игрока
            // await this.client.promoteGroupUsers();
            const response = await this.client.rpc(this.session.value, "invite_user_in_group_js", {
                userId,
                userName,
                groupId: group.id
            });
            if (!(response as any).payload.success) {
                console.log("Response", response);
                return Promise.reject("Не удалось пригласить игрока в Вашу группу!");
            }
            console.log("Приглашение отправлено!");
            // Обновляю список пользователей группы
            await this.getGroupMembers();
            return {success: true, payload: null, error: null};
        } catch (err) {
            const errorMessage = await parseError(err);
            return {success: false, payload: null, error: errorMessage};
        }
    }

    async getGroupMembers() {
        if (!clientStates.group) return Promise.reject("Вы не состоите в группе!");

        const response = await this.client.listGroupUsers(this.session.value, clientStates.group.id!);
        clientStates.groupMembers = response.group_users || [];
        return response.group_users || [];
    }

    async getGroup() {
        if (!this.session || !clientStates.userId) return Promise.reject("Not authorized!");
        const groups = await this.client.listUserGroups(this.session.value, clientStates.userId!);
        console.log("GROUPS", groups);
        if (groups.user_groups?.length) {
            clientStates.group = groups.user_groups[0].group;
        } else {
            clientStates.group = undefined;
            clientStates.groupMembers = [];
        }
    }

    async kickGroupUser(user: GroupUser) {
        if (!clientStates.group) return Promise.reject("Вы не состоите в группе!");

        const response = await this.client.rpc(this.session.value, "kick_from_group_js", {
            groupId: clientStates.group.id!,
            userId: user.user?.id,
            userName: user.user?.username
        });
        if (!(response as any).payload.success) return Promise.reject("Не удалось исключить пользователя из группы!");
        await this.getGroupMembers();
        if (clientStates.groupMembers.length <= 1) await this.deleteGroup();
        return response;
    }

    async joinGroup() {
        try {
            if (!clientStates.group) return {success: false, error: "Вы не состоите в группе!", payload: null};

            const response = await this.client.rpc(this.session.value, "join_group_accept_js", {groupId: clientStates.group.id!});
            if (!(response as any).payload.success) return {
                success: false,
                error: "Не удалось присоединиться к группе!",
                payload: null
            };
            console.log("Joined to group!");

            await this.getGroupMembers();
            return {success: true, error: null, payload: null};
        } catch (err) {
            const errorMessage = await parseError(err);
            console.error(errorMessage);
            return {success: false, error: errorMessage, payload: null};
        }
    }

    async joinGroupRequest(groupId: string) {
        try {
            const userName = clientStates.account?.user?.username;
            const userId = clientStates.account?.user?.id;
            const response = await this.client.rpc(this.session.value, "join_group_js", {groupId, userId, userName});
            if (!(response as any).payload.success) return {
                success: false,
                error: "Не удалось подать заявку на приглашение в группу!",
                payload: null
            };

            await this.getGroup();
            await this.getGroupMembers();
            return {success: true, error: null, payload: null};
        } catch (err) {
            const errorMessage = await parseError(err);
            console.error(err, errorMessage);
            return {success: false, error: errorMessage, payload: null};
        }
    }

    async leaveGroup() {
        if (!clientStates.group) return Promise.reject("Вы не состоите в группе!");

        const response = await this.client.rpc(this.session.value, "leave_group_js", {groupId: clientStates.group.id!});
        if (!(response as any).payload.success) return Promise.reject("Не удалось покинуть группу!");

        clientStates.group = undefined;
        clientStates.groupMembers = [];
        return;
    }

    async deleteGroup() {
        if (!clientStates.group) return Promise.reject("Вы не состоите в группе!");
        if (clientStates.group.creator_id !== clientStates.userId) return Promise.reject("Вы не являетесь лидером группы!");

        const response = await this.client.rpc(this.session.value, "delete_group_js", {groupId: clientStates.group.id!});
        if (!(response as any).payload.success) return Promise.reject("Не удалось удалить группу!");
        clientStates.group = undefined;
        clientStates.groupMembers = [];
        return response;
    }

    async leaveUserFromGroup(user: GroupUser) {
        if (!clientStates.group) return Promise.reject("Вы не состоите в группе!");

        // Если это я
        if (clientStates.userId === user.user?.id) {
            if (user.user?.id === clientStates.group?.creator_id) {
                // Я создатель - расформировать группу
                return await this.deleteGroup();
            } else {
                // Я участник - выйти из группы
                return await this.leaveGroup();
            }
        } else {
            // Другой пользователь
            return await this.kickGroupUser(user);
        }
    }
}
