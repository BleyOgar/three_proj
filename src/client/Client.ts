import {
  Client,
  Friend,
  Group,
  GroupUser,
  MatchmakerMatched,
  MatchmakerTicket,
  Notification,
  Party,
  PartyJoinRequest,
  PartyLeader,
  PartyMatchmakerTicket,
  PartyPresenceEvent,
  Session,
} from "@heroiclabs/nakama-js";
import { makeAutoObservable } from "mobx";
import { toast } from "sonner";
import { generateUUID } from "three/src/math/MathUtils.js";
import InviteInGroupDialog from "../ui/sidebar/group/dialogs/InviteInGroupDialog";

export interface ClientResponse {
  success: boolean;
  payload: any;
  error: { code: number; message: string } | null;
}

const client = new Client("defaultkey", "192.168.101.174", "7350", false, 10000);
const socket = client.createSocket(false, true);
let session: Session | undefined;
let partyFullResolve: VoidFunction | undefined;

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
  match: MatchmakerMatched | undefined;

  userId: string | undefined;
  friends: Friend[] | undefined;
  notifications: Notification[] | undefined;

  constructor() {
    makeAutoObservable(this);
    recoverSession();
  }
}

const recoverSession = async () => {
  const lsTokens = localStorage.getItem("session");
  if (lsTokens) {
    const { token, refresh_token, refresh_expires_at } = JSON.parse(lsTokens);
    session = Session.restore(token, refresh_token);
    console.log("Сессия восстановлена", session);
    try {
      await getAccountInfo();
      clientStates.token = token;
      clientStates.refreshToken = refresh_token;
      clientStates.refreshTokenExpireAt = refresh_expires_at;
      onLogin(token, refresh_token, refresh_expires_at, session.user_id);
    } catch (e) {
      console.error("Не удалось восстановить сессию!");
      logout();
    }
  }
};

const parseError = async (err: unknown) => {
  if (!err) return null;
  const error = err as Response;
  if (error.body) {
    const data = await error.body.getReader().read();
    const errorString = JSON.parse(new TextDecoder("utf-8").decode(data.value));
    return errorString;
  }
};

export const authenticate = async (username: string, password: string): Promise<ClientResponse> => {
  try {
    const email = `${username}@example.com`;
    session = await client.authenticateEmail(email, password, false, username);

    console.log("Успешная авторизация!");
    console.log("Токен сессии: ", session.token);
    console.log("ID пользователя: ", session.user_id);
    const { token, user_id } = session;

    await onLogin(session.token, session.refresh_token, session.refresh_expires_at, user_id);

    return { success: true, payload: { token, userId: user_id }, error: null };
  } catch (err) {
    const errorMessage = await parseError(err);
    console.error("Ошибка аутентификации", errorMessage);
    return { success: false, payload: null, error: errorMessage };
  }
};

export const register = async (username: string, password: string) => {
  try {
    const email = `${username}@example.com`;
    session = await client.authenticateEmail(email, password, true, username);
    console.log("Успешная авторизация!");
    console.log("Токен сессии: ", session.token);
    console.log("ID пользователя: ", session.user_id);
    const { token, user_id } = session;

    await onLogin(session.token, session.refresh_token, session.refresh_expires_at, user_id);

    return { success: true, payload: { token, userId: user_id }, error: null };
  } catch (err) {
    const errorMessage = await parseError(err);
    console.error("Ошибка регистрации", errorMessage);
    return { success: false, payload: null, error: errorMessage };
  }
};

const onLogin = async (token: string, refresh_token: string, refresh_expires_at: number | undefined, userId: string | undefined) => {
  localStorage.setItem("session", JSON.stringify({ token, refreshToken: refresh_token, refreshExpires: refresh_expires_at }));
  clientStates.token = token;
  clientStates.refreshToken = refresh_token;
  clientStates.refreshTokenExpireAt = refresh_expires_at;
  clientStates.userId = userId;

  await getFriends();
  await getGroup();
  await getGroupMembers();
};

export const logout = async () => {
  if (!session) return;
  try {
    if (socket) {
      socket.disconnect(true);
    }
    await client.sessionLogout(session, session.token, session.refresh_token);
  } finally {
    clientStates.token = undefined;
    clientStates.refreshToken = undefined;
    clientStates.refreshTokenExpireAt = undefined;
    localStorage.removeItem("session");
  }
};

export const disconnectSocket = () => {
  if (!socket) return;
  socket.disconnect(true);
};

