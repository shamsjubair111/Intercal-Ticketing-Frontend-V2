"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useContext } from "react";
import { logout, getUserInfo, changePassword } from "@/api/tickets";
import { alertContext } from "@/hooks/alertContext";
import { useTicketContext } from "@/context/TicketContext";
import { X, Eye, EyeOff } from "lucide-react";

function ChangePasswordModal({ onClose }) {
  const { setAlertCtx } = useContext(alertContext);
  const [userData, setUserData] = useState(null);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getUserInfo()
      .then((r) => setUserData(r.data.data[0]))
      .catch(() => {});
  }, []);

  const handleSubmit = () => {
    if (newPwd !== confirmPwd) {
      setAlertCtx({
        title: "Error",
        message: "Passwords do not match.",
        type: "error",
      });
      return;
    }
    if (!userData) return;
    setLoading(true);
    changePassword(userData.user_id, userData.username, currentPwd, newPwd)
      .then(() => {
        setAlertCtx({
          title: "Success",
          message: "Password changed successfully.",
          type: "success",
        });
        onClose();
      })
      .catch(() =>
        setAlertCtx({
          title: "Error",
          message: "Failed. Check your current password.",
          type: "error",
        }),
      )
      .finally(() => setLoading(false));
  };

  const I =
    "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 pr-10";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm mx-4">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-lg font-semibold text-gray-800">
            Change Password
          </h2>
          <button onClick={onClose}>
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              placeholder="Current password"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              className={I}
            />
            <button
              type="button"
              onClick={() => setShowCurrent((p) => !p)}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              placeholder="New password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              className={I}
            />
            <button
              type="button"
              onClick={() => setShowNew((p) => !p)}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          {newPwd && confirmPwd && newPwd !== confirmPwd && (
            <p className="text-xs text-red-500">Passwords do not match</p>
          )}
        </div>
        <div className="flex justify-end gap-3 border-t px-5 py-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!currentPwd || !newPwd || !confirmPwd || loading}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const dropdownRef = useRef(null);
  const [token, setToken] = useState(null);

  // TicketContext may not be available on public pages — safe access
  let setSelectedStatus = null;
  try {
    const ctx = useTicketContext();
    setSelectedStatus = ctx?.setSelectedStatus;
  } catch {}

  useEffect(() => {
    setToken(localStorage.getItem("auth_token"));
  }, []);

  useEffect(() => {
    function outside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", outside);
      return () => document.removeEventListener("mousedown", outside);
    }
  }, [open]);

  if (pathname === "/" || pathname === "/reset-password") return null;

  const handleLogoClick = () => {
    localStorage.removeItem("ticket_filters");
    window.dispatchEvent(new Event("storage"));
    setSelectedStatus?.("");
    router.push("/dashboard");
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 h-16 bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-3 md:px-6 lg:px-8">
        <div
          onClick={handleLogoClick}
          className="flex items-center gap-2 md:gap-3 cursor-pointer"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 flex-shrink-0">
            <svg
              className="h-5 w-5 text-gray-700"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M3 10a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zm5-3a1 1 0 100-2 1 1 0 000 2z"
              />
            </svg>
          </div>
          <h1 className="text-sm md:text-base lg:text-lg font-semibold text-gray-900 truncate">
            Ticketing System
          </h1>
        </div>

        {token && (
          <div className="relative" ref={dropdownRef}>
            <button
              className="rounded p-2 hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => setOpen(!open)}
              aria-label="User menu"
            >
              <svg
                className="h-5 w-5 text-gray-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 5a5 5 0 100 10 5 5 0 000-10zm0 8a3 3 0 110-6 3 3 0 010 6z" />
              </svg>
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-44 bg-white border rounded-md shadow-lg z-50">
                <button
                  onClick={() => {
                    router.push("/edit-profile");
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-t-md transition-colors"
                  style={{ cursor: "pointer" }}
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => {
                    setShowPwdModal(true);
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                  style={{ cursor: "pointer" }}
                >
                  Change Password
                </button>
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-b-md transition-colors"
                  style={{ cursor: "pointer" }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {showPwdModal && (
        <ChangePasswordModal onClose={() => setShowPwdModal(false)} />
      )}
    </>
  );
}
