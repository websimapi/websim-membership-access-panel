import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { useMembershipData } from "./hooks/useMembershipData.js";
import AdminView from "./components/AdminView.jsx";
import UserViewWrapper from "./components/UserViewWrapper.jsx";
const App = () => {
  const {
    loading,
    error,
    isCreator,
    currentUser,
    settings,
    roles,
    members,
    handleSaveSettings,
    handleRoleAction
  } = useMembershipData();
  const [viewMode, setViewMode] = useState("admin");
  if (loading) {
    return /* @__PURE__ */ jsxDEV("div", { className: "loading-container", children: [
      /* @__PURE__ */ jsxDEV("i", { className: "fas fa-spinner fa-spin" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 25,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("p", { children: "Loading Membership Panel..." }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 26,
        columnNumber: 17
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 24,
      columnNumber: 13
    });
  }
  if (error) {
    return /* @__PURE__ */ jsxDEV("div", { className: "error-container", children: [
      /* @__PURE__ */ jsxDEV("i", { className: "fas fa-exclamation-triangle" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 34,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("p", { children: [
        "Error: ",
        error
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 35,
        columnNumber: 17
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 33,
      columnNumber: 13
    });
  }
  if (isCreator && viewMode === "admin") {
    return /* @__PURE__ */ jsxDEV(
      AdminView,
      {
        settings,
        roles,
        members,
        onSaveSettings: handleSaveSettings,
        onRoleAction: handleRoleAction,
        setViewMode
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 42,
        columnNumber: 13
      }
    );
  }
  return /* @__PURE__ */ jsxDEV(
    UserViewWrapper,
    {
      isCreator,
      currentUser,
      viewMode,
      members,
      settings,
      roles,
      setViewMode
    },
    void 0,
    false,
    {
      fileName: "<stdin>",
      lineNumber: 54,
      columnNumber: 9
    }
  );
};
const root = createRoot(document.getElementById("root"));
root.render(/* @__PURE__ */ jsxDEV(App, {}, void 0, false, {
  fileName: "<stdin>",
  lineNumber: 67,
  columnNumber: 13
}));
