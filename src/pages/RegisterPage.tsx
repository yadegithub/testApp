import { IonContent, IonIcon, IonPage } from "@ionic/react";
import {
  eyeOffOutline,
  eyeOutline,
  lockClosedOutline,
  mailOutline,
  personOutline,
  personSharp,
} from "ionicons/icons";
import { useState } from "react";
import { Redirect, useHistory } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import BrandMark from "../components/BrandMark";
import { useAppSettings } from "../settings/AppSettingsContext";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RegisterPage: React.FC = () => {
  const history = useHistory();
  const { authNotice, isAuthenticated, register } = useAuth();
  const { settings } = useAppSettings();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isArabic = settings.language === "ar";
  const copy = isArabic
    ? {
        createAccount: "إنشاء حساب",
        subtitle: "أنشئ ملفك الشخصي وابدأ التعلم بالواقع المعزز.",
        register: "تسجيل",
        firebaseTitle: "مصادقة Firebase بالبريد وكلمة المرور",
        firebaseCopy: "سيعمل حسابك على المتصفح وAndroid.",
        fullName: "الاسم الكامل",
        namePlaceholder: "سارة أحمد",
        email: "البريد الإلكتروني",
        emailPlaceholder: "you@example.com",
        password: "كلمة المرور",
        passwordPlaceholder: "أنشئ كلمة مرور",
        confirmPassword: "تأكيد كلمة المرور",
        confirmPasswordPlaceholder: "أعد إدخال كلمة المرور",
        hidePassword: "إخفاء كلمة المرور",
        showPassword: "إظهار كلمة المرور",
        hideConfirmPassword: "إخفاء تأكيد كلمة المرور",
        showConfirmPassword: "إظهار تأكيد كلمة المرور",
        keepSignedIn: "ابقني مسجل الدخول على هذا الجهاز",
        creatingAccount: "جار إنشاء الحساب...",
        createAccountButton: "إنشاء حساب",
        alreadyHaveAccount: "هل لديك حساب بالفعل؟",
        signIn: "تسجيل الدخول",
        invalidName: "أدخل اسمك الكامل.",
        invalidEmail: "أدخل بريدا إلكترونيا صحيحا.",
        shortPassword: "يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل.",
        mismatchPassword: "كلمتا المرور غير متطابقتين.",
        registerError: "تعذر إنشاء الحساب الآن.",
      }
    : {
        createAccount: "Create account",
        subtitle: "Create your profile and start learning in AR.",
        register: "Register",
        firebaseTitle: "Firebase email/password auth",
        firebaseCopy: "Your account will work across browser and Android.",
        fullName: "Full Name",
        namePlaceholder: "Sara Ahmed",
        email: "Email",
        emailPlaceholder: "you@example.com",
        password: "Password",
        passwordPlaceholder: "Create a password",
        confirmPassword: "Confirm Password",
        confirmPasswordPlaceholder: "Repeat your password",
        hidePassword: "Hide password",
        showPassword: "Show password",
        hideConfirmPassword: "Hide confirm password",
        showConfirmPassword: "Show confirm password",
        keepSignedIn: "Keep me signed in on this device",
        creatingAccount: "Creating account...",
        createAccountButton: "Create Account",
        alreadyHaveAccount: "Already have an account?",
        signIn: "Sign In",
        invalidName: "Enter your full name.",
        invalidEmail: "Enter a valid email address.",
        shortPassword: "Password must be at least 6 characters.",
        mismatchPassword: "Passwords do not match.",
        registerError: "Unable to create your account right now.",
      };

  if (isAuthenticated) {
    return <Redirect to="/tabs/dashboard" />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (name.trim().length < 2) {
      setError(copy.invalidName);
      return;
    }

    if (!emailPattern.test(email.trim())) {
      setError(copy.invalidEmail);
      return;
    }

    if (password.trim().length < 6) {
      setError(copy.shortPassword);
      return;
    }

    if (password !== confirmPassword) {
      setError(copy.mismatchPassword);
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await register({
        email,
        name,
        password,
        rememberMe,
      });
      history.replace("/tabs/dashboard");
    } catch (registerError) {
      setError(
        registerError instanceof Error
          ? registerError.message
          : copy.registerError,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="app-page">
        <div className="screen screen--login">
          <div className="screen__ambient screen__ambient--login-left" />
          <div className="screen__ambient screen__ambient--login-right" />

          <div className="login-shell">
            <section className="login-hero">
              <span className="spotlight-pill">
                {copy.createAccount}
              </span>

              <div className="brand-hero brand-hero--login">
                <BrandMark className="brand-mark--hero" />
                <div className="brand-hero__copy">
                  <strong>AR Learn</strong>
                  <p>{copy.subtitle}</p>
                </div>
              </div>
            </section>

            <form className="login-card" onSubmit={handleSubmit}>
              <div className="section-head section-head--compact">
                <h2>{copy.register}</h2>
              </div>

              {authNotice ? (
                <p className="auth-hint auth-hint--status">{authNotice}</p>
              ) : (
                <div className="auth-hint">
                  <strong>{copy.firebaseTitle}</strong>
                  <span>{copy.firebaseCopy}</span>
                </div>
              )}

              <label className="auth-field">
                <span>{copy.fullName}</span>
                <div className="auth-field__control">
                  <IonIcon icon={personSharp} />
                  <input
                    autoComplete="name"
                    placeholder={copy.namePlaceholder}
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
              </label>

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
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </label>

              <label className="auth-field">
                <span>{copy.password}</span>
                <div className="auth-field__control">
                  <IonIcon icon={lockClosedOutline} />
                  <input
                    autoComplete="new-password"
                    placeholder={copy.passwordPlaceholder}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    className="auth-field__toggle"
                    aria-label={showPassword ? copy.hidePassword : copy.showPassword}
                    onClick={() => setShowPassword((currentValue) => !currentValue)}
                  >
                    <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} />
                  </button>
                </div>
              </label>

              <label className="auth-field">
                <span>{copy.confirmPassword}</span>
                <div className="auth-field__control">
                  <IonIcon icon={lockClosedOutline} />
                  <input
                    autoComplete="new-password"
                    placeholder={copy.confirmPasswordPlaceholder}
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
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
                      setShowConfirmPassword((currentValue) => !currentValue)
                    }
                  >
                    <IonIcon
                      icon={showConfirmPassword ? eyeOffOutline : eyeOutline}
                    />
                  </button>
                </div>
              </label>

              <label className="remember-toggle">
                <input
                  checked={rememberMe}
                  type="checkbox"
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                <span>{copy.keepSignedIn}</span>
              </label>

              {error ? <p className="auth-error">{error}</p> : null}

              <button
                type="submit"
                className="auth-submit"
                disabled={isSubmitting}
              >
                <IonIcon icon={personOutline} />
                {isSubmitting ? copy.creatingAccount : copy.createAccountButton}
              </button>

              <div className="auth-switch">
                <span>{copy.alreadyHaveAccount}</span>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => history.push("/login")}
                >
                  {copy.signIn}
                </button>
              </div>
            </form>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default RegisterPage;
