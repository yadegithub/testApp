import { IonContent, IonIcon, IonPage } from "@ionic/react";
import {
  arrowBackOutline,
  eyeOffOutline,
  eyeOutline,
  keyOutline,
  lockClosedOutline,
  mailOutline,
} from "ionicons/icons";
import { useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import BrandMark from "../components/BrandMark";
import { useAppSettings } from "../settings/AppSettingsContext";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ResetPasswordPage: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialEmail = searchParams.get("email") ?? "";
  const resetCode = searchParams.get("oobCode") ?? "";
  const isCodeMode = Boolean(resetCode);
  const {
    authMode,
    authNotice,
    confirmPasswordReset,
    requestPasswordReset,
    verifyPasswordResetCode,
  } = useAuth();
  const { settings } = useAppSettings();

  const [email, setEmail] = useState(initialEmail);
  const [resolvedEmail, setResolvedEmail] = useState(initialEmail);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingCode, setIsCheckingCode] = useState(isCodeMode);
  const isArabic = settings.language === "ar";
  const copy = isArabic
    ? {
        chooseNewPassword: "اختر كلمة مرور جديدة",
        resetPassword: "إعادة تعيين كلمة المرور",
        codeSubtitle:
          "أنشئ كلمة مرور جديدة، ثم سجل الدخول مرة أخرى بحسابك المحدّث.",
        requestSubtitle:
          "أدخل بريدك الإلكتروني لتصلك رسالة إعادة التعيين وتكمل على أي جهاز.",
        newPasswordHeading: "كلمة مرور جديدة",
        forgotPasswordHeading: "نسيت كلمة المرور",
        checkingLink: "جار التحقق من رابط إعادة التعيين...",
        email: "البريد الإلكتروني",
        emailPlaceholder: "you@example.com",
        account: "الحساب",
        checkingAccount: "جار التحقق من الحساب...",
        newPassword: "كلمة المرور الجديدة",
        newPasswordPlaceholder: "أنشئ كلمة مرور جديدة",
        confirmPassword: "تأكيد كلمة المرور",
        confirmPasswordPlaceholder: "أعد إدخال كلمة المرور الجديدة",
        hidePassword: "إخفاء كلمة المرور",
        showPassword: "إظهار كلمة المرور",
        hideConfirmPassword: "إخفاء تأكيد كلمة المرور",
        showConfirmPassword: "إظهار تأكيد كلمة المرور",
        updatingPassword: "جار تحديث كلمة المرور...",
        sendingResetLink: "جار إرسال رابط إعادة التعيين...",
        saveNewPassword: "حفظ كلمة المرور الجديدة",
        sendResetLink: "إرسال رابط إعادة التعيين",
        rememberedPassword: "تذكرت كلمة المرور؟",
        backToLogin: "العودة إلى تسجيل الدخول",
        invalidEmail: "أدخل بريدًا إلكترونيًا صحيحًا.",
        resetLinkSent:
          "تم إرسال رابط إعادة التعيين. افتح رابط البريد لاختيار كلمة مرور جديدة في هذه الصفحة.",
        resetLinkError: "تعذر إرسال رابط إعادة التعيين الآن.",
        verifyLinkError: "تعذر التحقق من رابط إعادة التعيين.",
        shortPassword: "يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل.",
        mismatchPassword: "كلمتا المرور غير متطابقتين.",
        resetError: "تعذر إعادة تعيين كلمة المرور الآن.",
      }
    : {
        chooseNewPassword: "Choose New Password",
        resetPassword: "Reset Password",
        codeSubtitle:
          "Create a new password, then sign in again with your updated account.",
        requestSubtitle:
          "Enter your email to receive a reset link and continue on any device.",
        newPasswordHeading: "New password",
        forgotPasswordHeading: "Forgot password",
        checkingLink: "Checking your reset link...",
        email: "Email",
        emailPlaceholder: "you@example.com",
        account: "Account",
        checkingAccount: "Checking account...",
        newPassword: "New Password",
        newPasswordPlaceholder: "Create a new password",
        confirmPassword: "Confirm Password",
        confirmPasswordPlaceholder: "Repeat the new password",
        hidePassword: "Hide password",
        showPassword: "Show password",
        hideConfirmPassword: "Hide confirm password",
        showConfirmPassword: "Show confirm password",
        updatingPassword: "Updating password...",
        sendingResetLink: "Sending reset link...",
        saveNewPassword: "Save New Password",
        sendResetLink: "Send Reset Link",
        rememberedPassword: "Remembered your password?",
        backToLogin: "Back to Login",
        invalidEmail: "Enter a valid email address.",
        resetLinkSent:
          "Reset link sent. Open the email link to choose your new password on this page.",
        resetLinkError: "Unable to send the reset link right now.",
        verifyLinkError: "Unable to verify this reset link.",
        shortPassword: "Password must be at least 6 characters.",
        mismatchPassword: "Passwords do not match.",
        resetError: "Unable to reset your password right now.",
      };

  useEffect(() => {
    if (!isCodeMode || authMode !== "firebase") {
      setIsCheckingCode(false);
      return;
    }

    let isMounted = true;

    verifyPasswordResetCode(resetCode)
      .then((verifiedEmail) => {
        if (!isMounted) {
          return;
        }

        setResolvedEmail(verifiedEmail);
        setEmail(verifiedEmail);
        setError("");
      })
      .catch((verificationError) => {
        if (!isMounted) {
          return;
        }

        setError(
          verificationError instanceof Error
            ? verificationError.message
            : copy.verifyLinkError,
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsCheckingCode(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [
    authMode,
    copy.verifyLinkError,
    isCodeMode,
    resetCode,
    verifyPasswordResetCode,
  ]);

  const goToLogin = () => {
    const nextEmail = resolvedEmail || email;
    const query = nextEmail
      ? `?email=${encodeURIComponent(nextEmail)}`
      : "";
    history.replace(`/login${query}`);
  };

  const handleSendResetLink = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!emailPattern.test(email.trim())) {
      setInfo("");
      setError(copy.invalidEmail);
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setInfo("");
      await requestPasswordReset(email.trim());
      setInfo(copy.resetLinkSent);
    } catch (requestError) {
      setInfo("");
      setError(
        requestError instanceof Error
          ? requestError.message
          : copy.resetLinkError,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReset = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (newPassword.trim().length < 6) {
      setInfo("");
      setError(copy.shortPassword);
      return;
    }

    if (newPassword !== confirmPassword) {
      setInfo("");
      setError(copy.mismatchPassword);
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setInfo("");
      await confirmPasswordReset(resetCode, newPassword);
      const nextEmail = resolvedEmail || email;
      history.replace(
        `/login?reset=success${nextEmail ? `&email=${encodeURIComponent(nextEmail)}` : ""}`,
      );
    } catch (resetError) {
      setInfo("");
      setError(
        resetError instanceof Error
          ? resetError.message
          : copy.resetError,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="app-page">
        <div className="screen screen--login" dir={isArabic ? "rtl" : "ltr"}>
          <div className="screen__ambient screen__ambient--login-left" />
          <div className="screen__ambient screen__ambient--login-right" />

          <div className="login-shell">
            <section className="login-hero">
              <span className="spotlight-pill">
                {isCodeMode ? copy.chooseNewPassword : copy.resetPassword}
              </span>

              <div className="brand-hero brand-hero--login">
                <BrandMark className="brand-mark--hero" />
                <div className="brand-hero__copy">
                  <strong>AR Learn</strong>
                  <p>
                    {isCodeMode
                      ? copy.codeSubtitle
                      : copy.requestSubtitle}
                  </p>
                </div>
              </div>
            </section>

            <form
              className="login-card"
              onSubmit={isCodeMode ? handleConfirmReset : handleSendResetLink}
            >
              <div className="section-head section-head--compact">
                <h2>
                  {isCodeMode
                    ? copy.newPasswordHeading
                    : copy.forgotPasswordHeading}
                </h2>
              </div>

              {authMode !== "firebase" ? (
                <p className="auth-hint auth-hint--status">{authNotice}</p>
              ) : null}

              {isCheckingCode ? (
                <p className="auth-hint auth-hint--status">
                  {copy.checkingLink}
                </p>
              ) : null}

              {!isCodeMode ? (
                <label className="auth-field">
                  <span>{copy.email}</span>
                  <div className="auth-field__control">
                    <IonIcon icon={mailOutline} />
                    <input
                      autoComplete="email"
                      inputMode="email"
                      placeholder={copy.emailPlaceholder}
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setError("");
                        setInfo("");
                      }}
                    />
                  </div>
                </label>
              ) : (
                <>
                  <div className="auth-hint">
                    <strong>{copy.account}</strong>
                    <span>{resolvedEmail || email || copy.checkingAccount}</span>
                  </div>

                  <label className="auth-field">
                    <span>{copy.newPassword}</span>
                    <div className="auth-field__control">
                      <IonIcon icon={lockClosedOutline} />
                      <input
                        autoComplete="new-password"
                        placeholder={copy.newPasswordPlaceholder}
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(event) => {
                          setNewPassword(event.target.value);
                          setError("");
                          setInfo("");
                        }}
                      />
                      <button
                        type="button"
                        className="auth-field__toggle"
                        aria-label={
                          showNewPassword ? copy.hidePassword : copy.showPassword
                        }
                        onClick={() =>
                          setShowNewPassword((currentValue) => !currentValue)
                        }
                      >
                        <IonIcon
                          icon={showNewPassword ? eyeOffOutline : eyeOutline}
                        />
                      </button>
                    </div>
                  </label>

                  <label className="auth-field">
                    <span>{copy.confirmPassword}</span>
                    <div className="auth-field__control">
                      <IonIcon icon={keyOutline} />
                      <input
                        autoComplete="new-password"
                        placeholder={copy.confirmPasswordPlaceholder}
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(event) => {
                          setConfirmPassword(event.target.value);
                          setError("");
                          setInfo("");
                        }}
                      />
                      <button
                        type="button"
                        className="auth-field__toggle"
                        aria-label={
                          showConfirmPassword
                            ? copy.hideConfirmPassword
                            : copy.showConfirmPassword
                        }
                        onClick={() =>
                          setShowConfirmPassword(
                            (currentValue) => !currentValue,
                          )
                        }
                      >
                        <IonIcon
                          icon={showConfirmPassword ? eyeOffOutline : eyeOutline}
                        />
                      </button>
                    </div>
                  </label>
                </>
              )}

              {error ? <p className="auth-error">{error}</p> : null}
              {info ? <p className="auth-success">{info}</p> : null}

              <button
                type="submit"
                className="auth-submit"
                disabled={isSubmitting || isCheckingCode || authMode !== "firebase"}
              >
                <IonIcon
                  icon={isCodeMode ? keyOutline : mailOutline}
                />
                {isSubmitting
                  ? isCodeMode
                    ? copy.updatingPassword
                    : copy.sendingResetLink
                  : isCodeMode
                    ? copy.saveNewPassword
                    : copy.sendResetLink}
              </button>

              <div className="auth-switch">
                <span>{copy.rememberedPassword}</span>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={goToLogin}
                >
                  <IonIcon icon={arrowBackOutline} />
                  {copy.backToLogin}
                </button>
              </div>
            </form>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ResetPasswordPage;
