import {PropsWithChildren, useEffect, useState} from "react";
import {Client} from "@/client/Client.ts";

export const SocketProvider = (props: PropsWithChildren) => {
    const [connected, setConnected] = useState<boolean>(false);
    useEffect(() => {
        Client.setupSocket().then(() => setConnected(true));
    }, []);

    if (connected) return props.children;
    return <div>Loading...</div>;
};
