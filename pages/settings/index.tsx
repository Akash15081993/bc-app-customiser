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
import Loading from "@components/loading";
import ReactCodeMirror, { oneDark } from "@uiw/react-codemirror";
import { useSession } from "context/session";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const MAX_LENGTH = 5000;

const Settings = () => {
  const encodedContext = useSession()?.context;
  const [enableShare, setEnableShare] = useState(false);
  const [designerButton, setDesignerButton] = useState("");
  const initialCss = `.example-css-custom{color:red;}`;
  const [cssCode, setCssCode] = useState(initialCss);
  const [saveButtonLoading, setSaveButtonLoading] = useState(true);
  const router = useRouter();

  const [pageSuccess, setPageSuccess] = useState("");
  const [pageError, setPageError] = useState("");
  const [error, setError] = useState('');

  const getSettings = async () => {
    if(encodedContext == "") {
      router.push('unthorization-error')
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
    if(resultSettings?.status == true){
      setEnableShare(resultSettings?.data?.enableShare)
      setDesignerButton(resultSettings?.data?.designerButton)
      setCssCode(resultSettings?.data?.cssCode)
    }
    setSaveButtonLoading(false)

  }

  useEffect( ()=>{
    getSettings();
  },[encodedContext]);

  const handleChange = () => setEnableShare(!enableShare);

  const handleSaveData = async () => {
    setSaveButtonLoading(true);
    setPageError('')
    setPageSuccess('');

    const setSettings = await fetch(
      `/api/server/settings/add?context=${encodedContext}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enableShare, designerButton, cssCode }),
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

  const validateCss = (value: string) => {
    if (value.length > MAX_LENGTH) {
      return `CSS exceeds ${MAX_LENGTH} characters`;
    }

    // Basic SQL injection patterns (not foolproof, but helpful)
    const sqlKeywords = /(insert|update|delete|drop|union|--)/i;
    if (sqlKeywords.test(value)) {
      return 'Invalid content detected in CSS (SQL keywords not allowed)';
    }

    // Optional: block @import or javascript: URLs
    const dangerousPatterns = /(@import|javascript:|expression\()/i;
    if (dangerousPatterns.test(value)) {
      return 'Unsafe CSS detected (e.g., @import or javascript:)';
    }

    return ''; // No error
  };

  const handleChangeCssCode = (value: string) => {
    const validationError = validateCss(value);
    setError(validationError);
    setCssCode(value);
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
          Enable share button <Switch checked={enableShare} onChange={handleChange} />
        </Flex>
      </Panel>

      <Panel>
        <Input
          label="Custom selector for Designer Button"
          description="Enter the class or ID of the location where you want the button (if using a custom theme)."
          name="name"
          required
          value={designerButton}
          placeholder="Example: .add-to-cart-buttons"
          width="small"
          onChange={(e) => {
            setDesignerButton(e.target.value);
          }}
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
        {error && <p style={{ color: 'red', marginTop: 8 }}>{error}</p>}
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
