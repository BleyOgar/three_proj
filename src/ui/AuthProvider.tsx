import { observer } from "mobx-react-lite";
import { MouseEvent, PropsWithChildren, useState } from "react";
import { authenticate, clientStates, register } from "../client/Client";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { TypographyH1 } from "../components/ui/typography";

const RegistrationForm = observer((props: { handleBack: () => void }) => {
  const [login, setLogin] = useState("");
  const [pass, setPass] = useState("");
  const [pass1, setPass1] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const { error } = await register(login, pass);
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
        <Input placeholder="Login" type="text" onChange={(e) => setLogin(e.target.value)} />
        <Input placeholder="Password" type="password" onChange={(e) => setPass(e.target.value)} />
        <Input placeholder="Repeat password" type="password" onChange={(e) => setPass1(e.target.value)} />
        <Button className="min-w-[170px]" disabled={!login.length || !pass1.length || pass.length < 8 || pass !== pass1} onClick={handleRegister}>
          Зарегистрироваться
        </Button>
        <Button className="absolute top-4 left-4" onClick={() => props.handleBack()}>
          Назад
        </Button>
      </form>
    </div>
  );
});

const AuthForm = observer((props: { handleRegister: () => void }) => {
  const [login, setLogin] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const { error } = await authenticate(login, pass);
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
        <Input placeholder="Login" type="text" onChange={(e) => setLogin(e.target.value)} />
        <Input placeholder="Password" type="password" onChange={(e) => setPass(e.target.value)} />
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

export const AuthProvider = observer((props: PropsWithChildren) => {
  const [isRegistration, setIsRegistration] = useState(false);
  if (!clientStates.token) {
    if (isRegistration) return <RegistrationForm handleBack={() => setIsRegistration(false)} />;
    return <AuthForm handleRegister={() => setIsRegistration(true)} />;
  }
  return props.children;
});