export const setupSocket = async () => {
  if (!session) return Promise.reject("");
  try {
    const socketSession = await socket.connect(session, true);
    socket.onnotification = async (notification) => {
      console.log("Notification", notification);
      switch (notification.code) {
        case -2: // A user wants to add you as a friend
        case -3: // A user accepted your friend invite
          if (notification.subject) toast.info(notification.subject);
          await getFriends();
          break;
        case 101: // Ваш запрос в друзья был отклонен
        case 102: // Пользователь удалил Вас из друзей
          if (notification.content) toast.error((notification.content as any).message as string);
          await getFriends();
          break;
        case 103: // Вас приглашают вступить в группу
          const groupId = (notification.content as any).group_id;
          if (clientStates.group && clientStates.group.id !== groupId) toast.error("Вас пригласили в группу, но Вы уже состоите в другой группе!");
          await joinGroupRequest(groupId);
          try {
            await InviteInGroupDialog.open(groupId);
            await joinGroup();
          } catch (e) {
            await leaveGroup();
          }
          break;
        case 104: // Пользователь приглашен в группу
        case 105: // Пользователь присоединился к группе
        case 106: // Пользователь покинул группу
          if (notification.subject) toast.info(notification.subject);
          await getGroupMembers();
          if (clientStates.group && clientStates.group.creator_id === clientStates.userId && clientStates.groupMembers.length <= 1) await deleteGroup();
          break;
        case 107: // Вы были исключены из группы
          if (notification.subject) toast.info(notification.subject);
          await getGroup();
          await getGroupMembers();
          break;
        case 108: // Группа расформирована
          if (notification.subject) toast.info(notification.subject);
          await getGroup();
          await getGroupMembers();
          break;
        case 109: // Указание на вступление в party
          if (!socket) throw new Error("Сокет подключение не открыто!");
          await socket.joinParty((notification.content as any).partyId);
          break;
      }
    };
    socket.onmatchmakermatched = (mm: MatchmakerMatched) => {
      clientStates.match = mm;
    };
    socket.onparty = (p: Party) => {
      console.log("On party: ", p);
      clientStates.party = p;
      clientStates.partySize = 0;
    };
    socket.onpartyjoinrequest = async (req: PartyJoinRequest) => {
      console.log("On party join request: ", req);
      for (const presence of req.presences) {
        if (!clientStates.groupMembers.some((m) => m.user?.id === presence.user_id)) {
          await socket.removePartyMember(req.party_id, presence);
          continue;
        }
        await socket.acceptPartyMember(req.party_id, presence);
      }
    };
    socket.onpartyleader = async (pl: PartyLeader) => {
      await socket.closeParty(pl.party_id);
      if (clientStates.matchmakerTicker) await socket.removeMatchmakerParty(pl.party_id, clientStates.matchmakerTicker);
    };
    socket.onpartyclose = async (pc) => {
      console.log("On party close: ", pc);
      clientStates.party = undefined;
      clientStates.partySize = 0;
      clientStates.matchmakerTicker = undefined;
    };
    socket.onpartydata = (pd) => {
      console.log("On party data: ", pd);
    };
    socket.onpartymatchmakerticket = (pmt: PartyMatchmakerTicket) => {
      console.log("On party matchmaiker ticket: ", pmt);
      clientStates.matchmakerTicker = pmt.ticket;
    };
    socket.onpartypresence = async (presence: PartyPresenceEvent) => {
      if (clientStates.group?.creator_id !== clientStates.userId) return;
      if (presence.party_id !== clientStates.party?.party_id) return;
      clientStates.partySize -= presence.leaves?.length || 0;
      clientStates.partySize += presence.joins?.length || 0;

      if (clientStates.partySize === clientStates.groupMembers.length) {
        continueFindGameParty();
      } else {
        if (presence.leaves) {
          await socket.closeParty(presence.party_id);
          clientStates.matchmakerTicker = undefined;
        }
      }
      console.log("On party presence: ", presence);
      console.log("Party size", clientStates.partySize);
    };
    socket.onmatchmakerticket = (mt: MatchmakerTicket) => {
      console.log("On matchmaker ticker: ", mt.ticket);
      clientStates.matchmakerTicker = mt.ticket;
    };

    console.log("Сокет успешно подключен", socketSession);
    return socket;
  } catch (e) {
    return Promise.reject(`Ошибка при подключении сокета ${e}`);
  }
};

export const findUser = async (username: string) => {
  if (!session) return Promise.reject("Not authorized!");
  const s = await client.getUsers(session, [], [username]);
  return s.users || [];
};

export const addFriend = async (userName: string) => {
  if (!session) return Promise.reject("Not authorized!");
  const s = await client.addFriends(session, [], [userName]);
  await getFriends();
  return s;
};

