import {observer} from "mobx-react-lite";
import {MouseEvent, useState} from "react";
import {Button} from "@/ui/components/button.tsx";
import {Card, CardContent, CardDescription} from "@/ui/components/card.tsx";
import {Input} from "@/ui/components/input.tsx";
import {TypographyH1} from "@/ui/components/typography.tsx";
import {Client} from "@/client/Client.ts";

export const RegistrationForm = observer((props: { handleBack: () => void }) => {
    const [login, setLogin] = useState("");
    const [pass, setPass] = useState("");
    const [pass1, setPass1] = useState("");
    const [error, setError] = useState("");

    const handleRegister = async (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const {error} = await Client.api.auth.register(login, pass);
        if (error) {
            setError(error.message);
            console.log("payload", error.message);
        }
    };

    return (
        <div className="flex flex-col gap-2 items-center justify-center w-full h-full p-4">
            <TypographyH1>Регистрация</TypographyH1>
            <form className="flex flex-col gap-2 w-1/2">
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
                <Input placeholder="Repeat password" type="password" onChange={(e) => setPass1(e.target.value)}/>
                <Button className="min-w-[170px]"
                        disabled={!login.length || !pass1.length || pass.length < 8 || pass !== pass1}
                        onClick={handleRegister}>
                    Зарегистрироваться
                </Button>
                <Button className="absolute top-4 left-4" onClick={() => props.handleBack()}>
                    Назад
                </Button>
            </form>
        </div>
    );
});
