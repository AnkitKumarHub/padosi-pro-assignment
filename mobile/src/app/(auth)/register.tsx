import { router } from "expo-router";
import { useState } from "react";
import { register } from "@/api/auth";
import { ApiError, errorMessage } from "@/api/client";
import {
  BrandMark,
  ErrorBanner,
  Field,
  PrimaryButton,
  Screen,
  Subtitle,
  TextLink,
  Title,
} from "@/components/ui";
import {
  normalizeEmail,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
} from "@/lib/validation";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmation?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmationError = validatePasswordConfirmation(password, confirmation);
    if (emailError || passwordError || confirmationError) {
      setErrors({
        email: emailError ?? undefined,
        password: passwordError ?? undefined,
        confirmation: confirmationError ?? undefined,
      });
      return;
    }

    setErrors({});
    setFormError(null);
    setSubmitting(true);
    try {
      // The confirmation is a mobile-only check and is never sent to the API (SPEC F-004).
      const pending = await register(normalizeEmail(email), password);
      router.replace({
        pathname: "/verify-email",
        params: {
          email: pending.email,
          resendIn: String(pending.resendAvailableInSeconds),
        },
      });
    } catch (error) {
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
      <Title>Create your account</Title>
      <Subtitle>We will email you a 6-digit code to verify it.</Subtitle>

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
        hint="At least 8 characters"
        autoCapitalize="none"
        autoComplete="new-password"
        autoCorrect={false}
        spellCheck={false}
        secureTextEntry
      />

      <Field
        icon="lock"
        label="Confirm password"
        value={confirmation}
        onChangeText={setConfirmation}
        error={errors.confirmation}
        autoCapitalize="none"
        autoComplete="new-password"
        autoCorrect={false}
        spellCheck={false}
        secureTextEntry
      />

      <PrimaryButton
        label="Create account"
        onPress={() => void onSubmit()}
        loading={submitting}
      />

      <TextLink center label="I already have an account" onPress={() => router.replace("/login")} />
    </Screen>
  );
}
