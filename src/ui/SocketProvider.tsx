import { PropsWithChildren, useEffect, useState } from "react";
import { setupSocket } from "../client/Client";

export const SocketProvider = (props: PropsWithChildren) => {
  const [connected, setConnected] = useState<boolean>(false);
  useEffect(() => {
    setupSocket().then(() => setConnected(true));
  }, []);

  if (connected) return props.children;
  return <div>Loading...</div>;
};