export const rejectFriendInvite = async (userName: string, userId: string) => {
  if (!session) return Promise.reject("Not authorized!");
  await client.rpc(session, "reject_friend_invite_js", { userName, userId });
  await getFriends();
};

export const deleteFriend = async (userName: string, userId: string) => {
  if (!session) return Promise.reject("Not authorized!");
  const s = await client.rpc(session, "delete_friend_js", { userName, userId });
  await getFriends();
  return s;
};

export const getFriends = async () => {
  if (!session) return Promise.reject("Not authorized!");
  const response = await client.listFriends(session);
  clientStates.friends = response.friends || [];
  console.log("Yout friends", response.friends);
  return clientStates.friends;
};

export const getNotifications = async () => {
  if (!session) return Promise.reject("Not authorized!");
  const response = await client.listNotifications(session);
  clientStates.notifications = response.notifications || [];
  console.log("Your notifications: ", response.notifications);
  return clientStates.notifications;
};

export const createGroup = async (userId: string, userName: string) => {
  if (!session) return Promise.reject("Not authorized!");
  // Сначала выхожу из текущей группы или удаляю её
  if (clientStates.group) {
    if (clientStates.group.creator_id === clientStates.userId) {
      await client.deleteGroup(session, clientStates.group.id!);
    } else {
      await client.leaveGroup(session, clientStates.group.id!);
    }
  }
  if (clientStates.party) {
    if (clientStates.matchmakerTicker) await socket.removeMatchmakerParty(clientStates.party.party_id, clientStates.matchmakerTicker);
    await socket.closeParty(clientStates.party.party_id);
  }
  // Создаю новую группу на сервере
  try {
    const group = await client.createGroup(session, { max_count: 2, open: false, name: generateUUID(), avatar_url: "", description: "", lang_tag: "ru" });
    if (!group || !group.id) return Promise.reject("Не удалось создать группу!");
    console.log("Группа создана!");
    clientStates.group = group;
    // Приглашаю в группу игрока
    await client.promoteGroupUsers;
    const response = await client.rpc(session, "invite_user_in_group_js", { userId, userName, groupId: group.id });
    if (!(response as any).payload.success) {
      console.log("Response", response);
      return Promise.reject("Не удалось пригласить игрока в Вашу группу!");
    }
    console.log("Приглашение отправлено!");
    // Обновляю список пользователей группы
    await getGroupMembers();
    return { success: true, payload: null, error: null };
  } catch (err) {
    const errorMessage = await parseError(err);
    return { success: false, payload: null, error: errorMessage };
  }
};

export const getGroup = async () => {
  if (!session || !clientStates.userId) return Promise.reject("Not authorized!");
  const groups = await client.listUserGroups(session, clientStates.userId!);
  console.log("GROUPS", groups);
  if (groups.user_groups?.length) {
    clientStates.group = groups.user_groups[0].group;
  } else {
    clientStates.group = undefined;
    clientStates.groupMembers = [];
  }
};

export const getGroupMembers = async () => {
  if (!session) return Promise.reject("Not authorized!");
  if (!clientStates.group) return Promise.reject("Вы не состоите в группе!");

  const response = await client.listGroupUsers(session, clientStates.group.id!);
  clientStates.groupMembers = response.group_users || [];
  return response.group_users || [];
};

export const leaveUserFromGroup = async (user: GroupUser) => {
  if (!session) return Promise.reject("Not authorized!");
  if (!clientStates.group) return Promise.reject("Вы не состоите в группе!");

  // Если это я
  if (clientStates.userId === user.user?.id) {
    if (user.user?.id === clientStates.group?.creator_id) {
      // Я создатель - расформировать группу
      return await deleteGroup();
    } else {
      // Я участник - выйти из группы
      return await leaveGroup();
    }
  } else {
    // Другой пользователь
    return await kickGroupUser(user);
  }
};

export const deleteGroup = async () => {
  if (!session) return Promise.reject("Not authorized!");
  if (!clientStates.group) return Promise.reject("Вы не состоите в группе!");
  if (clientStates.group.creator_id !== clientStates.userId) return Promise.reject("Вы не являетесь лидером группы!");

  const response = await client.rpc(session, "delete_group_js", { groupId: clientStates.group.id! });
  if (!(response as any).payload.success) return Promise.reject("Не удалось удалить группу!");
  clientStates.group = undefined;
  clientStates.groupMembers = [];
  return response;
};

