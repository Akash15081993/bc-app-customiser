//pages\settings\index.tsx
import {
  Box,
  Button,
  Flex,
  Input,
  Message,
  Panel,
  Switch,
} from "@bigcommerce/big-design";
import { AddIcon, AssignmentIcon } from "@bigcommerce/big-design-icons";
import { css } from "@codemirror/lang-css";
import ReactCodeMirror, { oneDark } from "@uiw/react-codemirror";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Loading from "@components/loading";
import { useSession } from "context/session";

const MAX_LENGTH = 5000;

const Settings = () => {
  const encodedContext = useSession()?.context;
  const [enableShare, setEnableShare] = useState(false);
  const [designerButtonName, setDesignerButtonName] = useState("Customize");
  const [designerButton, setDesignerButton] = useState("");
  const initialCss = `.example-css-custom{color:red;}`;
  const [cssCode, setCssCode] = useState(initialCss);
  const [saveButtonLoading, setSaveButtonLoading] = useState(true);
  const router = useRouter();

  const [pageSuccess, setPageSuccess] = useState("");
  const [pageError, setPageError] = useState("");
  const [error, setError] = useState("");

  const getSettings = async () => {
    if (encodedContext == "") {
      router.push("unthorization-error");
      setSaveButtonLoading(false);
      
return;
    }
    const reqSettings = await fetch(`/api/server/settings/get?context=${encodedContext}`,{
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: null,
      }
    );
    const resultSettings = await reqSettings.json();
    if (resultSettings?.status == true && resultSettings?.data != null) {
      setEnableShare(resultSettings?.data?.enableShare);
      setDesignerButtonName(resultSettings?.data?.designerButtonName);
      setDesignerButton(resultSettings?.data?.designerButton);
      setCssCode(resultSettings?.data?.cssCode);
    }
    setSaveButtonLoading(false);
  };

  useEffect(() => {
    getSettings();
  }, [encodedContext]);

  const handleChange = () => setEnableShare(!enableShare);

  const handleSaveData = async () => {
    setSaveButtonLoading(true);
    setPageError("");
    setPageSuccess("");

     const setSettings = await fetch(
      `/api/server/settings/add?context=${encodedContext}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enableShare, designerButton, designerButtonName, cssCode }),
      }
    );

    const getSettings = await setSettings.json();

    setSaveButtonLoading(false);

    if (getSettings?.status == false) {
      setPageError(getSettings?.message);

      return;
    }

    setPageSuccess("General settings updated successfully.");
  };

   const validateCss = (value: string | undefined): string => {
    if (!value) return "";

    if (value.length > MAX_LENGTH) {
      return `CSS exceeds ${MAX_LENGTH} characters`;
    }

    // Check for HTML tags
    const hasHtmlTags = /<[^>]*>/.test(value);
    if (hasHtmlTags) {
      return "HTML tags are not allowed in CSS";
    }

    // Define dangerous patterns that could execute code
    const dangerousPatterns = [
      { pattern: /javascript:/i, message: "JavaScript URLs are not allowed" },
      { pattern: /data:text\/html/i, message: "Data URLs with HTML are not allowed" },
      { pattern: /expression\(/i, message: "CSS expressions are not allowed" },
      { pattern: /eval\(/i, message: "eval function is not allowed" },
      { pattern: /<script/i, message: "Script tags are not allowed" },
      { pattern: /onload=/i, message: "onload events are not allowed" },
      { pattern: /onerror=/i, message: "onerror events are not allowed" },
      { pattern: /onclick=/i, message: "onclick events are not allowed" },
      { pattern: /url\(['"]?data:/i, message: "Data URLs in url() are not allowed" },
      { pattern: /@import\s+url\(/i, message: "URL imports are not allowed" },
    ];

    for (const { pattern, message } of dangerousPatterns) {
      if (pattern.test(value)) {
        return `Unsafe CSS: ${message}`;
      }
    }

    return "";
  };
  
  const handleChangeCssCode = (value: string) => {
    const validationError = validateCss(value);
    setError(validationError);
    setCssCode(value);
  };

  const handleInputChange_designerButtonName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleanValue = value.replace(/<[^>]*>/g, '');
    setDesignerButtonName(cleanValue);
  };

  const handleInputChange_designerButton = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleanValue = value.replace(/<[^>]*>/g, '');
    setDesignerButton(cleanValue);
  };

  if (saveButtonLoading) return <Loading />;

  return (
    <Panel id="settings">
      <h2 style={{ margin: "0 0 20px 0" }}>
        <AssignmentIcon /> General Settings
      </h2>

      {pageError && (
        <Message
          marginVertical="medium"
          messages={[{ text: pageError }]}
          onClose={() => setPageError("")}
          type="error"
          style={{ marginBottom: "20px" }}
        />
      )}

      {pageSuccess && (
        <Message
          messages={[{ text: pageSuccess }]}
          marginVertical="medium"
          onClose={() => setPageSuccess("")}
          type="success"
          style={{ marginBottom: "20px" }}
        />
      )}

      <Panel>
        <Flex justifyContent="space-between">
          Enable share button{" "} (Coming Soon)
          
          <Switch disabled checked={enableShare} onChange={handleChange} />
        </Flex>
      </Panel>

      <Panel>
        <Input
          label="Customize button name"
          description="The 'Customize' name will be displayed by default if you don't specify a button name."
          name="name"
          required
          value={designerButtonName}
          placeholder="Example: .add-to-cart-buttons"
          width="small"
          maxLength={30}
          onChange={handleInputChange_designerButtonName}
        />
      </Panel>

      <Panel>
        <Input
          label="Custom selector for Customize Designer button"
          description="Enter the class or ID of the location where you want the button (if using a custom theme)."
          name="name"
          required
          value={designerButton}
          placeholder="Example: .add-to-cart-buttons"
          width="small"
          maxLength={200}
          onChange={handleInputChange_designerButton}
        />
      </Panel>

      <Panel>
        <p style={{ margin: "0 0 5px 0" }}>Custom CSS</p>
        <ReactCodeMirror
          value={cssCode}
          height="200px"
          theme={oneDark}
          extensions={[css()]}
          onChange={(value) => {
            handleChangeCssCode(value);
          }}
        />
        {error && <p style={{ color: "red", marginTop: 8 }}>{error}</p>}
      </Panel>

      {!error && (
        <Box style={{ margin: "20px 0 0 0" }}>
          <Button
            variant="primary"
            onClick={handleSaveData}
            isLoading={saveButtonLoading}
          >
            <AddIcon /> Save
          </Button>
        </Box>
      )}
    </Panel>
  );
};

export default Settings;