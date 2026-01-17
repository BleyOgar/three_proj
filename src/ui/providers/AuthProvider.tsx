import {observer} from "mobx-react-lite";
import {PropsWithChildren, useState} from "react";
import {AuthForm} from "@/ui/screens/Auth.tsx";
import {RegistrationForm} from "@/ui/screens/Registration.tsx";
import {clientStates} from "@/ui/store/client-states.ts";

export const AuthProvider = observer((props: PropsWithChildren) => {
    const [isRegistration, setIsRegistration] = useState(false);
    if (!clientStates.token) {
        if (isRegistration) return <RegistrationForm handleBack={() => setIsRegistration(false)}/>;
        return <AuthForm handleRegister={() => setIsRegistration(true)}/>;
    }
    return props.children;
});
