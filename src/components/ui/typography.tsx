import { PropsWithChildren } from "react";

export function TypographyH2(props: PropsWithChildren) {
  return <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">{props.children}</h2>;
}

export function TypographyH1(props: PropsWithChildren) {
  return <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">{props.children}</h1>;
}

export function TypographyH3(props: PropsWithChildren) {
  return <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">{props.children}</h3>;
}

export function TypographyH4(props: PropsWithChildren) {
  return <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">{props.children}</h4>;
}

export function TypographyP(props: PropsWithChildren) {
  return <p className="leading-7 [&:not(:first-child)]:mt-6">{props.children}</p>;
}

export function TypographyLarge(props: PropsWithChildren) {
  return <div className="text-lg font-semibold">{props.children}</div>;
}

export function TypographyLead(props: PropsWithChildren) {
  return <p className="text-muted-foreground text-xl">{props.children}</p>;
}

export function TypographySmall(props: PropsWithChildren) {
  return <small className="text-sm leading-none font-medium">{props.children}</small>;
}

export function TypographyMuted(props: PropsWithChildren) {
  return <p className="text-muted-foreground text-sm">{props.children}</p>;
}
