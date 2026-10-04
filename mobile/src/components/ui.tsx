import type { ReactNode } from "react";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
  View,
} from "react-native";
import { Icon, iconForCategory, type IconName } from "@/components/icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, layout, radius, spacing, type } from "@/theme";

export function Screen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: spacing.xxxl + insets.bottom },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.column}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function BrandMark() {
  return <Text style={styles.brand}>PadosiPro</Text>;
}

export function Display({ children }: { children: ReactNode }) {
  return <Text style={styles.display}>{children}</Text>;
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Heading({ children }: { children: ReactNode }) {
  return <Text style={styles.heading}>{children}</Text>;
}

export function Subtitle({ children }: { children: ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function Body({ children }: { children: ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

export function Notice({ children }: { children: ReactNode }) {
  return <Text style={styles.notice}>{children}</Text>;
}

type FieldProps = Omit<TextInputProps, "style"> & {
  label: string;
  error?: string | null;
  hint?: string;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
};

export function Field({
  label,
  error,
  hint,
  style,
  onFocus,
  onBlur,
  icon,
  secureTextEntry,
  ...inputProps
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry === true);
  const canToggle = secureTextEntry === true;
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputShell,
          inputProps.multiline ? styles.inputMultiline : null,
          focused ? styles.inputFocused : null,
          error ? styles.inputError : null,
          style,
        ]}
      >
        {icon ? <Icon name={icon} size={20} color={colors.textSecondary} /> : null}
        <TextInput
          style={[styles.input, inputProps.multiline ? styles.inputMultilineText : null]}
          placeholderTextColor={colors.textSecondary}
          accessibilityLabel={label}
          keyboardAppearance="dark"
          secureTextEntry={canToggle ? hidden : secureTextEntry}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...inputProps}
        />
        {canToggle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
            onPress={() => setHidden((current) => !current)}
            style={styles.iconButton}
          >
            <Icon name={hidden ? "eye" : "eyeOff"} size={22} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>
      {error ? <FieldError message={error} /> : null}
      {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.errorRow}>
      <Icon name="error" size={16} color={colors.error} />
      <Text style={styles.fieldError}>{message}</Text>
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export function PrimaryButton({ label, onPress, loading, disabled }: ButtonProps) {
  const inactive = loading === true || disabled === true;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading === true }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles.buttonPrimary,
        disabled === true && loading !== true ? styles.buttonDisabled : null,
        pressed && !inactive ? styles.buttonPrimaryPressed : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.textOnAccent} />
      ) : (
        <Text
          style={[
            styles.buttonLabel,
            disabled === true ? styles.buttonLabelDisabled : styles.buttonLabelOnAccent,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function DangerButton({ label, onPress, loading, disabled }: ButtonProps) {
  const inactive = loading === true || disabled === true;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading === true }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles.buttonDanger,
        inactive ? styles.buttonDisabled : null,
        pressed && !inactive ? styles.buttonDangerPressed : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.error} />
      ) : (
        <Text style={[styles.buttonLabel, inactive ? styles.buttonLabelDisabled : styles.buttonLabelDanger]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, loading, disabled }: ButtonProps) {
  const inactive = loading === true || disabled === true;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading === true }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles.buttonSecondary,
        inactive ? styles.buttonDisabled : null,
        pressed && !inactive ? styles.buttonSecondaryPressed : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.textPrimary} />
      ) : (
        <Text style={[styles.buttonLabel, styles.buttonLabelPrimary]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function TextLink({
  label,
  onPress,
  muted,
  disabled,
  icon,
  iconSize = 20,
  iconOnly = false,
  center,
}: {
  label: string;
  onPress: () => void;
  muted?: boolean;
  disabled?: boolean;
  icon?: IconName;
  iconSize?: number;
  iconOnly?: boolean;
  center?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole={iconOnly ? "button" : "link"}
      accessibilityLabel={iconOnly ? label : undefined}
      accessibilityState={{ disabled: disabled === true }}
      disabled={disabled === true}
      onPress={onPress}
      style={({ pressed }) => [
        styles.textLink,
        iconOnly ? styles.textLinkIcon : null,
        center ? styles.textLinkCenter : null,
        pressed && !disabled ? styles.pressedFade : null,
      ]}
    >
      {icon ? (
        <Icon name={icon} size={iconSize} color={muted || disabled ? colors.textSecondary : colors.textPrimary} />
      ) : null}
      {iconOnly ? null : (
        <Text style={muted || disabled ? styles.textLinkMutedLabel : styles.textLinkLabel}>{label}</Text>
      )}
    </Pressable>
  );
}

export function SuccessNotice({ message }: { message: string }) {
  return (
    <View style={styles.successBanner}>
      <Icon name="checkCircle" size={18} color={colors.success} />
      <Text style={styles.successText}>{message}</Text>
    </View>
  );
}

export function BackButton({
  onPress,
  label = "Back",
  iconOnly = false,
}: {
  onPress: () => void;
  label?: string;
  iconOnly?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={spacing.sm}
      style={({ pressed }) => [
        iconOnly ? styles.backButtonIcon : styles.backButton,
        pressed ? styles.pressedFade : null,
      ]}
    >
      <Icon name="back" size={22} color={colors.textPrimary} />
      {iconOnly ? null : <Text style={styles.backLabel}>{label}</Text>}
    </Pressable>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.banner}>
      <Icon name="error" size={20} color={colors.error} />
      <Text style={styles.bannerText}>{message}</Text>
    </View>
  );
}

export function CenteredState({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.centered}>{children}</View>
    </SafeAreaView>
  );
}

export function PageShell({
  header,
  footer,
  children,
  bottomInset = true,
}: {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  // Native tabs already inset the screen above the bar. A second spacer floats the list.
  bottomInset?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const bottom = bottomInset ? Math.max(insets.bottom, spacing.lg) : spacing.lg;
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <View style={styles.shell}>
        {header ? <View style={styles.pageHeader}>{header}</View> : null}
        <View style={styles.pageBody}>{children}</View>
        {footer ? (
          <View style={[styles.pageFooter, { paddingBottom: bottom }]}>{footer}</View>
        ) : bottomInset ? (
          <View style={{ height: insets.bottom }} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

type MobileFieldProps = {
  label: string;
  digits: string;
  onChangeDigits: (value: string) => void;
  error?: string | null;
};

export function MobileField({ label, digits, onChangeDigits, error }: MobileFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.mobileRow,
          focused ? styles.inputFocused : null,
          error ? styles.inputError : null,
        ]}
      >
        <Text style={styles.mobilePrefix}>+91</Text>
        <View style={styles.mobileDivider} />
        <TextInput
          style={styles.mobileInput}
          value={digits}
          onChangeText={(value) => onChangeDigits(value.replace(/\D/g, "").slice(0, 10))}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={10}
          placeholder="10-digit number"
          placeholderTextColor={colors.textSecondary}
          accessibilityLabel={label}
          keyboardAppearance="dark"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      {error ? <FieldError message={error} /> : null}
    </View>
  );
}

export function OtpInput({
  value,
  onChangeText,
  error,
}: {
  value: string;
  onChangeText: (value: string) => void;
  error?: string | null;
}) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const digits = value.replace(/\D/g, "").slice(0, 6);
  const activeIndex = digits.length >= 6 ? 5 : digits.length;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>Verification code</Text>
      <View style={styles.otpWrap}>
        <View pointerEvents="none" style={styles.otpRow}>
          {Array.from({ length: 6 }, (_, index) => {
            const active = focused && index === activeIndex;
            return (
              <View
                key={index}
                style={[
                  styles.otpCell,
                  active ? styles.otpCellActive : null,
                  error ? styles.inputError : null,
                ]}
              >
                <Text style={styles.otpDigit}>{digits[index] ?? ""}</Text>
              </View>
            );
          })}
        </View>
        <TextInput
          ref={inputRef}
          value={digits}
          onChangeText={(next) => onChangeText(next.replace(/\D/g, "").slice(0, 6))}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={6}
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          spellCheck={false}
          caretHidden
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel="Verification code"
          style={styles.otpCapture}
        />
      </View>
      {error ? <FieldError message={error} /> : null}
    </View>
  );
}

