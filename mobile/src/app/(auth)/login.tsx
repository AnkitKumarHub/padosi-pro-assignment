import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { login } from "@/api/auth";
import { ApiError, errorMessage } from "@/api/client";
import {
  BrandMark,
  ErrorBanner,
  Field,
  PrimaryButton,
  Screen,
  Subtitle,
  SuccessNotice,
  TextLink,
  Title,
} from "@/components/ui";
import { normalizeEmail, validateEmail, validatePassword } from "@/lib/validation";
import { useSessionStore } from "@/store/session";

export default function LoginScreen() {
  const params = useLocalSearchParams<{ email?: string; verified?: string }>();
  const signIn = useSessionStore((state) => state.signIn);

  const [email, setEmail] = useState(params.email ?? "");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const justVerified = params.verified === "1";

  async function onSubmit() {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    if (emailError || passwordError) {
      setErrors({ email: emailError ?? undefined, password: passwordError ?? undefined });
      return;
    }

    setErrors({});
    setFormError(null);
    setSubmitting(true);
    try {
      const session = await login(normalizeEmail(email), password);
      // The (auth) layout redirects by onboarding step once the store reports an authenticated session.
      await signIn(session);
    } catch (error) {
      if (error instanceof ApiError && error.code === "EMAIL_NOT_VERIFIED") {
        router.push({
          pathname: "/verify-email",
          params: {
            email: normalizeEmail(email),
            // The cooldown always comes from the server, never from a local constant.
            resendIn: String(error.resendAvailableInSeconds ?? 0),
          },
        });
        return;
      }
      if (error instanceof ApiError && error.fields) {
        setErrors({
          email: error.fields.email?.[0],
          password: error.fields.password?.[0],
        });
        return;
      }
      setFormError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <BrandMark />
      <Title>Welcome back</Title>
      <Subtitle>Enter your email and password to access your account.</Subtitle>

      {justVerified ? (
        <SuccessNotice message="Your email is verified. Log in to continue." />
      ) : null}
      {formError ? <ErrorBanner message={formError} /> : null}

      <Field
        icon="mail"
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        spellCheck={false}
        keyboardType="email-address"
        inputMode="email"
        placeholder="you@example.com"
      />

      <Field
        icon="lock"
        label="Password"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        autoCapitalize="none"
        autoComplete="current-password"
        autoCorrect={false}
        spellCheck={false}
        secureTextEntry
      />

      <PrimaryButton label="Log in" onPress={() => void onSubmit()} loading={submitting} />

      <TextLink center label="Create an account" onPress={() => router.push("/register")} />
      <View style={styles.bottomLink}>
        <TextLink muted icon="server" label="Server URL" onPress={() => router.push("/server-settings")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bottomLink: {
    marginTop: "auto",
    alignSelf: "stretch",
    alignItems: "center",
  },
});
