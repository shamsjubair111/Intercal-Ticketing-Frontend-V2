import axios from "axios";
import execute from "./axiosInstance";
import { API_BASE_URL } from "../config";

// Auth
export function login({ username, password }) {
  return axios.post(`${API_BASE_URL}/api/v1/users/login`, { username, password });
}
export function validateToken() {
  return execute.get("/api/v1/users/token-validation");
}
export function validateAccessToken(key, value) {
  return axios.post(`${API_BASE_URL}/api/v1/users/validate-access-token`, { key, value });
}
export function requestPassword(username) {
  return execute.post("/api/v1/users/request-forgot-password", { username });
}
export function forgotPassword(username, password, verificationCode) {
  return execute.post("/api/v1/users/reset-forgot-password", { username, password, verification_code: verificationCode });
}

// User
export function getUserInfo() { return execute.get("/api/v1/users/get-user-info"); }
export function getClientList() { return execute.get("/api/v1/users/get-client-list"); }
export function getDashboardData() { return execute.get("/api/v1/users/dashboard"); }
export function editProfile(user_id, username, customer_id, name, email, mobile, user_type, company, secondary_emails, department, team, designation) {
  return execute.post("/api/v1/users/edit-user-info", { user_id, username, customer_id, name, email, mobile, user_type, company, secondary_emails, department, team, designation });
}
export function changePassword(userId, username, currentPassword, newPassword) {
  return execute.post("/api/v1/users/change-password", { user_id: userId, username, current_password: currentPassword, new_password: newPassword });
}
export function updateSecondaryEmail(companyData) {
  return execute.post("/api/v1/users/update-secondary-email", { company_id: companyData.company_id, secondary_emails: companyData.secondary_emails });
}
export function getUserTicketSummary(username) { return execute.get(`/api/v1/users/get-user-summary/${username}`); }
export function getUserSummaryByDateRange(username, start_date, end_date) {
  const data = {};
  if (start_date) data.start_date = start_date;
  if (end_date) data.end_date = end_date;
  return execute.post(`/api/v1/tickets/generate-user-report/${username}`, data);
}

// Tickets
export function getTicketByStatus(page, params = {}) {
  const query = new URLSearchParams();
  if (params.status)         query.append("status", params.status);
  if (params.priority)       query.append("priority", params.priority);
  if (params.service_type)   query.append("service_type", params.service_type.toLowerCase());
  if (params.start_date)     query.append("start_date", params.start_date);
  if (params.end_date)       query.append("end_date", params.end_date);
  if (params.ticket_id)      query.append("ticket_id", params.ticket_id);
  if (params.client_companies) query.append("client_companies", params.client_companies);
  const qs = query.toString();
  return execute.get(`/api/v1/tickets/user-type-wise-tickets/${page}${qs ? `?${qs}` : ""}`);
}
export function getAssignedTicket(page, params = {}) {
  const status = params.status || "all";
  return execute.get(`/api/v1/users/assigned-tickets/${status}/${page}`);
}
export function getSearchTicket(category, value, page) { return execute.post(`/api/v1/tickets/search/${page}`, { catagory: category, value }); }
export function ticketDetails(ticket_id) { return execute.get(`/api/v1/tickets/${ticket_id}`); }
export function ticketTitles(type, value) { return execute.get(`/api/v1/tickets/topics/${type}/${value?.toLowerCase()}`); }
export function postTicket(data) { return execute.post("/api/v1/tickets/issue-ticket", data); }
export function addComment(data) { return execute.post("/api/v1/tickets/add-comment", data); }
export function changeStatus(ticket_id, status) { return execute.post("/api/v1/tickets/change-status", { ticket_id, status }); }
export function resolveTicket(ticket_id, customer_id, resolver_username, name, email, mobile, resolver_user_type, service_type, department, client_email, assignee_email, secondary_emails) {
  return execute.post("/api/v1/tickets/resolve-ticket", { ticket_id, resolver_id: customer_id, resolver_username, resolver_name: name, resolver_email: email, resolver_mobile: mobile, resolver_user_type, service_type, department_email: department, client_email, assignee_email, secondary_emails });
}
export function pickTicket(ticket_id, assignee_user_type, assignee_id, assignee_username, assignee_name, assignee_email, assignee_mobile, service_type, department, secondary_emails, client_email) {
  return execute.post("/api/v1/tickets/pick-ticket", { ticket_id, assignee_user_type, assignee_id, assignee_username, assignee_name, assignee_email, assignee_mobile, service_type, department_email: department, secondary_emails, client_email });
}
export function dropTicket(ticket_id, dropCause, dropper_user_type, dropper_id, dropper_username, dropper_name, dropper_email, dropper_mobile, secondary_emails, service_type, department_email, client_email) {
  return execute.post("/api/v1/tickets/drop-ticket", { ticket_id, drop_cause: dropCause, dropper_user_type, dropper_id, dropper_username, dropper_name, dropper_email, dropper_mobile, secondary_emails, service_type, department_email, client_email });
}
export function forwardTicket({ ticket_id, previous_service_type, previous_department, previous_department_email, new_service_type, new_department, new_department_email, secondary_emails, forwarder_user_type, forwarder_id, forwarder_username, forwarder_name, forwarder_email, forwarder_mobile, forward_cause, is_in_forward_chain, client_email }) {
  return execute.post("/api/v1/tickets/forward-ticket", { ticket_id, previous_service_type, previous_department, previous_department_email, new_service_type, new_department, new_department_email, secondary_emails, forwarder_user_type, forwarder_id, forwarder_username, forwarder_name, forwarder_email, forwarder_mobile, forward_cause, is_in_forward_chain, client_email });
}
export function forwardChainTickets(page, params = {}) {
  const status = params.status || "all";
  return execute.get(`/api/v1/tickets/forward-chain-ticket/${status}/${page}`);
}
export function updateTicket(ticket_id, title, priority) {
  const data = { ticket_id };
  if (title != null) data.title = title;
  if (priority != null) data.priority = priority;
  return execute.post("/api/v1/tickets/update", data);
}
export function addRootCause(ticket_id, root_cause_analysis, service_type, department, secondary_emails, client_email, assignee_email, resolver_email) {
  return execute.post("/api/v1/tickets/root-cause-analysis", { ticket_id, root_cause_analysis, service_type, department_email: department, secondary_emails, client_email, assignee_email, resolver_email });
}

