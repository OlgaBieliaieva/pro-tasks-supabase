"use client";

import { useState, useEffect } from "react";
import { useSupabaseClient, useSession } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const supabase = useSupabaseClient();
  const session = useSession();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session) {
      router.push("/");
    }
  }, [session, router]);

  const handleAuth = async () => {
    setLoading(true);
    setError("");

    try {
      let result;
      if (isRegister) {
        result = await supabase.auth.signUp({ email, password });
      } else {
        result = await supabase.auth.signInWithPassword({ email, password });
      }

      const { data, error } = result;
      if (error) throw error;

      const session = data?.session;

      if (session) {
        await fetch("/auth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session }),
        });
        router.push("/");
      } else if (isRegister) {
        alert("Перевір свою пошту для підтвердження акаунту!");
      }
    } catch (err: unknown) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">
        {isRegister ? "Register" : "Login"}
      </h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 rounded mb-2 w-80"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 rounded mb-2 w-80"
      />

      <button
        onClick={handleAuth}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-2 w-80 hover:bg-blue-700"
      >
        {loading ? "Loading..." : isRegister ? "Register" : "Login"}
      </button>

      {error && <p className="text-red-600 mb-2">{error}</p>}

      <button
        onClick={() => setIsRegister(!isRegister)}
        className="text-blue-600 underline"
      >
        {isRegister
          ? "Already have an account? Login"
          : "Don't have an account? Register"}
      </button>
    </div>
  );
}
