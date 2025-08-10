import { useEffect, useState } from "react";
import { useSession } from "context/session";
import stylesPage from "../assets/css/dashboard.module.css";

const Index = () => {
  const encodedContext = useSession()?.context;
  const [storeContext, setStoreContext] = useState('');

  useEffect(()=>{
    setStoreContext(encodedContext);
  },[encodedContext])


  return (
    <div className={stylesPage.dashboard} data-context={storeContext}>
      <div className={stylesPage.inner_content}>
        
        <div className={stylesPage.ic_right}>
          <img
            src="/assets/app-default-dashboard.png"
            alt="default-dashboard"
            height="454px"
            style={{objectFit:'contain'}}
          />
        </div>

        <div className={stylesPage.ic_left}>
          <h1>
           Bring your Guns, T-Shirts & Mugs portfolio to life with our powerful 3D product customizers.
          </h1>
        </div>

      </div>

      <div className={stylesPage.contact_info}>
        <h2>KDS Customizer</h2>
        <p>
          A variety of packages are offered. Please contact your{" "}
          <b>KDS Customizer</b> Account Manager or <br />{" "}
          <a href="mailto:info@kds-customizer.com">info@kds-customizer.com</a>{" "}
          for more information
        </p>
      </div>

      
    </div>
  );
};

export default Index;