export const leaveGroup = async () => {
  if (!session) return Promise.reject("Not authorized!");
  if (!clientStates.group) return Promise.reject("Вы не состоите в группе!");

  const response = await client.rpc(session, "leave_group_js", { groupId: clientStates.group.id! });
  if (!(response as any).payload.success) return Promise.reject("Не удалось покинуть группу!");

  clientStates.group = undefined;
  clientStates.groupMembers = [];
  return;
};

export const joinGroupRequest = async (groupId: string) => {
  if (!session) return { success: false, error: "Not authorized!", payload: null };

  try {
    const userName = clientStates.account?.user?.username;
    const userId = clientStates.account?.user?.id;
    const response = await client.rpc(session, "join_group_js", { groupId, userId, userName });
    if (!(response as any).payload.success) return { success: false, error: "Не удалось подать заявку на приглашение в группу!", payload: null };

    await getGroup();
    await getGroupMembers();
    return { success: true, error: null, payload: null };
  } catch (err) {
    const errorMessage = await parseError(err);
    console.error(err, errorMessage);
    return { success: false, error: errorMessage, payload: null };
  }
};

export const joinGroup = async () => {
  try {
    if (!session) return { success: false, error: "Not authorized!", payload: null };
    if (!clientStates.group) return { success: false, error: "Вы не состоите в группе!", payload: null };

    const response = await client.rpc(session, "join_group_accept_js", { groupId: clientStates.group.id! });
    if (!(response as any).payload.success) return { success: false, error: "Не удалось присоединиться к группе!", payload: null };
    console.log("Joined to group!");

    await getGroupMembers();
    return { success: true, error: null, payload: null };
  } catch (err) {
    const errorMessage = await parseError(err);
    console.error(errorMessage);
    return { success: false, error: errorMessage, payload: null };
  }
};

export const startFindGame = async () => {
  if (!socket || !session) throw new Error("Нет подключения");

  if (clientStates.group && clientStates.group.id && clientStates.groupMembers.length > 1) {
    const party = await socket.createParty(false, clientStates.groupMembers.length);
    clientStates.party = party;
    clientStates.partySize = 0;
    // clientStates.partySize = party.presences.length;
    await client.rpc(session, "create_party_js", { partyId: party.party_id });
  } else {
    const ticket = await socket.addMatchmaker("*", 2, 2);
    clientStates.matchmakerTicker = ticket.ticket;
  }
};

export const stopFindGame = async () => {
  if (!clientStates.matchmakerTicker) return;
  if (!socket) return;

  if (clientStates.party) {
    if (clientStates.party.leader.user_id === clientStates.userId) {
      await socket.closeParty(clientStates.party.party_id);
    } else {
      await leaveParty();
    }
    clientStates.matchmakerTicker = undefined;
  } else {
    await socket.removeMatchmaker(clientStates.matchmakerTicker);
    clientStates.matchmakerTicker = undefined;
  }
};

export const leaveParty = async () => {
  if (!clientStates.party) return;
  await socket.leaveParty(clientStates.party.party_id);
  clientStates.party = undefined;
  clientStates.partySize = 0;
  clientStates.matchmakerTicker = undefined;
};

const continueFindGameParty = async () => {
  if (!socket || !session) throw new Error("Нет подключения");
  if (!clientStates.group || !clientStates.group.id) throw new Error("Вы не состоите в группе!");
  if (!clientStates.party?.party_id) throw new Error("Party не создана!");
  if (clientStates.partySize !== clientStates.groupMembers.length) throw new Error("Не все пользователи из группы вступили в Party для начала поиска матча!");

  const query = "*";
  const count = clientStates.partySize * 2;
  const pmt = await socket.addMatchmakerParty(clientStates.party.party_id, query, count, count, { group_id: clientStates.group.id });
  clientStates.matchmakerTicker = pmt.ticket;
};

const kickGroupUser = async (user: GroupUser) => {
  if (!session) return Promise.reject("Not authorized!");
  if (!clientStates.group) return Promise.reject("Вы не состоите в группе!");

  const response = await client.rpc(session, "kick_from_group_js", { groupId: clientStates.group.id!, userId: user.user?.id, userName: user.user?.username });
  if (!(response as any).payload.success) return Promise.reject("Не удалось исключить пользователя из группы!");
  await getGroupMembers();
  if (clientStates.groupMembers.length <= 1) await deleteGroup();
  return response;
};

export type ApiAccount = Awaited<ReturnType<typeof client.getAccount>>;

export const getAccountInfo = async () => {
  if (!session) return Promise.reject();
  const account = await client.getAccount(session);
  clientStates.account = account;
  return account;
};

export const clientStates = new ClientStates();
