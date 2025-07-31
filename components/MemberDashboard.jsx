import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { getMembershipDurationString } from "../utils.js";
const { useMemo } = React;
const MemberDashboard = ({ member, settings }) => {
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
  const endDateString = membershipEndDate ? membershipEndDate.toLocaleDateString(void 0, { year: "numeric", month: "long", day: "numeric" }) : "N/A";
  const handleExtendMembership = async () => {
    const message = `Tipping ${settings.price} credits to extend membership!`;
    const result = await window.websim.postComment({ content: message });
    if (result.error) {
      console.error("Could not open comment dialog:", result.error);
    }
  };
  const durationString = settings ? getMembershipDurationString(settings.pricingModel) : "";
  return /* @__PURE__ */ jsxDEV("div", { className: "member-dashboard", children: [
    /* @__PURE__ */ jsxDEV("header", { className: "member-dashboard-header", children: [
      /* @__PURE__ */ jsxDEV("img", { src: `https://images.websim.com/avatar/${user.username}`, alt: user.username }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 33,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("h2", { children: [
        /* @__PURE__ */ jsxDEV("span", { children: "Welcome back," }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 34,
          columnNumber: 21
        }),
        " @",
        user.username,
        "!"
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 34,
        columnNumber: 17
      }),
      role && /* @__PURE__ */ jsxDEV("span", { className: "role-tag", style: { backgroundColor: role.color, marginLeft: "15px" }, children: role.name }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 36,
        columnNumber: 21
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 32,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("main", { className: "main-content", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "member-stats", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "stat-card", children: [
          /* @__PURE__ */ jsxDEV("i", { className: "fas fa-coins icon" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 42,
            columnNumber: 25
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "stat-card-info", children: [
            /* @__PURE__ */ jsxDEV("h4", { children: "Total Paid" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 44,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("p", { children: [
              totalPaid,
              " credits"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 45,
              columnNumber: 29
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 43,
            columnNumber: 25
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 41,
          columnNumber: 21
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "stat-card", children: [
          /* @__PURE__ */ jsxDEV("i", { className: "fas fa-calendar-check icon" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 49,
            columnNumber: 26
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "stat-card-info", children: [
            /* @__PURE__ */ jsxDEV("h4", { children: "Membership Ends" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 51,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("p", { children: endDateString }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 52,
              columnNumber: 29
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 50,
            columnNumber: 25
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 48,
          columnNumber: 21
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "stat-card", children: [
          /* @__PURE__ */ jsxDEV("i", { className: "fas fa-info-circle icon" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 56,
            columnNumber: 26
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "stat-card-info", children: [
            /* @__PURE__ */ jsxDEV("h4", { children: "Status" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 58,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("p", { children: /* @__PURE__ */ jsxDEV("span", { className: `status-badge ${getStatusClass()}`, children: status }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 59,
              columnNumber: 32
            }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 59,
              columnNumber: 29
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 57,
            columnNumber: 25
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 55,
          columnNumber: 22
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 40,
        columnNumber: 18
      }),
      settings && /* @__PURE__ */ jsxDEV("div", { className: "extend-membership-section", children: [
        /* @__PURE__ */ jsxDEV("h3", { children: "Extend Your Membership" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 66,
          columnNumber: 25
        }),
        /* @__PURE__ */ jsxDEV("p", { children: "Continue supporting the creator and keep your benefits." }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 67,
          columnNumber: 26
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "offer", children: [
          "Tip ",
          /* @__PURE__ */ jsxDEV("strong", { children: [
            settings.price,
            " credits"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 69,
            columnNumber: 33
          }),
          " ",
          durationString,
          "."
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 68,
          columnNumber: 25
        }),
        /* @__PURE__ */ jsxDEV("div", { children: /* @__PURE__ */ jsxDEV("button", { className: "btn btn-primary btn-lg", onClick: handleExtendMembership, children: [
          /* @__PURE__ */ jsxDEV("i", { className: "fas fa-comment-dollar" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 73,
            columnNumber: 32
          }),
          " Extend Now"
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 72,
          columnNumber: 29
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 71,
          columnNumber: 25
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 65,
        columnNumber: 21
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 39,
      columnNumber: 13
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 31,
    columnNumber: 9
  });
};
var stdin_default = MemberDashboard;
export {
  stdin_default as default
};
