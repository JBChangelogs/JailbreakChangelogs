declare module "react-twemoji" {
  import { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

  interface TwemojiOptions {
    className?: string;
    base?: string;
    ext?: string;
    size?: string | number;
    folder?: string;
    callback?: (icon: string, options: TwemojiOptions) => string | false;
  }

  interface TwemojiProps extends ComponentPropsWithoutRef<"div"> {
    children?: ReactNode;
    noWrapper?: boolean;
    options?: TwemojiOptions;
    tag?: ElementType;
  }

  const Twemoji: (props: TwemojiProps) => JSX.Element;
  export default Twemoji;
}
