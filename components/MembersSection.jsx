import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
const MemberRow = ({ member, roles, onRoleAction, rolesEnabled }) => {
  const { user, totalPaid, membershipEndDate, status, role } = member;
  const getStatusClass = () => {
    switch (status) {
      case "Active":
        return "status-active";
      case "Lapsed":
        return "status-lapsed";
      case "Expiring Soon":
        return "status-warning";
      default:
        return "";
    }
  };
  const endDateString = membershipEndDate ? membershipEndDate.toLocaleDateString() : "N/A";
  const handleRoleChange = (e) => {
    const roleId = e.target.value;
    if (roleId) {
      onRoleAction("assign", { userId: user.id, roleId });
    } else {
      onRoleAction("unassign", { userId: user.id });
    }
  };
  return /* @__PURE__ */ jsxDEV("tr", { children: [
    /* @__PURE__ */ jsxDEV("td", { children: /* @__PURE__ */ jsxDEV("div", { className: "member-info", children: [
      /* @__PURE__ */ jsxDEV("img", { src: `https://images.websim.com/avatar/${user.username}`, alt: user.username }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 30,
        columnNumber: 21
      }),
      /* @__PURE__ */ jsxDEV("a", { href: `https://websim.com/@${user.username}`, target: "_blank", rel: "noopener noreferrer", children: [
        "@",
        user.username
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 31,
        columnNumber: 21
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 29,
      columnNumber: 17
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 28,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("td", { className: "credits-cell", children: totalPaid }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 36,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("td", { children: endDateString }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 37,
      columnNumber: 13
    }),
    rolesEnabled && /* @__PURE__ */ jsxDEV("td", { children: /* @__PURE__ */ jsxDEV("select", { className: "role-select", value: role?.id || "", onChange: handleRoleChange, children: [
      /* @__PURE__ */ jsxDEV("option", { value: "", children: "No Role" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 41,
        columnNumber: 25
      }),
      roles.map((r) => /* @__PURE__ */ jsxDEV("option", { value: r.id, children: r.name }, r.id, false, {
        fileName: "<stdin>",
        lineNumber: 43,
        columnNumber: 29
      }))
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 40,
      columnNumber: 21
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 39,
      columnNumber: 17
    }),
    /* @__PURE__ */ jsxDEV("td", { children: /* @__PURE__ */ jsxDEV("span", { className: `status-badge ${getStatusClass()}`, children: status }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 48,
      columnNumber: 17
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 48,
      columnNumber: 13
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 27,
    columnNumber: 9
  });
};
const MembersSection = ({ members, roles, onRoleAction, rolesEnabled }) => {
  if (members.length === 0) {
    return /* @__PURE__ */ jsxDEV("p", { children: "No members yet. Share your project and ask for tips to get started!" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 55,
      columnNumber: 16
    });
  }
  return /* @__PURE__ */ jsxDEV("section", { className: "members-section", children: [
    /* @__PURE__ */ jsxDEV("h2", { children: [
      /* @__PURE__ */ jsxDEV("i", { className: "fas fa-users" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 60,
        columnNumber: 17
      }),
      " Current Members"
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 60,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "table-container", children: /* @__PURE__ */ jsxDEV("table", { children: [
      /* @__PURE__ */ jsxDEV("thead", { children: /* @__PURE__ */ jsxDEV("tr", { children: [
        /* @__PURE__ */ jsxDEV("th", { children: "Member" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 65,
          columnNumber: 29
        }),
        /* @__PURE__ */ jsxDEV("th", { children: "Total Paid (Credits)" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 66,
          columnNumber: 29
        }),
        /* @__PURE__ */ jsxDEV("th", { children: "Membership Ends" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 67,
          columnNumber: 29
        }),
        rolesEnabled && /* @__PURE__ */ jsxDEV("th", { children: "Role" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 68,
          columnNumber: 46
        }),
        /* @__PURE__ */ jsxDEV("th", { children: "Status" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 69,
          columnNumber: 29
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 64,
        columnNumber: 25
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 63,
        columnNumber: 21
      }),
      /* @__PURE__ */ jsxDEV("tbody", { children: members.map((member) => /* @__PURE__ */ jsxDEV(MemberRow, { member, roles, onRoleAction, rolesEnabled }, member.user.id, false, {
        fileName: "<stdin>",
        lineNumber: 73,
        columnNumber: 48
      })) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 72,
        columnNumber: 21
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 62,
      columnNumber: 17
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 61,
      columnNumber: 13
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 59,
    columnNumber: 9
  });
};
var stdin_default = MembersSection;
export {
  stdin_default as default
};
