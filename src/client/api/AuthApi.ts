import {Client as NakamaClient, Session, Socket} from "@heroiclabs/nakama-js";
import {ClientResponse} from "@/types/client-types.ts";
import {clientStates} from "@/ui/store/client-states.ts";
import {parseError} from "@/utils.ts";

export class AuthApi {
    private session?: Session

    public constructor(private client: NakamaClient,
                       private socket: Socket,
                       private loginCallback: (session: Session) => void,
    ) {
    }

    async authenticate(username: string, password: string): Promise<ClientResponse> {
        try {
            const email = `${username}@example.com`;
            const session = await this.client.authenticateEmail(email, password, false, username)
            this.session = session
            console.log("Успешная авторизация!");
            console.log("Токен сессии: ", session.token);
            console.log("ID пользователя: ", session.user_id);

            await this.onLogin(session);
            return {success: true, payload: session, error: null};
        } catch (err) {
            const errorMessage = await parseError(err);
            console.error("Ошибка аутентификации", errorMessage);
            return {success: false, payload: null, error: errorMessage};
        }
    }

    async register(username: string, password: string) {
        try {
            const email = `${username}@example.com`;
            const session = await this.client.authenticateEmail(email, password, true, username);
            this.session = session
            console.log("Успешная регистрация!");
            console.log("Токен сессии: ", session.token);
            console.log("ID пользователя: ", session.user_id);

            await this.onLogin(session);
            return {success: true, payload: session, error: null};
        } catch (err) {
            const errorMessage = await parseError(err);
            console.error("Ошибка регистрации", errorMessage);
            return {success: false, payload: null, error: errorMessage};
        }
    }

    async logout() {
        console.log("=======  LOGOUT =======");
        if (!this.session) return;
        try {
            if (this.socket) {
                this.socket.disconnect(true);
            }
            await this.client.sessionLogout(this.session, this.session.token, this.session.refresh_token);
        } finally {
            clientStates.token = undefined;
            clientStates.refreshToken = undefined;
            clientStates.refreshTokenExpireAt = undefined;
            localStorage.removeItem("session");
        }
    }

    private async onLogin(session: Session) {
        localStorage.setItem("session", JSON.stringify({
            token: session.token,
            refreshToken: session.refresh_token,
            refreshExpires: session.refresh_expires_at
        }));
        clientStates.token = session.token;
        clientStates.refreshToken = session.refresh_token;
        clientStates.refreshTokenExpireAt = session.refresh_expires_at;
        clientStates.userId = session.user_id;

        this.loginCallback(session)
    }
}
