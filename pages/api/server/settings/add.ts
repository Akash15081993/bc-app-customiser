import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "@lib/auth";
import { mysqlQuery } from "@lib/dbs/mysql";

export default async function list(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET")
      return res
        .status(405)
        .json({ status: false, message: "Method not allowed" });

    try {
      const { enableShare, designerButtonName, designerButton, cssCode } = req.body;
      const { storeHash, user } = await getSession(req);

      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const sanitizeCss = (css: any) => {
        // Remove dangerous keywords
        css = css.replace(/(expression\(|javascript:|@import|)/gi, "");
        // Trim & truncate
        css = css.trim().substring(0, 5000);

        return css;
      };

      //First Delete appSettings
      await mysqlQuery("DELETE FROM appSettings WHERE storeHash = ?", [
        storeHash,
      ]);

      //After add again
      const safeCss = sanitizeCss(cssCode);
      const settingsBody = {
        storeHash,
        userId: user?.id,
        enableShare,
        designerButtonName,
        designerButton,
        cssCode: safeCss,
      };
      await mysqlQuery("REPLACE INTO appSettings SET ?", settingsBody);

      res.status(200).json({ status: true, message: "Success." });
    } catch (error) {
		  console.error("DB Error:", error);
      res.status(500).json({ status: false, message: "Internal server error.." });
    }
  } catch (error) {
    const { message, response } = error;
    res.status(response?.status || 500).json({ status: false, message });
  }
}
