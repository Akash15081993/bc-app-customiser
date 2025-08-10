import mysql, { PoolOptions } from "mysql2";
import { promisify } from "util";
import { SessionProps, StoreData } from "../../types";

const MYSQL_CONFIG: PoolOptions = {
  host: process.env.MYSQL_HOST,
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ...(process.env.MYSQL_PORT && { port: Number(process.env.MYSQL_PORT) }),
};


// For use with DB URLs
// Other mysql: https://www.npmjs.com/package/mysql#pooling-connections
//const dbUrl = process.env.DATABASE_URL;
// const pool = dbUrl ? mysql.createPool(dbUrl) : mysql.createPool(MYSQL_CONFIG);

// Create and share global pool
if (!global.mysqlPool) {
  global.mysqlPool = mysql.createPool(MYSQL_CONFIG);
  // Optional: test connection immediately
  global.mysqlPool.getConnection((err, connection) => {
    if (err) {
      console.warn('[MySQL] ❌ Connection failed:', err.message);
    } else {
      console.warn('[MySQL] ✅ Connection successful');
      connection.release();
    }
  });
}

const pool: mysql.Pool = global.mysqlPool;
const query = promisify(pool.query.bind(pool));

export const mysqlQuery = query;

// Use setUser for storing global user data (persists between installs)
export async function setUser({ user }: SessionProps) {
  if (!user) return null;

  const { email, id, username } = user;
  const userData = { email, userId: id, username };

  await query("REPLACE INTO users SET ?", userData);
}


export async function setStore(session: SessionProps) {
  const { access_token: accessToken, context, scope, owner } = session;
  // Only set on app install or update
  if (!accessToken || !scope) return null;
  const storeHash = context?.split("/")[1] || "";
  const storeData: StoreData = { accessToken, scope, storeHash };
  await query("REPLACE INTO stores SET ?", storeData);

  console.warn('Init setLoginMaster V1');
  
  // Only set on app install or update
  const { id, username, email } = owner;
  
  const loginMasterBody = { email, userId:id, userName:username, storeHash, accessToken };

  console.warn('Init setLoginMaster V2');

  //Customs Login Added
  const [existing] = await query("SELECT id FROM loginMaster WHERE email = ? AND storeHash = ?", [email, storeHash]) as any[];

  console.warn('Init setLoginMaster V3');

  if (!existing) {
    await query("INSERT INTO loginMaster SET ?", loginMasterBody);
  }
  console.warn('DONE setLoginMaster');

}

// Use setStoreUser for storing store specific variables
export async function setStoreUser(session: SessionProps) {
  const {
    access_token: accessToken,
    context,
    owner,
    sub,
    user: { id: userId },
  } = session;

  if (!userId) return null;

  const contextString = context ?? sub;
  const storeHash = contextString?.split("/")[1] || "";
  const sql = "SELECT * FROM storeUsers WHERE userId = ? AND storeHash = ?";
  const values = [String(userId), storeHash];
  const storeUser = await query(sql, values);

  // Set admin (store owner) if installing/ updating the app
  // https://developer.bigcommerce.com/api-docs/apps/guide/users
  if (accessToken) {
    // Create a new admin user if none exists
    if (!storeUser.length) {
      await query("INSERT INTO storeUsers SET ?", {
        isAdmin: true,
        storeHash,
        userId,
      });
    } else if (!storeUser[0]?.isAdmin) {
      await query(
        "UPDATE storeUsers SET isAdmin=1 WHERE userId = ? AND storeHash = ?",
        values
      );
    }

  } else {
    // Create a new user if it doesn't exist (non-store owners added here for multi-user apps)
    if (!storeUser.length) {
      await query("INSERT INTO storeUsers SET ?", {
        isAdmin: owner.id === userId,
        storeHash,
        userId,
      });
    }
  }
}

export async function deleteUser({ context, user, sub }: SessionProps) {
  const contextString = context ?? sub;
  const storeHash = contextString?.split("/")[1] || "";
  const values = [String(user?.id), storeHash];
  await query("DELETE FROM storeUsers WHERE userId = ? AND storeHash = ?", values);
}

export async function hasStoreUser(storeHash: string, userId: string) {
  if (!storeHash || !userId) return false;

  const values = [userId, storeHash];
  const results = await query(
    "SELECT * FROM storeUsers WHERE userId = ? AND storeHash = ? LIMIT 1",
    values
  );

  return results.length > 0;
}

export async function getStoreToken(storeHash: string) {
  if (!storeHash) return null;

  const results = await query(
    "SELECT accessToken FROM stores WHERE storeHash = ?",
    storeHash
  );

  return results.length ? results[0].accessToken : null;
}

export async function deleteStore({ store_hash: storeHash }: SessionProps) {
  await query("DELETE FROM stores WHERE storeHash = ?", storeHash);
}

// export async function setScriptManager(session: SessionProps) {
//   console.warn('Init setScriptManager V1');
//   const { access_token: accessToken, context, scope } = session;
//   // Only set on app install or update
//   if (!accessToken || !scope) return null;
//   const storeHash = context?.split("/")[1] || "";
  
//   const scriptPayload = {
//     "name": "Product Customizer Widget",
//     "description": "Injects product customizer app widget.",
//     "src" : `${process?.env?.customizer_backend_domain}${process?.env?.customizer_scritp}`,
//     "auto_uninstall": true,
//     "load_method": "default",
//     "location": "footer",
//     "visibility": "storefront",
//     "kind": "src",
//     "consent_category": "essential",
//     "enabled": true
//   };
//   console.warn('Init setScriptManager V2');

//   //Add script at Script Manager 
//   const bigcommerce = bigcommerceClient(accessToken, storeHash);
//   await bigcommerce.post(`/content/scripts`, scriptPayload);
//   console.warn('Init setScriptManager V3');
//   console.warn('DONE setScriptManager');
// }