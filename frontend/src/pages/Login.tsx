import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { LockKeyhole, LogIn, RadioTower } from "lucide-react";

import {
  isAuthenticated,
  saveAuthentication,
  type LoginResponse,
} from "../auth";

const API_URL = `${import.meta.env.VITE_API_URL}/auth/login`;

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("sam@example.com");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated()) {
    return <Navigate to="/assets" replace />;
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setErrorMessage("Email and password are required.");
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
          password,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as {
          detail?: string;
        };

        setErrorMessage(
          errorData.detail || "Unable to sign in.",
        );
        return;
      }

      const loginResponse =
        (await response.json()) as LoginResponse;

      saveAuthentication(loginResponse);
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
            Built for contractors
          </p>

          <h1 className="mt-4 text-5xl font-black leading-tight">
            Know where your equipment is.
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-300">
            Track assets, equipment assignments, GPS health,
            maintenance status, and jobsite activity from one
            secure workspace.
          </p>
        </div>

        <p className="text-sm text-slate-500">
          Secure access powered by IronTrace authentication.
        </p>
      </section>

      <section className="flex flex-1 items-center justify-center bg-slate-100 p-5 sm:p-8">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
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
              <LockKeyhole size={23} />
            </div>

            <h2 className="text-3xl font-black tracking-tight text-slate-950">
              Welcome back
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Sign in to manage your assets and tracking data.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Email address
              </span>

              <input
                type="email"
                value={email}
                autoComplete="email"
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@company.com"
                className="field-input"
              />
            </label>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Password
              </span>

              <input
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                className="field-input"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogIn size={18} />
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

export default Login;