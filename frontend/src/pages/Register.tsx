import { useState } from "react";
import {
  Navigate,
  useNavigate,
  Link,
} from "react-router-dom";
import {
  Building2,
  RadioTower,
  UserPlus,
} from "lucide-react";

import {
  isAuthenticated,
  saveAuthentication,
  type LoginResponse,
} from "../auth";

const API_URL = `${import.meta.env.VITE_API_URL}/auth/register`;

function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  if (isAuthenticated()) {
    return <Navigate to="/assets" replace />;
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      !fullName.trim() ||
      !companyName.trim() ||
      !email.trim() ||
      !password
    ) {
      setErrorMessage("All fields are required.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage(
        "Password must be at least 8 characters.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          full_name: fullName.trim(),
          company_name: companyName.trim(),
          password,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as {
          detail?: string;
        };

        setErrorMessage(
          errorData.detail ||
            "Unable to create your account.",
        );
        return;
      }

      const registrationResponse =
        (await response.json()) as LoginResponse;

      saveAuthentication(registrationResponse);
      navigate("/assets", { replace: true });
    } catch {
      setErrorMessage(
        "Could not connect to IronTrace. Make sure the API is running.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      <section className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-blue-950 via-slate-950 to-slate-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-600">
            <RadioTower size={24} />
          </div>

          <div>
            <p className="text-xl font-black tracking-tight">
              IronTrace
            </p>

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-300">
              Asset intelligence
            </p>
          </div>
        </div>

        <div className="max-w-xl">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-orange-400">
            Start tracking
          </p>

          <h1 className="mt-4 text-5xl font-black leading-tight">
            Build your contractor workspace.
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-300">
            Create an account, add your equipment, and keep
            every asset separated securely by company.
          </p>
        </div>

        <p className="text-sm text-slate-500">
          Secure accounts with encrypted passwords and JWT
          authentication.
        </p>
      </section>

      <section className="flex flex-1 items-center justify-center bg-slate-100 p-5 sm:p-8">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white">
                <RadioTower size={22} />
              </div>

              <p className="text-xl font-black text-slate-950">
                IronTrace
              </p>
            </div>
          </div>

          <div className="mb-7">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <UserPlus size={23} />
            </div>

            <h2 className="text-3xl font-black tracking-tight text-slate-950">
              Create your account
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Set up your IronTrace company workspace.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Full name
                </span>

                <input
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  autoComplete="name"
                  placeholder="Alex Contractor"
                  className="field-input"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Company name
                </span>

                <div className="relative">
                  <Building2
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={companyName}
                    onChange={(event) =>
                      setCompanyName(event.target.value)
                    }
                    autoComplete="organization"
                    placeholder="ABC Contracting"
                    className="field-input pl-10"
                  />
                </div>
              </label>
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Email address
              </span>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                autoComplete="email"
                placeholder="you@company.com"
                className="field-input"
              />
            </label>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Password
                </span>

                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className="field-input"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Confirm password
                </span>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value,
                    )
                  }
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  className="field-input"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UserPlus size={18} />

              {isSubmitting
                ? "Creating account..."
                : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-blue-700 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default Register;