// Files
export function getPresignedPost(fileName) { return execute.post("/api/v1/tickets/get-presigned-post", { object_name: fileName }); }
export function postAttachmentToS3(url, formData) { return axios.post(url, formData, { headers: { "Content-Type": "multipart/form-data" } }); }

// Reports
export function getDeptWiseReport(service_type, department, start_date, end_date) {
  const data = { service_type };
  if (department) data.department = department;
  if (start_date) data.start_date = start_date;
  if (end_date) data.end_date = end_date;
  return execute.post("/api/v1/tickets/generate-report", data);
}

// Logout
export function logout() {
  if (typeof window !== "undefined") { localStorage.clear(); window.location.href = "/"; }
}

// Email routing
const emailListProd = {
  Cloud:       { support: "cloud.operation@brilliant.com.bd",  revenue: "revenue.asurance@brilliant.com.bd", sales: "sales@brilliant.com.bd", corporatesupport: "cs@brilliant.com.bd", core: "core@brilliant.com.bd", npi: "implementation@brilliant.com.bd" },
  Internet:    { support: "noc@brilliant.com.bd",              revenue: "revenue.asurance@brilliant.com.bd", sales: "sales@brilliant.com.bd", corporatesupport: "cs@brilliant.com.bd", core: "core@brilliant.com.bd", npi: "implementation@brilliant.com.bd" },
  IpTelephony: { support: "iptsp.noc@brilliant.com.bd",        revenue: "revenue.asurance@brilliant.com.bd", sales: "sales@brilliant.com.bd", corporatesupport: "cs@brilliant.com.bd", core: "core@brilliant.com.bd", npi: "implementation@brilliant.com.bd" },
  SMS:         { support: "sms.support@novocom-bd.com",        revenue: "revenue.asurance@brilliant.com.bd", sales: "sales@brilliant.com.bd", corporatesupport: "cs@brilliant.com.bd", core: "core@brilliant.com.bd", npi: "implementation@brilliant.com.bd" },
};

const emailListDev = {
  Cloud: {
    support: "jubairshams111@gmail.com",
    revenue: "jubairshams111@gmail.com",
    sales: "jubairshams111@gmail.com",
    corporatesupport: "jubairshams111@gmail.com",
    core: "jubairshams111@gmail.com",
    npi: "jubairshams111@gmail.com"
  },
  Internet: {
    support: "jubairshams111@gmail.com",
    revenue: "jubairshams111@gmail.com",
    sales: "jubairshams111@gmail.com",
    corporatesupport: "jubairshams111@gmail.com",
    core: "jubairshams111@gmail.com",
    npi: "jubairshams111@gmail.com"
  },
  IpTelephony: {
    support: "jubairshams111@gmail.com",
    revenue: "jubairshams111@gmail.com",
    sales: "jubairshams111@gmail.com",
    corporatesupport: "jubairshams111@gmail.com",
    core: "jubairshams111@gmail.com",
    npi: "jubairshams111@gmail.com"
  },
  SMS: {
    support: "jubairshams111@gmail.com",
    revenue: "jubairshams111@gmail.com",
    sales: "jubairshams111@gmail.com",
    corporatesupport: "jubairshams111@gmail.com",
    core: "jubairshams111@gmail.com",
    npi: "jubairshams111@gmail.com"
  }
};


export function getTicketById(id) {
  return execute.get(`/api/v1/tickets/${id}`);
}
 
export function moveTicketToTrash(ticketId) {
  return execute.delete(`/api/v1/tickets/trash/${ticketId}`);
}
 
export function restoreTicketFromTrash(ticketId) {
  return execute.put(`/api/v1/tickets/restore/${ticketId}`);
}
 
export function getTrashTickets(page = 1) {
  return execute.get(`/api/v1/tickets/trash-list/${page}`);
}
 
export function deleteTicketPermanently(ticketId) {
  return execute.delete(`/api/v1/tickets/permanently-delete/${ticketId}`);
}
 
export function clearTrash() {
  return execute.delete("/api/v1/tickets/clear-trash");
}
 
export function getPermanentlyDeletedTickets(page = 1) {
  return execute.get(`/api/v1/tickets/permanently-deleted-list/${page}`);
}

// Add these 4 functions to src/api/tickets.js

export function getTopics() {
  return execute.get("/api/v1/tickets/topics");
}

export function addTopic(service_type, topic) {
  return execute.post("/api/v1/tickets/topics", { service_type, topic });
}

export function updateTopic(topic_id, service_type, topic) {
  return execute.put("/api/v1/tickets/topics", { topic_id, service_type, topic });
}

export function deleteTopic(topic_id) {
  return execute.delete("/api/v1/tickets/topics", { data: { topic_id } });
}
 


export const emailList =
  typeof window !== "undefined" && window.location.host === "support.brilliant.com.bd"
    ? emailListProd : emailListDev;