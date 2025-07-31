import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useState } from "react";
const RoleManagementSection = ({ roles, onAction }) => {
  const [roleName, setRoleName] = useState("");
  const [roleColor, setRoleColor] = useState("#cccccc");
  const handleCreateRole = (e) => {
    e.preventDefault();
    if (roleName.trim()) {
      onAction("create", { name: roleName.trim(), color: roleColor });
      setRoleName("");
      setRoleColor("#cccccc");
    }
  };
  return /* @__PURE__ */ jsxDEV("section", { className: "role-management-section", children: [
    /* @__PURE__ */ jsxDEV("h2", { children: [
      /* @__PURE__ */ jsxDEV("i", { className: "fas fa-user-tag" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 18,
        columnNumber: 17
      }),
      " Manage Roles"
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 18,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("form", { onSubmit: handleCreateRole, className: "role-form", children: [
      /* @__PURE__ */ jsxDEV(
        "input",
        {
          type: "text",
          value: roleName,
          onChange: (e) => setRoleName(e.target.value),
          placeholder: "New role name (e.g., VIP)",
          required: true
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 20,
          columnNumber: 18
        }
      ),
      /* @__PURE__ */ jsxDEV(
        "input",
        {
          type: "color",
          value: roleColor,
          onChange: (e) => setRoleColor(e.target.value),
          title: "Select role color"
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 27,
          columnNumber: 17
        }
      ),
      /* @__PURE__ */ jsxDEV("button", { type: "submit", className: "btn btn-primary", children: [
        /* @__PURE__ */ jsxDEV("i", { className: "fas fa-plus" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 33,
          columnNumber: 67
        }),
        " Create Role"
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 33,
        columnNumber: 17
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 19,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "role-list", children: roles.length > 0 ? roles.map((role) => /* @__PURE__ */ jsxDEV("div", { className: "role-item", children: [
      /* @__PURE__ */ jsxDEV("span", { className: "role-tag", style: { backgroundColor: role.color }, children: role.name }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 38,
        columnNumber: 25
      }),
      /* @__PURE__ */ jsxDEV("button", { onClick: () => onAction("delete", { id: role.id }), className: "btn-delete-role", children: /* @__PURE__ */ jsxDEV("i", { className: "fas fa-trash-alt" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 40,
        columnNumber: 29
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 39,
        columnNumber: 25
      })
    ] }, role.id, true, {
      fileName: "<stdin>",
      lineNumber: 37,
      columnNumber: 21
    })) : /* @__PURE__ */ jsxDEV("p", { children: "No roles created yet." }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 43,
      columnNumber: 22
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 35,
      columnNumber: 13
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 17,
    columnNumber: 9
  });
};
var stdin_default = RoleManagementSection;
export {
  stdin_default as default
};
