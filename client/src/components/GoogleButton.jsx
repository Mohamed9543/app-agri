import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleButton({ onCredential }) {
  const divRef = useRef(null);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (!CLIENT_ID) return;

    function render() {
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => onCredential(response.credential),
      });
      window.google.accounts.id.renderButton(divRef.current, {
        theme: "outline",
        size: "large",
        width: 280,
        text: "continue_with",
      });
    }

    if (window.google?.accounts?.id) {
      render();
      return;
    }
    const script = document.createElement("script");
    script.src = `https://accounts.google.com/gsi/client?hl=${i18n.language}`;
    script.async = true;
    script.onload = render;
    document.body.appendChild(script);
  }, [onCredential, i18n.language]);

  if (!CLIENT_ID) {
    return (
      <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
        {t("auth.googleNotConfigured")}
      </p>
    );
  }

  return <div ref={divRef} className="flex justify-center" />;
}
