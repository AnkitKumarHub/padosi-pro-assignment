import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { resendOtp, verifyEmail } from "@/api/auth";
import { ApiError, errorMessage } from "@/api/client";
import {
  BackButton,
  BrandMark,
  ErrorBanner,
  Notice,
  OtpInput,
  PrimaryButton,
  Screen,
  Subtitle,
  TextLink,
  Title,
} from "@/components/ui";
import { formatCountdown, useCountdown } from "@/lib/useCountdown";
import { validateOtpCode } from "@/lib/validation";

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ email?: string; resendIn?: string }>();
  const email = params.email ?? "";

  const { seconds, restart } = useCountdown(Number(params.resendIn ?? 0));
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  // Reached without an email (for example a cold deep link); there is nothing to verify.
  if (email.length === 0) return <Redirect href="/login" />;

  // Every OTP error that carries a cooldown resets the timer from the server's value.
  function handleOtpError(error: unknown) {
    if (error instanceof ApiError && error.resendAvailableInSeconds !== undefined) {
      restart(error.resendAvailableInSeconds);
    }
    setFormError(errorMessage(error));
  }

  async function onVerify() {
    const error = validateOtpCode(code);
    if (error) {
      setCodeError(error);
      return;
    }

    setCodeError(null);
    setFormError(null);
    setNotice(null);
    setVerifying(true);
    try {
      await verifyEmail(email, code);
      // Verification does not issue a token, so the user logs in next (DESIGN section 4).
      router.replace({ pathname: "/login", params: { email, verified: "1" } });
    } catch (error) {
      handleOtpError(error);
    } finally {
      setVerifying(false);
    }
  }

  async function onResend() {
    setFormError(null);
    setNotice(null);
    setResending(true);
    try {
      const pending = await resendOtp(email);
      restart(pending.resendAvailableInSeconds);
      setCode("");
      setNotice("A new code is on its way.");
    } catch (error) {
      handleOtpError(error);
    } finally {
      setResending(false);
    }
  }

  return (
    <Screen>
      <View style={styles.topRow}>
        <BrandMark />
        <BackButton iconOnly label="Use a different email" onPress={() => router.replace("/login")} />
      </View>
      <Title>Enter the code</Title>
      <Subtitle>We sent a 6-digit code to {email}</Subtitle>

      {formError ? <ErrorBanner message={formError} /> : null}
      {notice ? <Notice>{notice}</Notice> : null}

      <OtpInput value={code} onChangeText={setCode} error={codeError} />

      <PrimaryButton label="Verify" onPress={() => void onVerify()} loading={verifying} />

      {seconds > 0 ? (
        <Subtitle>Resend code in {formatCountdown(seconds)}</Subtitle>
      ) : (
        <TextLink
          label={resending ? "Sending a new code" : "Resend code"}
          onPress={() => void onResend()}
          disabled={resending}
        />
      )}

      <TextLink center label="Use a different email" onPress={() => router.replace("/login")} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
