import { useEffect } from "react";
import { useSession } from "context/session";
import languageEN from "lang/en";
import stylesPage from "../assets/css/dashboard.module.css";

const Index = () => {

  const encodedContext = useSession()?.context;
  useEffect(() => {
    if (!encodedContext) return;
    async function ensureScript() {
      await fetch(`/api/server/set-script?context=${encodedContext}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: null,
      });
    }
    ensureScript();
  }, [encodedContext]);

  return (
    <div className={stylesPage.dashboard}>
      <div className={stylesPage.inner_content}>
        <div className={stylesPage.ic_right}>
          <img
            src="/assets/app-default-dashboard.png"
            alt="default-dashboard"
            height="454px"
            style={{ objectFit: "contain" }}
          />
        </div>

        <div className={stylesPage.ic_left}>
          <h1>
            Bring your Guns, T-Shirts & Mugs portfolio to life with our powerful
            3D product customizers.
          </h1>
        </div>
      </div>

      <div className={stylesPage.contact_info}>
        <h2>{languageEN?.appDetails?.name}</h2>
        <p>
          A variety of packages are offered. Please contact your{" "}
          <b>{languageEN?.appDetails?.name}</b> Account Manager or <br />{" "}
          <a href={`mailto:${languageEN?.appDetails?.email}`}>
            {languageEN?.appDetails?.email}
          </a>{" "}
          for more information
        </p>
      </div>
    </div>
  );
};

export default Index;
