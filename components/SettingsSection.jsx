import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
const { useState, useEffect } = React;
const SettingsSection = ({ settings, roles, onSave }) => {
  const [price, setPrice] = useState(100);
  const [model, setModel] = useState("monthly");
  const [rolesEnabled, setRolesEnabled] = useState(false);
  const [defaultRoleId, setDefaultRoleId] = useState("");
  useEffect(() => {
    if (settings) {
      setPrice(settings.price || 100);
      setModel(settings.pricingModel || "monthly");
      setRolesEnabled(settings.rolesEnabled || false);
      setDefaultRoleId(settings.defaultRoleId || "");
    }
  }, [settings]);
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      price: parseInt(price, 10),
      pricingModel: model,
      rolesEnabled,
      defaultRoleId
    });
  };
  return /* @__PURE__ */ jsxDEV("section", { className: "settings-section", children: [
    /* @__PURE__ */ jsxDEV("h2", { children: [
      /* @__PURE__ */ jsxDEV("i", { className: "fas fa-cogs" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 32,
        columnNumber: 17
      }),
      " Membership Settings"
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 32,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("form", { onSubmit: handleSubmit, className: "settings-form", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
        /* @__PURE__ */ jsxDEV("label", { htmlFor: "pricingModel", children: "Pricing Model" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 35,
          columnNumber: 21
        }),
        /* @__PURE__ */ jsxDEV("select", { id: "pricingModel", value: model, onChange: (e) => setModel(e.target.value), children: [
          /* @__PURE__ */ jsxDEV("option", { value: "daily", children: "Daily" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 37,
            columnNumber: 25
          }),
          /* @__PURE__ */ jsxDEV("option", { value: "weekly", children: "Weekly" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 38,
            columnNumber: 25
          }),
          /* @__PURE__ */ jsxDEV("option", { value: "bi-weekly", children: "Bi-Weekly" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 39,
            columnNumber: 25
          }),
          /* @__PURE__ */ jsxDEV("option", { value: "monthly", children: "Monthly" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 40,
            columnNumber: 25
          }),
          /* @__PURE__ */ jsxDEV("option", { value: "one-day", children: "One-Day Pass" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 41,
            columnNumber: 25
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 36,
          columnNumber: 21
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 34,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
        /* @__PURE__ */ jsxDEV("label", { htmlFor: "price", children: "Price (Credits)" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 45,
          columnNumber: 21
        }),
        /* @__PURE__ */ jsxDEV("input", { type: "number", id: "price", value: price, onChange: (e) => setPrice(e.target.value), min: "1" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 46,
          columnNumber: 21
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 44,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "form-group form-group-toggle", children: [
        /* @__PURE__ */ jsxDEV("label", { htmlFor: "rolesEnabled", children: "Enable Roles" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 49,
          columnNumber: 21
        }),
        /* @__PURE__ */ jsxDEV("label", { className: "switch", children: [
          /* @__PURE__ */ jsxDEV("input", { type: "checkbox", id: "rolesEnabled", checked: rolesEnabled, onChange: (e) => setRolesEnabled(e.target.checked) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 51,
            columnNumber: 25
          }),
          /* @__PURE__ */ jsxDEV("span", { className: "slider round" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 52,
            columnNumber: 25
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 50,
          columnNumber: 21
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 48,
        columnNumber: 17
      }),
      rolesEnabled && /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
        /* @__PURE__ */ jsxDEV("label", { htmlFor: "defaultRole", children: "Default Role for New Members" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 57,
          columnNumber: 25
        }),
        /* @__PURE__ */ jsxDEV("select", { id: "defaultRole", value: defaultRoleId, onChange: (e) => setDefaultRoleId(e.target.value), children: [
          /* @__PURE__ */ jsxDEV("option", { value: "", children: "None" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 59,
            columnNumber: 29
          }),
          roles.map((role) => /* @__PURE__ */ jsxDEV("option", { value: role.id, children: role.name }, role.id, false, {
            fileName: "<stdin>",
            lineNumber: 61,
            columnNumber: 33
          }))
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 58,
          columnNumber: 25
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 56,
        columnNumber: 22
      }),
      /* @__PURE__ */ jsxDEV("button", { type: "submit", className: "btn btn-primary", children: [
        /* @__PURE__ */ jsxDEV("i", { className: "fas fa-save" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 66,
          columnNumber: 67
        }),
        " Save Settings"
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 66,
        columnNumber: 17
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 33,
      columnNumber: 13
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 31,
    columnNumber: 9
  });
};
var stdin_default = SettingsSection;
export {
  stdin_default as default
};