export function SearchField({
  label,
  value,
  onChangeText,
  placeholder,
  onSubmit,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.searchRow}>
        <Icon name="search" size={22} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          accessibilityLabel={label}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          returnKeyType="search"
          onSubmitEditing={onSubmit}
          keyboardAppearance="dark"
        />
        {value.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => onChangeText("")}
            style={styles.clearButton}
          >
            <Icon name="clear" size={22} color={colors.textPrimary} />
          </Pressable>
        ) : (
          <View style={styles.clearSpacer} />
        )}
      </View>
    </View>
  );
}

export function SelectableTaskRow({
  name,
  description,
  selected,
  onToggle,
}: {
  name: string;
  description: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={name}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.taskRow,
        selected ? styles.taskRowSelected : null,
        pressed ? styles.pressedFade : null,
      ]}
    >
      <View style={styles.checkboxHit}>
        <View style={[styles.checkbox, selected ? styles.checkboxSelected : null]}>
          {selected ? (
            <Icon name="check" size={16} color={colors.textOnAccent} />
          ) : null}
        </View>
      </View>
      <View style={styles.taskText}>
        <Text style={styles.taskName}>{name}</Text>
        <Text numberOfLines={2} style={styles.taskDescription}>
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

export function CategoryBlock({
  name,
  description,
  onPress,
  icon,
}: {
  name: string;
  description: string;
  onPress?: () => void;
  icon?: IconName;
}) {
  const content = (
    <>
      <View style={styles.iconWell}>
        <Icon name={icon ?? iconForCategory(name)} size={20} color={colors.textSecondary} />
      </View>
      <View style={styles.taskText}>
        <Text style={styles.taskName}>{name}</Text>
        {description.length > 0 ? (
          <Text numberOfLines={2} style={styles.taskDescription}>
            {description}
          </Text>
        ) : null}
      </View>
      {onPress ? (
        <Icon name="chevron" size={24} color={colors.textSecondary} />
      ) : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.categoryRow}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={onPress}
      style={({ pressed }) => [styles.categoryRow, pressed ? styles.pressedFade : null]}
    >
      {content}
    </Pressable>
  );
}

