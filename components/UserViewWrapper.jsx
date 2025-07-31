import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useMemo } from "react";
import MemberDashboard from "./MemberDashboard.jsx";
import MembershipPromptSection from "./MembershipPromptSection.jsx";
const UserViewWrapper = ({ isCreator, currentUser, viewMode, members, settings, roles, setViewMode }) => {
  const UserView = () => {
    const currentUserMembership = useMemo(() => {
      if (isCreator && viewMode === "unpaid") {
        return null;
      }
      const member = members.find((m) => m.user.id === currentUser?.id);
      if (!member) return null;
      if (settings?.rolesEnabled && !member.role && settings.defaultRoleId) {
        const defaultRole = roles.find((r) => r.id === settings.defaultRoleId);
        return { ...member, role: defaultRole };
      }
      return member;
    }, [members, currentUser, isCreator, viewMode, settings, roles]);
    if (currentUserMembership) {
      return /* @__PURE__ */ jsxDEV(MemberDashboard, { member: currentUserMembership, settings }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 23,
        columnNumber: 20
      });
    }
    return /* @__PURE__ */ jsxDEV(MembershipPromptSection, { settings }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 26,
      columnNumber: 16
    });
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "user-view-wrapper", children: [
    isCreator && /* @__PURE__ */ jsxDEV("div", { className: "view-toggle-banner", children: [
      /* @__PURE__ */ jsxDEV("p", { children: [
        /* @__PURE__ */ jsxDEV("i", { className: "fas fa-info-circle" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 34,
          columnNumber: 25
        }),
        viewMode === "member" ? "You are viewing the page as a member." : "You are viewing as an unpaid user."
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 33,
        columnNumber: 21
      }),
      /* @__PURE__ */ jsxDEV("button", { className: "btn btn-secondary", onClick: () => setViewMode("admin"), children: [
        /* @__PURE__ */ jsxDEV("i", { className: "fas fa-user-shield" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 41,
          columnNumber: 25
        }),
        " Switch to Admin View"
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 40,
        columnNumber: 21
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 32,
      columnNumber: 17
    }),
    /* @__PURE__ */ jsxDEV(UserView, {}, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 45,
      columnNumber: 13
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 30,
    columnNumber: 9
  });
};
var stdin_default = UserViewWrapper;
export {
  stdin_default as default
};
