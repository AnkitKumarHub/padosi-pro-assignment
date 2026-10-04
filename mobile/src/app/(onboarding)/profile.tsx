import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import { getProfile, saveProfile } from "@/api/profile";
import { ApiError, errorMessage } from "@/api/client";
import {
  ErrorBanner,
  Field,
  MobileField,
  PrimaryButton,
  Screen,
  SkeletonList,
  Subtitle,
  Title,
} from "@/components/ui";
import {
  toCanonicalMobile,
  validateBusinessName,
  validateProfileAddress,
  validateProfileMobileDigits,
  validateProfileName,
} from "@/lib/validation";
import { tasksHomeHref } from "@/lib/onboarding";
import { useUnauthorizedHandler } from "@/lib/useUnauthorized";
import { useSessionStore } from "@/store/session";

export default function ProfileScreen() {
  const step = useSessionStore((state) => state.user?.onboardingStep);
  const refreshSession = useSessionStore((state) => state.refreshSession);
  const handleUnauthorized = useUnauthorizedHandler();

  const [name, setName] = useState("");
  const [mobileDigits, setMobileDigits] = useState("");
  const [address, setAddress] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const response = await getProfile();
        if (response.profile) {
          setName(response.profile.name);
          setMobileDigits(response.profile.mobileNumber.replace(/^\+91/, ""));
          setAddress(response.profile.address);
          setBusinessName(response.profile.businessName ?? "");
        }
      } catch (error) {
        if (await handleUnauthorized(error)) return;
        setFormError(errorMessage(error));
      } finally {
        setLoading(false);
      }
    })();
  }, [handleUnauthorized]);

  if (step && step !== "PROFILE") {
    return <Redirect href={step === "TASK_SELECTION" ? "/tasks" : tasksHomeHref} />;
  }

  async function onSubmit() {
    const nextErrors = {
      name: validateProfileName(name) ?? undefined,
      mobile: validateProfileMobileDigits(mobileDigits) ?? undefined,
      address: validateProfileAddress(address) ?? undefined,
      businessName: validateBusinessName(businessName) ?? undefined,
    };
    if (nextErrors.name || nextErrors.mobile || nextErrors.address || nextErrors.businessName) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setFormError(null);
    setSubmitting(true);
    try {
      const trimmedBusiness = businessName.trim();
      await saveProfile({
        name: name.trim(),
        mobileNumber: toCanonicalMobile(mobileDigits),
        address: address.trim(),
        ...(trimmedBusiness.length > 0 ? { businessName: trimmedBusiness } : {}),
      });
      await refreshSession();
      router.replace("/tasks");
    } catch (error) {
      if (await handleUnauthorized(error)) return;
      if (error instanceof ApiError && error.fields) {
        setErrors({
          name: error.fields.name?.[0],
          mobile: error.fields.mobileNumber?.[0],
          address: error.fields.address?.[0],
          businessName: error.fields.businessName?.[0],
        });
        return;
      }
      setFormError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <Title>Complete your profile</Title>
        <Subtitle>Tell us how to reach you.</Subtitle>
        <SkeletonList rows={4} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>Complete your profile</Title>
      <Subtitle>Tell us how to reach you.</Subtitle>

      {formError ? <ErrorBanner message={formError} /> : null}

      <Field label="Full name" value={name} onChangeText={setName} error={errors.name} />
      <MobileField
        label="Mobile number"
        digits={mobileDigits}
        onChangeDigits={setMobileDigits}
        error={errors.mobile}
      />
      <Field
        label="Address"
        value={address}
        onChangeText={setAddress}
        error={errors.address}
        multiline
        numberOfLines={3}
      />
      <Field
        label="Business name (optional)"
        value={businessName}
        onChangeText={setBusinessName}
        error={errors.businessName}
      />

      <PrimaryButton
        label="Save and continue"
        onPress={() => void onSubmit()}
        loading={submitting}
      />
    </Screen>
  );
}