export function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.heading}>{title}</Text>
      {description ? (
        <Text numberOfLines={2} style={styles.taskDescription}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}

export function TaskListRow({
  name,
  meta,
  description,
}: {
  name: string;
  meta?: string;
  description?: string;
}) {
  return (
    <View style={styles.listRow}>
      <Text style={styles.taskName}>{name}</Text>
      {meta ? <Text style={styles.taskDescription}>{meta}</Text> : null}
      {description ? (
        <Text numberOfLines={2} style={styles.taskDescription}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name="empty" size={28} color={colors.success} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.subtitle}>{body}</Text> : null}
      {action}
    </View>
  );
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <View accessibilityLabel="Loading" style={styles.skeletonList}>
      {Array.from({ length: rows }, (_, index) => (
        <View key={index} style={styles.skeletonRow}>
          <View style={styles.skeletonLine} />
          <View style={styles.skeletonLineShort} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  fill: {
    flex: 1,
  },
  shell: {
    flex: 1,
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xxl,
  },
  column: {
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
    flexGrow: 1,
    gap: spacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: layout.screenPadding,
    gap: spacing.lg,
  },
  brand: {
    ...type.small,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  display: {
    ...type.display,
    color: colors.textPrimary,
  },
  title: {
    ...type.title,
    color: colors.textPrimary,
  },
  heading: {
    ...type.heading,
    color: colors.textPrimary,
  },
  subtitle: {
    ...type.body,
    color: colors.textSecondary,
  },
  body: {
    ...type.body,
    color: colors.textPrimary,
  },
  notice: {
    ...type.body,
    color: colors.textSecondary,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    ...type.small,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  inputShell: {
    minHeight: layout.controlHeight,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingLeft: spacing.lg,
  },
  input: {
    flex: 1,
    height: layout.controlHeight,
    paddingRight: spacing.lg,
    ...type.body,
    color: colors.textPrimary,
  },
  inputMultiline: {
    height: undefined,
    minHeight: 96,
    alignItems: "flex-start",
    paddingVertical: spacing.md,
  },
  inputMultilineText: {
    height: undefined,
    minHeight: 72,
    textAlignVertical: "top",
    paddingTop: 0,
  },
  inputFocused: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  fieldError: {
    ...type.small,
    flex: 1,
    color: colors.error,
  },
  hint: {
    ...type.small,
    color: colors.textSecondary,
  },
  button: {
    minHeight: layout.controlHeight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPrimary: {
    backgroundColor: colors.accent,
  },
  buttonPrimaryPressed: {
    backgroundColor: colors.accentPressed,
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderInput,
  },
  buttonSecondaryPressed: {
    backgroundColor: colors.surfaceRaised,
  },
  buttonDanger: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.error,
  },
  buttonDangerPressed: {
    backgroundColor: colors.surface,
    borderColor: colors.error,
  },
  buttonDisabled: {
    backgroundColor: colors.disabledBg,
    borderColor: colors.disabledBg,
  },
  buttonLabel: {
    ...type.bodyStrong,
  },
  buttonLabelOnAccent: {
    color: colors.textOnAccent,
  },
  buttonLabelPrimary: {
    color: colors.textPrimary,
  },
  buttonLabelDanger: {
    color: colors.error,
  },
  buttonLabelDisabled: {
    color: colors.disabledText,
  },
  textLink: {
    minHeight: layout.minTouch,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  textLinkCenter: {
    alignSelf: "center",
  },
  textLinkIcon: {
    width: layout.minTouch,
    justifyContent: "center",
  },
  iconButton: {
    width: layout.minTouch,
    height: layout.minTouch,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    minHeight: layout.minTouch,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xs,
    paddingRight: spacing.sm,
  },
  backButtonIcon: {
    width: layout.minTouch,
    height: layout.minTouch,
    alignItems: "center",
    justifyContent: "center",
  },
  backLabel: {
    ...type.bodyStrong,
    color: colors.textPrimary,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: layout.controlHeight,
  },
  successText: {
    ...type.small,
    flex: 1,
    color: colors.textPrimary,
  },
  iconWell: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceRaised,
  },
  pressedFade: {
    opacity: 0.72,
  },
  textLinkLabel: {
    ...type.bodyStrong,
    color: colors.textPrimary,
  },
  textLinkMutedLabel: {
    ...type.small,
    color: colors.textSecondary,
  },
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.error,
    padding: spacing.lg,
  },
  bannerText: {
    ...type.body,
    flex: 1,
    color: colors.error,
  },
  pageHeader: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  pageBody: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
  },
  pageFooter: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    backgroundColor: colors.bg,
  },
  mobileRow: {
    height: layout.controlHeight,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  mobilePrefix: {
    ...type.bodyStrong,
    color: colors.textPrimary,
  },
  mobileDivider: {
    width: 1,
    alignSelf: "stretch",
    marginVertical: spacing.md,
    backgroundColor: colors.borderSubtle,
  },
  mobileInput: {
    flex: 1,
    ...type.body,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  otpWrap: {
    position: "relative",
  },
  otpRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  otpCell: {
    flex: 1,
    height: 56,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderInput,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  otpCellActive: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  otpDigit: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  otpCapture: {
    ...StyleSheet.absoluteFillObject,
    color: "transparent",
  },
  searchRow: {
    height: layout.controlHeight,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingLeft: spacing.lg,
  },
  searchInput: {
    flex: 1,
    ...type.body,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  clearButton: {
    width: layout.minTouch,
    height: layout.minTouch,
    alignItems: "center",
    justifyContent: "center",
  },
  clearSpacer: {
    width: spacing.lg,
  },
  taskRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  taskRowSelected: {
    backgroundColor: colors.surfaceSelected,
    borderColor: colors.accent,
    borderLeftWidth: 3,
  },
  checkboxHit: {
    width: layout.minTouch,
    height: layout.minTouch,
    alignItems: "center",
    justifyContent: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderInput,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  taskText: {
    flex: 1,
    gap: spacing.xs,
  },
  taskName: {
    ...type.bodyStrong,
    color: colors.textPrimary,
  },
  taskDescription: {
    ...type.small,
    color: colors.textSecondary,
  },
  categoryRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  sectionHeader: {
    gap: spacing.xs,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  listRow: {
    gap: spacing.xs,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  empty: {
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    width: layout.minTouch,
    height: layout.minTouch,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
  },
  skeletonList: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  skeletonRow: {
    height: 64,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  skeletonLine: {
    height: 14,
    width: "70%",
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceRaised,
  },
  skeletonLineShort: {
    height: 12,
    width: "46%",
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceRaised,
  },
});
