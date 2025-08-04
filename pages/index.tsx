import { Flex, Grid, GridItem, H4, Panel } from '@bigcommerce/big-design';
import styles from '../assets/css/dashboard.module.scss';

const Index = () => {

    return (
        <div className={styles.dashboard}>
            
            <div className={styles.inner_content}>

                <div className={styles.ic_left}>

                    <h1>
                        Bring your Sports & Apparel <br />
                        portfolio to life with our diverse<br />
                        set of product configurators.
                    </h1>

                </div>

                <div className={styles.ic_right}>
                    <img src="/assets/app-default-dashboard.png" alt="default-dashboard" />
                </div>
                
            </div>

            <div className={styles.contact_info}>
                <h2>KDS Customizer</h2>
                <p>
                    A variety of packages are offered. Please contact your "KDS Customizer" Account Manager or <br /> <a href='mailto:info@kds-customizer.com'>info@kds-customizer.com</a> <br /> for more information
                </p>
            </div>

            <div className={styles.full_image_bottom}>
                <img src="/assets/app-default-dashboard-bottom-01.png" alt="default-dashboard" />
            </div>

        </div>
    );
};

export default Index;
