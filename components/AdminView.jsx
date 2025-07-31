import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import SettingsSection from "./SettingsSection.jsx";
import RoleManagementSection from "./RoleManagementSection.jsx";
import MembersSection from "./MembersSection.jsx";
const AdminView = ({ settings, roles, members, onSaveSettings, onRoleAction, setViewMode }) => {
  return /* @__PURE__ */ jsxDEV("div", { className: "admin-panel", children: [
    /* @__PURE__ */ jsxDEV("header", { children: [
      /* @__PURE__ */ jsxDEV("h1", { children: [
        /* @__PURE__ */ jsxDEV("i", { className: "fas fa-users-cog" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 10,
          columnNumber: 21
        }),
        " Membership Admin Panel"
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 10,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "view-as-buttons", children: [
        /* @__PURE__ */ jsxDEV("button", { className: "btn btn-secondary view-toggle-btn", onClick: () => setViewMode("member"), children: [
          /* @__PURE__ */ jsxDEV("i", { className: "fas fa-user-check" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 13,
            columnNumber: 25
          }),
          " View as Member"
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 12,
          columnNumber: 21
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "btn btn-secondary view-toggle-btn", onClick: () => setViewMode("unpaid"), children: [
          /* @__PURE__ */ jsxDEV("i", { className: "fas fa-user" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 16,
            columnNumber: 25
          }),
          " View as Unpaid User"
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 15,
          columnNumber: 21
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 11,
        columnNumber: 17
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 9,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("main", { className: "main-content", children: [
      /* @__PURE__ */ jsxDEV(SettingsSection, { settings, roles, onSave: onSaveSettings }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 21,
        columnNumber: 17
      }),
      settings?.rolesEnabled && /* @__PURE__ */ jsxDEV(RoleManagementSection, { roles, onAction: onRoleAction }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 23,
        columnNumber: 21
      }),
      /* @__PURE__ */ jsxDEV(MembersSection, { members, roles, onRoleAction, rolesEnabled: settings?.rolesEnabled }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 25,
        columnNumber: 17
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 20,
      columnNumber: 13
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 8,
    columnNumber: 9
  });
};
var stdin_default = AdminView;
export {
  stdin_default as default
};
