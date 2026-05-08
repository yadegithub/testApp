import { IonContent, IonIcon, IonPage } from "@ionic/react";
import {
  arrowForwardOutline,
  eyeOffOutline,
  eyeOutline,
  lockClosedOutline,
  logInOutline,
  mailOutline,
  personOutline,
} from "ionicons/icons";
import { useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { demoAccounts } from "../auth/demoAccounts";
import { useAuth } from "../auth/useAuth";
import BrandMark from "../components/BrandMark";
import { useAppSettings } from "../settings/AppSettingsContext";

interface LoginLocationState {
  from?: {
    pathname: string;
  };
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginPage: React.FC = () => {
  const history = useHistory();
  const location = useLocation<LoginLocationState>();
  const {
    authMode,
    authNotice,
    isAuthenticated,
    isReady,
    login,
    logout,
    requestPasswordReset,
    user,
  } = useAuth();
  const { settings } = useAppSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [resetFeedback, setResetFeedback] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isArabic = settings.language === "ar";
  const copy = isArabic
    ? {
        welcome: "مرحبا بعودتك",
        subtitle: "سجل الدخول لمتابعة دروس الواقع المعزز على الهاتف.",
        login: "تسجيل الدخول",
        restoring: "جار استعادة الجلسة...",
        alreadySignedIn: "أنت مسجل الدخول بالفعل على هذا الجهاز.",
        continueDashboard: "المتابعة إلى الرئيسية",
        switchAccount: "تبديل الحساب",
        email: "البريد الإلكتروني",
        emailPlaceholder: "you@example.com",
        password: "كلمة المرور",
        passwordPlaceholder: "أدخل كلمة المرور",
        hidePassword: "إخفاء كلمة المرور",
        showPassword: "إظهار كلمة المرور",
        keepSignedIn: "أبقني مسجل الدخول على هذا الجهاز",
        forgotPassword: "نسيت كلمة المرور؟",
        sendingReset: "جار إرسال رابط إعادة التعيين...",
        resetSent: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.",
        signingIn: "جار تسجيل الدخول...",
        signIn: "دخول",
        useDemo: "استخدام حساب تجريبي",
        demoAccount: "الحساب التجريبي",
        demoPassword: "كلمة المرور",
        firebaseTitle: "مصادقة Firebase بالبريد وكلمة المرور",
        firebaseCopy: "استخدم الحساب نفسه على المتصفح و Android.",
        newHere: "جديد هنا؟",
        createAccount: "إنشاء حساب",
        invalidEmail: "أدخل بريدا إلكترونيا صحيحا.",
        shortPassword: "يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل.",
        signInError: "تعذر تسجيل الدخول الآن.",
      }
    : {
        welcome: "Welcome back",
        subtitle: "Sign in to continue your AR lessons on mobile.",
        login: "Login",
        restoring: "Restoring your session...",
        alreadySignedIn: "You are already signed in on this device.",
        continueDashboard: "Continue to Dashboard",
        switchAccount: "Switch Account",
        email: "Email",
        emailPlaceholder: "you@example.com",
        password: "Password",
        passwordPlaceholder: "Enter your password",
        hidePassword: "Hide password",
        showPassword: "Show password",
        keepSignedIn: "Keep me signed in on this device",
        forgotPassword: "Forgot password?",
        sendingReset: "Sending reset link...",
        resetSent: "Password reset email sent. Check your inbox.",
        signingIn: "Signing in...",
        signIn: "Sign In",
        useDemo: "Use Demo Login",
        demoAccount: "Demo account",
        demoPassword: "Password",
        firebaseTitle: "Firebase email/password auth",
        firebaseCopy: "Use the same account across browser and Android.",
        newHere: "New here?",
        createAccount: "Create Account",
        invalidEmail: "Enter a valid email address.",
        shortPassword: "Password must be at least 6 characters.",
        signInError: "Unable to sign in right now.",
      };

  const redirectTo = location.state?.from?.pathname ?? "/tabs/dashboard";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!emailPattern.test(email.trim())) {
      setResetFeedback("");
      setError(copy.invalidEmail);
      return;
    }

    if (password.trim().length < 6) {
      setResetFeedback("");
      setError(copy.shortPassword);
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setResetFeedback("");
      await login({ email, password, rememberMe });
      history.replace(redirectTo);
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : copy.signInError,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!emailPattern.test(email.trim())) {
      setResetFeedback("");
      setError(copy.invalidEmail);
      return;
    }

    try {
      setIsResetting(true);
      setError("");
      setResetFeedback("");
      await requestPasswordReset(email.trim());
      setResetFeedback(copy.resetSent);
    } catch (resetError) {
      setResetFeedback("");
      setError(
        resetError instanceof Error ? resetError.message : copy.signInError,
      );
    } finally {
      setIsResetting(false);
    }
  };

  const useDemoAccess = () => {
    setEmail(demoAccounts[0].email);
    setPassword(demoAccounts[0].password);
    setError("");
    setResetFeedback("");
  };

  const continueWithCurrentSession = () => {
    history.replace(redirectTo);
  };

  const switchAccount = () => {
    logout();
    setEmail("");
    setPassword("");
    setError("");
    setResetFeedback("");
  };

  return (
    <IonPage>
      <IonContent fullscreen className="app-page">
        <div className="screen screen--login">
          <div className="screen__ambient screen__ambient--login-left" />
          <div className="screen__ambient screen__ambient--login-right" />

          <div className="login-shell">
            <section className="login-hero">
              <span className="spotlight-pill">{copy.welcome}</span>

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
                <h2>{copy.login}</h2>
              </div>

              {!isReady ? (
                <p className="auth-hint auth-hint--status">{copy.restoring}</p>
              ) : null}

              {authNotice ? (
                <p className="auth-hint auth-hint--status">{authNotice}</p>
              ) : null}

              {isAuthenticated ? (
                <div className="auth-session-card">
                  <div className="auth-session-card__copy">
                    <strong>{user?.name}</strong>
                    <span>{user?.email}</span>
                    <p>{copy.alreadySignedIn}</p>
                  </div>

                  <div className="auth-session-card__actions">
                    <button
                      type="button"
                      className="auth-submit"
                      onClick={continueWithCurrentSession}
                    >
                      <IonIcon icon={arrowForwardOutline} />
                      {copy.continueDashboard}
                    </button>
                    <button
                      type="button"
                      className="auth-demo"
                      onClick={switchAccount}
                    >
                      <IonIcon icon={personOutline} />
                      {copy.switchAccount}
                    </button>
                  </div>
                </div>
              ) : null}

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
                      setResetFeedback("");
                    }}
                  />
                </div>
              </label>

              <label className="auth-field">
                <span>{copy.password}</span>
                <div className="auth-field__control">
                  <IonIcon icon={lockClosedOutline} />
                  <input
                    autoComplete="current-password"
                    placeholder={copy.passwordPlaceholder}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                    }}
                  />
                  <button
                    type="button"
                    className="auth-field__toggle"
                    aria-label={
                      showPassword ? copy.hidePassword : copy.showPassword
                    }
                    onClick={() => setShowPassword((currentValue) => !currentValue)}
                  >
                    <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} />
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

              {authMode === "firebase" ? (
                <div className="auth-helper-row">
                  <button
                    type="button"
                    className="auth-link-button"
                    onClick={handlePasswordReset}
                    disabled={isResetting}
                  >
                    {isResetting ? copy.sendingReset : copy.forgotPassword}
                  </button>
                </div>
              ) : null}

              {error ? <p className="auth-error">{error}</p> : null}
              {resetFeedback ? (
                <p className="auth-success">{resetFeedback}</p>
              ) : null}

              <button
                type="submit"
                className="auth-submit"
                disabled={isSubmitting}
              >
                <IonIcon icon={logInOutline} />
                {isSubmitting ? copy.signingIn : copy.signIn}
              </button>

              {authMode === "local" ? (
                <>
                  <button
                    type="button"
                    className="auth-demo"
                    onClick={useDemoAccess}
                  >
                    <IonIcon icon={personOutline} />
                    {copy.useDemo}
                  </button>

                  <div className="auth-hint">
                    <strong>{copy.demoAccount}</strong>
                    <span>{demoAccounts[0].email}</span>
                    <span>
                      {copy.demoPassword}: {demoAccounts[0].password}
                    </span>
                  </div>
                </>
              ) : (
                <div className="auth-hint">
                  <strong>{copy.firebaseTitle}</strong>
                  <span>{copy.firebaseCopy}</span>
                </div>
              )}

              <div className="auth-switch">
                <span>{copy.newHere}</span>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => history.push("/register")}
                >
                  {copy.createAccount}
                </button>
              </div>
            </form>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;
