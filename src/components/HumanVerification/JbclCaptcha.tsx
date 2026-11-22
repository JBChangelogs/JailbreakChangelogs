"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import Script from "next/script";

declare global {
  interface Window {
    jbclCaptcha?: { render: () => void };
  }
}

export default function JbclCaptcha({
  onToken,
  onExpire,
}: {
  onToken: (token: string) => void;
  onExpire: () => void;
}) {
  const id = useId();
  const callback = `jbclToken${id}`;
  const expiredCallback = `jbclExpired${id}`;
  const handlers = useRef({ onToken, onExpire });
  useEffect(() => {
    handlers.current = { onToken, onExpire };
  }, [onToken, onExpire]);

  const render = useCallback(() => window.jbclCaptcha?.render(), []);

  useEffect(() => {
    const callbacks = window as unknown as Record<string, unknown>;
    let expiry: ReturnType<typeof setTimeout> | undefined;
    callbacks[callback] = (token: string) => {
      clearTimeout(expiry);
      expiry = setTimeout(() => handlers.current.onExpire(), 5 * 60 * 1000);
      handlers.current.onToken(token);
    };
    callbacks[expiredCallback] = () => handlers.current.onExpire();
    render();
    return () => {
      clearTimeout(expiry);
      delete callbacks[callback];
      delete callbacks[expiredCallback];
    };
  }, [callback, expiredCallback, render]);

  return (
    <>
      <div
        className="jbcl-captcha w-full max-w-[340px]"
        data-sitekey="pk_jbcl"
        data-callback={callback}
        data-expired-callback={expiredCallback}
      />
      <Script
        src="https://captcha.jailbreakchangelogs.com/api.js"
        strategy="afterInteractive"
        onReady={render}
      />
    </>
  );
}
