"use client";
import { useContext, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login, validateToken, validateAccessToken, requestPassword } from "@/api/tickets";
import { alertContext } from "@/hooks/alertContext";
import { Eye, EyeOff } from "lucide-react";

function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAlertCtx } = useContext(alertContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [buttonLoader, setButtonLoader] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPwd, setIsForgotPwd] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) validateToken().then(() => router.push("/my-tickets")).catch(() => localStorage.removeItem("auth_token"));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.host === "localhost:3000" || window.location.host === "staging-ticketing.brilliant.com.bd") return;
    const tkey = searchParams.get("tkey"), tvalue = searchParams.get("tvalue"), origin = searchParams.get("origin"), auth_token = searchParams.get("auth_token");
    if (!tkey && !tvalue && !origin) return;
    if (tkey && tvalue) {
      setIsLoading(true);
      validateAccessToken(tkey, tvalue)
        .then(() => { if (auth_token) { localStorage.setItem("auth_token", auth_token); validateToken().then(() => router.push("/my-tickets")).catch(() => { localStorage.removeItem("auth_token"); if (origin === "pbx") window.open("https://pbx.brilliant.com.bd/","_self"); else if (origin === "sms") window.open("https://sms.brilliant.com.bd/","_self"); }); } })
        .catch(() => window.open("https://intercloud.com.bd/support","_self"))
        .finally(() => setIsLoading(false));
    } else window.open("https://intercloud.com.bd/support","_self");
  }, []);

  useEffect(() => {
    const h = (e) => { if (e.key === "Enter") { if (isForgotPwd) handleRequestPassword(); else handleLogin(); } };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [username, password, isForgotPwd]);

  const handleLogin = () => {
    if (!username || !password) return;
    setButtonLoader(true);
    login({ username, password })
      .then((r) => { localStorage.setItem("auth_token", r.data.auth_token); setAlertCtx({ title: "Success!", message: "Successfully logged in.", type: "success" }); router.push("/my-tickets"); })
      .catch(() => setAlertCtx({ title: "Unsuccessful!", message: "Please check your username or password.", type: "error" }))
      .finally(() => setButtonLoader(false));
  };

  const handleRequestPassword = () => {
    if (!username) return;
    setButtonLoader(true);
    requestPassword(username)
      .then(() => { setAlertCtx({ title: "Success!", message: "A reset email was sent.", type: "success" }); setIsForgotPwd(false); setUsername(""); })
      .catch(() => setAlertCtx({ title: "Failed!", message: "An error occurred. Please try again.", type: "error" }))
      .finally(() => setButtonLoader(false));
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 relative">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl px-8 py-10 flex flex-col items-center">
        <img src="https://brilliant-ticket.s3.brilliant.com.bd/logo/logo.png" alt="Internal Ticketing" className="h-14 mb-4" onError={(e) => { e.target.style.display="none"; }} />
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Internal Ticketing System</h2>
        {!isForgotPwd ? (
          <div className="w-full flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input autoFocus type="text" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value.trim())} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input type={showPwd ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value.trim())} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10" />
                <button type="button" className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600" onClick={() => setShowPwd((p) => !p)}>{showPwd ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>
            <p className="text-right text-sm text-blue-700 cursor-pointer hover:underline -mt-2" onClick={() => { setUsername(""); setIsForgotPwd(true); }}>Forgot Password?</p>
            <button onClick={handleLogin} disabled={buttonLoader || !username || !password} style={{ cursor: "pointer" }} className="w-full py-2.5 rounded-lg font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all">
              {buttonLoader ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Login"}
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username or Email</label>
              <input autoFocus type="text" placeholder="Enter your username or email" value={username} onChange={(e) => setUsername(e.target.value.trim())} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={handleRequestPassword} disabled={buttonLoader || !username} style={{ cursor: "pointer" }} className="w-full py-2.5 rounded-lg font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all">
              {buttonLoader ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Request Password Reset"}
            </button>
            <p className="text-center text-sm text-blue-700 cursor-pointer hover:underline" onClick={() => setIsForgotPwd(false)}>← Back to Sign In</p>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-8 text-center">© {new Date().getFullYear()} Internal Ticketing System. All rights reserved.</p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200"><div className="text-gray-600">Loading...</div></div>}>
      <LoginView />
    </Suspense>
  );
}
