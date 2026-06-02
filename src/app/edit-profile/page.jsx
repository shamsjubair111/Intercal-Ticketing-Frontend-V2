"use client";
import { useContext, useEffect, useState } from "react";
import { getUserInfo, editProfile, updateSecondaryEmail } from "@/api/tickets";
import { alertContext } from "@/hooks/alertContext";

const I =
  "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500";
const ID =
  "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-400";

const DEPARTMENTS = [
  { label: "Cloud", value: "cloud" },
  { label: "Internet / Data", value: "internet" },
  { label: "IP Telephony", value: "iptelephony" },
  { label: "SMS", value: "sms" },
];

const TEAMS = [
  { label: "Support", value: "support" },
  { label: "Revenue", value: "revenue" },
  { label: "Sales", value: "sales" },
];

const F = ({ label, value, onChange, disabled }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">
      {label}
    </label>
    <input
      type="text"
      value={value || ""}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      disabled={disabled}
      className={disabled ? ID : I}
    />
  </div>
);

const SelectField = ({ label, value, onChange, options, placeholder }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">
      {label}
    </label>
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className={I}
    >
      <option value="">{placeholder || `Select ${label}`}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

export default function EditProfilePage() {
  const { setAlertCtx } = useContext(alertContext);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [company, setCompany] = useState("");
  const [department, setDepartment] = useState("");
  const [team, setTeam] = useState("");
  const [designation, setDesignation] = useState("");
  const [companyEmails, setCompanyEmails] = useState({});
  const [companyLoaders, setCompanyLoaders] = useState({});

  useEffect(() => {
    getUserInfo()
      .then((r) => {
        const u = r.data.data[0];
        setUserData(u);
        setName(u.name || "");
        setEmail(u.email || "");
        setMobile(u.mobile || "");
        setCompany(u.company || "");
        setDepartment(u.department || "");
        setTeam(u.team || "");
        setDesignation(u.designation || "");
        const init = {};
        (u.client_companies || []).forEach((c) => {
          init[c._id] = c.secondary_emails || "";
        });
        setCompanyEmails(init);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = () => {
    setSaving(true);
    editProfile(
      userData.user_id,
      userData.username,
      userData.customer_id,
      name,
      email,
      mobile,
      userData.user_type,
      company,
      "",
      department,
      team,
      designation,
    )
      .then(() =>
        setAlertCtx({
          title: "Success",
          message: "Profile updated.",
          type: "success",
        }),
      )
      .catch(() =>
        setAlertCtx({
          title: "Error",
          message: "Update failed.",
          type: "error",
        }),
      )
      .finally(() => setSaving(false));
  };

  const handleCompanyEmail = (cId, cName) => {
    setCompanyLoaders((p) => ({ ...p, [cId]: true }));
    updateSecondaryEmail({
      company_id: cId,
      secondary_emails: companyEmails[cId] || "",
    })
      .then(() =>
        setAlertCtx({
          title: "Success",
          message: `${cName} email updated.`,
          type: "success",
        }),
      )
      .catch(() =>
        setAlertCtx({
          title: "Error",
          message: "Update failed.",
          type: "error",
        }),
      )
      .finally(() => setCompanyLoaders((p) => ({ ...p, [cId]: false })));
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="px-6 py-6">
      <div className="border border-gray-200 rounded-sm bg-white flex items-center min-h-[52px] px-3 md:px-5 w-full mb-6">
        <h3 className="font-bold text-base md:text-[18px] py-2">
          Edit Profile
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Profile Information */}
        <div className="bg-white border border-gray-200 rounded-sm p-5">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">
            Profile Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <F label="Username" value={userData?.username} disabled />
            <F label="User Type" value={userData?.user_type} disabled />
            <F label="Name" value={name} onChange={setName} />
            <F label="Email" value={email} onChange={setEmail} />
            <F label="Mobile" value={mobile} onChange={setMobile} />
            <F label="Company" value={company} onChange={setCompany} />
            <SelectField
              label="Department"
              value={department}
              onChange={setDepartment}
              options={DEPARTMENTS}
              placeholder="Select Department"
            />
            <SelectField
              label="Team"
              value={team}
              onChange={setTeam}
              options={TEAMS}
              placeholder="Select Team"
            />
            <F
              label="Designation"
              value={designation}
              onChange={setDesignation}
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ cursor: "pointer" }}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>

        {/* Company Secondary Emails */}
        {userData?.client_companies?.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-sm p-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">
              Company Secondary Emails
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {userData.client_companies.map((c) => (
                <div key={c._id} className="border border-gray-200 rounded p-3">
                  <p className="text-xs font-medium text-gray-600 mb-2">
                    {c.company_name}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={companyEmails[c._id] || ""}
                      onChange={(e) =>
                        setCompanyEmails((p) => ({
                          ...p,
                          [c._id]: e.target.value,
                        }))
                      }
                      placeholder="secondary@email.com"
                      className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => handleCompanyEmail(c._id, c.company_name)}
                      disabled={companyLoaders[c._id]}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded disabled:opacity-50"
                    >
                      {companyLoaders[c._id] ? "..." : "Update"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
