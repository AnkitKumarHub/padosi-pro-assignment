import { router } from "expo-router";
import { useEffect, useState } from "react";
import { DEFAULT_API_BASE_URL } from "@/api/client";
import {
  Field,
  Notice,
  PrimaryButton,
  Screen,
  Subtitle,
  TextLink,
  Title,
} from "@/components/ui";
import { clearStoredServerUrl, getStoredServerUrl, saveServerUrl } from "@/auth/session";
import { validateServerUrl } from "@/lib/validation";

export default function ServerSettingsScreen() {
  const [url, setUrl] = useState(DEFAULT_API_BASE_URL);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void getStoredServerUrl().then((stored) => {
      if (stored) setUrl(stored);
    });
  }, []);

  async function onSave() {
    const validationError = validateServerUrl(url);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    await saveServerUrl(url.trim());
    setNotice("Saved. This address is used for every request.");
  }

  async function onReset() {
    await clearStoredServerUrl();
    setUrl(DEFAULT_API_BASE_URL);
    setError(null);
    setNotice("Reset to the default address.");
  }

  return (
    <Screen>
      <Title>API server URL</Title>
      <Subtitle>
        The Android emulator reaches this computer at 10.0.2.2. On a physical device, use
        this computer&apos;s address on your network.
      </Subtitle>

      {notice ? <Notice>{notice}</Notice> : null}

      <Field
        label="Base URL"
        value={url}
        onChangeText={setUrl}
        error={error}
        hint="Include the /api/v1 path"
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        autoComplete="off"
        inputMode="url"
        keyboardType="url"
      />

      <PrimaryButton label="Save" onPress={() => void onSave()} />
      <TextLink label="Reset to default" onPress={() => void onReset()} />
      <TextLink muted label="Back" onPress={() => router.back()} />
    </Screen>
  );
}
