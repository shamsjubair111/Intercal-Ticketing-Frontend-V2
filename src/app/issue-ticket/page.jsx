"use client";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import {
  getUserInfo,
  getClientList,
  postTicket,
  ticketTitles,
  getPresignedPost,
  postAttachmentToS3,
  emailList,
} from "@/api/tickets";
import { alertContext } from "@/hooks/alertContext";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const SERVICES = [
  { label: "Internet / Data", value: "Internet" },
  { label: "Cloud", value: "Cloud" },
  { label: "IP Telephony", value: "IpTelephony" },
  { label: "SMS", value: "SMS" },
];
const TEAMS_STAFF = [
  { label: "Support", value: "support" },
  { label: "Revenue", value: "revenue" },
  { label: "Sales", value: "sales" },
  { label: "Core", value: "core" },
];
const TEAMS_CLIENT = [
  { label: "Support", value: "support" },
  { label: "Revenue", value: "revenue" },
  { label: "Sales", value: "sales" },
];
const PRIORITIES = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

const I =
  "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500";
const ID =
  "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-400";
const Label = ({ t }) => (
  <label className="block text-xs font-medium text-gray-600 mb-1">{t}</label>
);

export default function IssueTicketPage() {
  const router = useRouter();
  const { setAlertCtx } = useContext(alertContext);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [userType, setUserType] = useState("");
  const [clientList, setClientList] = useState([]);
  const [companyList, setCompanyList] = useState([]);
  const [service, setService] = useState("");
  const [team, setTeam] = useState("");
  const [priority, setPriority] = useState("");
  const [title, setTitle] = useState("");
  const [titleList, setTitleList] = useState([]);
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileKey, setFileKey] = useState(Date.now());
  const [useSecEmail, setUseSecEmail] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [newClientId, setNewClientId] = useState("");
  const [newSecEmails, setNewSecEmails] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [company, setCompany] = useState("");

  useEffect(() => {
    // Fetch user info first, then conditionally fetch client list
    getUserInfo()
      .then((u) => {
        const usr = u.data.data[0];
        setUserData(usr);
        setUserType(usr.user_type);
        setCompanyList(usr.client_companies || []);

        // Only fetch client list for non-client users
        if (usr.user_type !== "client") {
          return getClientList()
            .then((c) => setClientList(c.data.data || []))
            .catch(() => {}); // silently ignore if fails
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!service) {
      setTitleList([]);
      return;
    }
    ticketTitles("service_type", service)
      .then((r) => setTitleList(r.data?.topics || []))
      .catch(() => {});
  }, [service]);

  const handleCompanyInput = (val) => {
    setInputValue(val);
    if (!val) {
      clearClient();
      return;
    }
    const m = clientList.find(
      (c) => c.company?.toLowerCase() === val.toLowerCase(),
    );
    if (m) {
      setNewName(m.name);
      setNewEmail(m.email);
      setNewMobile(m.mobile);
      setNewCompany(m.company);
      setCompanyId(m.company_id);
      setNewUsername(m.username);
      setNewSecEmails(m.secondary_emails || "");
      setNewClientId(m.user_id);
    } else clearClient();
  };

  const clearClient = () => {
    setNewName("");
    setNewEmail("");
    setNewMobile("");
    setNewCompany("");
    setNewUsername("");
    setNewSecEmails("");
    setNewClientId("");
    setCompanyId("");
  };

  const handleClientCompany = (e) => {
    const sel = companyList.find((c) => c.company_name === e.target.value);
    if (sel) {
      setCompany(sel.company_name);
      setCompanyId(sel._id);
      setNewSecEmails(sel.secondary_emails || "");
    } else {
      setCompany("");
      setCompanyId("");
    }
  };

  const handleSubmit = async () => {
    if (!description || description === "<p></p>") {
      setAlertCtx({
        title: "Failed!",
        message: "Please provide a description.",
        type: "error",
      });
      return;
    }
    setBtnLoading(true);
    let attachments = [];
    try {
      for (const f of selectedFiles) {
        const gpp = await getPresignedPost(f.name);
        attachments.push(gpp.data.public_url);
        const fd = new FormData();
        const { AWSAccessKeyId, key, policy, signature } = gpp.data.data.fields;
        fd.append("Content-Type", gpp.data.data.fields["Content-Type"]);
        fd.append("key", key);
        fd.append("AWSAccessKeyId", AWSAccessKeyId);
        fd.append("policy", policy);
        fd.append("signature", signature);
        fd.append("file", f);
        await postAttachmentToS3(gpp.data.data.url, fd);
      }
    } catch {}

    const isClient = userType === "client";
    const sendMailTo = emailList?.[service]?.[team] || "";

    postTicket({
      title,
      description,
      attachments,
      secondary_emails: useSecEmail ? newSecEmails : "",
      use_secondary_email: useSecEmail,
      department: team,
      department_email: sendMailTo,
      issuer_user_type: userType,
      issuer_id: userData.user_id || userData.customer_id,
      issuer_username: userData.username,
      issuer_name: userData.name,
      issuer_email: userData.email,
      issuer_department: userData.department,
      issuer_team: userData.team,
      client_id: isClient
        ? userData.user_id || userData.customer_id
        : newClientId,
      client_name: isClient ? userData.name : newName,
      client_username: isClient ? userData.username : newUsername,
      client_email: isClient ? userData.email : newEmail,
      client_mobile: isClient ? userData.mobile : newMobile,
      client_company: isClient ? company : newCompany,
      client_company_id: companyId,
      service_type: service,
      priority,
    })
      .then(() => {
        setAlertCtx({
          title: "Success!",
          message: "Ticket issued successfully.",
          type: "success",
        });
        router.push("/my-tickets");
      })
      .catch(() =>
        setAlertCtx({
          title: "Error",
          message: "Failed to issue ticket.",
          type: "error",
        }),
      )
      .finally(() => setBtnLoading(false));
  };

  const isClient = userType === "client";
  const clientName = isClient ? userData?.name : newName;
  const clientEmail = isClient ? userData?.email : newEmail;
  const clientMobile = isClient ? userData?.mobile : newMobile;
  const clientCompany = isClient ? company : newCompany;
  const valid =
    title &&
    clientName &&
    team &&
    priority &&
    clientMobile &&
    service &&
    clientEmail &&
    clientCompany;

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
          Issue New Ticket
        </h3>
      </div>

      <div className="bg-white border border-gray-200 rounded-sm p-6">
        <p className="text-xs text-red-500 mb-4">(*) fields are required</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label t="Service *" />
            <select
              value={service}
              onChange={(e) => {
                setService(e.target.value);
                setTitle("");
              }}
              className={I}
            >
              <option value="">Select Service</option>
              {SERVICES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label t="Ticket Title *" />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!service}
              list="title-suggestions"
              placeholder={
                service ? "Type or select title" : "Select service first"
              }
              className={!service ? ID : I}
            />
            <datalist id="title-suggestions">
              {titleList.map((t, i) => (
                <option key={i} value={t.topic} />
              ))}
            </datalist>
          </div>

          <div>
            <Label t="Company *" />
            {isClient ? (
              <select
                value={company}
                onChange={handleClientCompany}
                className={I}
              >
                <option value="">Select company</option>
                {companyList.map((c, i) => (
                  <option key={i} value={c.company_name}>
                    {c.company_name}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => handleCompanyInput(e.target.value)}
                  list="company-list"
                  placeholder="Search company..."
                  className={I}
                />
                <datalist id="company-list">
                  {clientList.map((c, i) => (
                    <option key={i} value={c.company} />
                  ))}
                </datalist>
              </>
            )}
          </div>

          <div>
            <Label t="Customer Name *" />
            <input
              type="text"
              value={clientName || ""}
              disabled
              className={ID}
            />
          </div>
          <div>
            <Label t="Customer Email *" />
            <input
              type="text"
              value={clientEmail || ""}
              disabled
              className={ID}
            />
          </div>
          <div>
            <Label t="Customer Mobile *" />
            <input
              type="text"
              value={clientMobile || ""}
              disabled
              className={ID}
            />
          </div>

          {newSecEmails && (
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSecEmail}
                  onChange={(e) => setUseSecEmail(e.target.checked)}
                  className="accent-blue-600"
                />
                Use secondary email{" "}
                {useSecEmail && <strong>{newSecEmails}</strong>}
              </label>
            </div>
          )}

          <div>
            <Label t="Team *" />
            <select
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              className={I}
            >
              <option value="">Select Team</option>
              {(isClient ? TEAMS_CLIENT : TEAMS_STAFF).map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label t="Priority *" />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={I}
            >
              <option value="">Select Priority</option>
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <Label t="Description *" />
            <div className="mb-4 border rounded overflow-hidden">
              <ReactQuill
                theme="snow"
                value={description}
                onChange={setDescription}
                placeholder="Type here..."
                className="bg-white"
                style={{ height: "180px", overflowY: "auto" }}
                modules={{
                  toolbar: [
                    ["bold", "italic", "underline"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["clean"],
                  ],
                }}
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <Label t="Attachments" />
            <input
              type="file"
              multiple
              key={fileKey}
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.csv"
              onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
              className="text-sm text-gray-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <button
            onClick={() => router.push("/my-tickets")}
            className="cursor-pointer px-5 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={!valid || btnLoading}
            style={{ cursor: "pointer" }}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {btnLoading ? "Submitting..." : "Submit Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}
