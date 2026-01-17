import {observer} from "mobx-react-lite";
import {MouseEvent, useState} from "react";
import {Button} from "@/ui/components/button.tsx";
import {Card, CardContent, CardDescription} from "@/ui/components/card.tsx";
import {Input} from "@/ui/components/input.tsx";
import {TypographyH1} from "@/ui/components/typography.tsx";
import {Client} from "@/client/Client.ts";

export const AuthForm = observer((props: { handleRegister: () => void }) => {
    const [login, setLogin] = useState("");
    const [pass, setPass] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const {error} = await Client.api.auth.authenticate(login, pass);
        if (error) {
            setError(error.message);
            console.log("payload", error.message);
        }
    };

    const handleRegister = async (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        props.handleRegister();
    };

    return (
        <div className="flex flex-col gap-2 w-full p-4 items-center justify-center m-auto">
            <TypographyH1>Авторизация</TypographyH1>
            <form className="flex flex-col gap-2 w-1/2 items-center">
                {error ? (
                    <Card className="border-red-400 w-full">
                        <CardContent className="flex flex-col justify-center items-center p-2">
                            <CardDescription>
                                <p className="text-red-400">{error}</p>
                            </CardDescription>
                        </CardContent>
                    </Card>
                ) : null}
                <Input placeholder="Login" type="text" onChange={(e) => setLogin(e.target.value)}/>
                <Input placeholder="Password" type="password" onChange={(e) => setPass(e.target.value)}/>
                <div className="flex flex-row gap-2 items-center w-full">
                    <Button className="flex-1" disabled={!login.length || pass.length < 8} onClick={handleLogin}>
                        Войти
                    </Button>
                    <Button className="flex-1" onClick={handleRegister}>
                        Зарегистрироваться
                    </Button>
                </div>
            </form>
        </div>
    );
});
