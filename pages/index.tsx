import stylesPage from "../assets/css/dashboard.module.css";

const Index = () => {
  return (
    <div className={stylesPage.dashboard}>
      <div className={stylesPage.inner_content}>
        <div className={stylesPage.ic_left}>
          <h1>
            Bring your Sports & Apparel <br />
            portfolio to life with our diverse
            <br />
            set of product configurators.
          </h1>
          <p>
            Design, preview, and personalize every item with zero design skills.
            Skyrocket your brand or gift game. From product configurators to
            dynamic storefronts, we help you turn every customer interaction
            into a visually stunning, high-converting experience.
          </p>
        </div>

        <div className={stylesPage.ic_right}>
          <img
            src="/assets/app-default-dashboard.png"
            alt="default-dashboard"
          />
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

      <div className={stylesPage.full_image_bottom}>
        <img
          src="/assets/app-default-dashboard-bottom-01.png"
          alt="default-dashboard"
        />
      </div>
    </div>
  );
};

export default Index;
