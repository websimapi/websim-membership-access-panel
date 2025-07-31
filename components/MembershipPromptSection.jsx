import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { getMembershipDurationString } from "../utils.js";
const MembershipPromptSection = ({ settings }) => {
  const handleBecomeMember = async () => {
    if (!settings || !settings.price) {
      console.error("Settings not available to create membership tip.");
      return;
    }
    const message = `Tipping ${settings.price} credits for membership!`;
    const result = await window.websim.postComment({ content: message });
    if (result.error) {
      console.error("Could not open comment dialog:", result.error);
    }
  };
  if (!settings) {
    return /* @__PURE__ */ jsxDEV("div", { className: "membership-prompt-section", children: [
      /* @__PURE__ */ jsxDEV("i", { className: "fas fa-info-circle icon" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 21,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("h3", { children: "Membership Not Available" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 22,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("p", { children: "The creator has not set up memberships for this project yet. Check back later!" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 23,
        columnNumber: 17
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 20,
      columnNumber: 13
    });
  }
  const { price, pricingModel } = settings;
  const durationString = getMembershipDurationString(pricingModel);
  return /* @__PURE__ */ jsxDEV("div", { className: "membership-prompt-section", children: [
    /* @__PURE__ */ jsxDEV("i", { className: "fas fa-star icon" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 33,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("h3", { children: "Become a Member!" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 34,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("p", { children: "Support the creator by becoming a member." }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 35,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "offer", children: [
      "Tip ",
      /* @__PURE__ */ jsxDEV("strong", { children: [
        price,
        " credits"
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 37,
        columnNumber: 21
      }),
      " ",
      durationString,
      "."
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 36,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("button", { className: "btn btn-primary btn-lg", onClick: handleBecomeMember, children: [
      /* @__PURE__ */ jsxDEV("i", { className: "fas fa-comment-dollar" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 40,
        columnNumber: 17
      }),
      " Become a Member"
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 39,
      columnNumber: 13
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 32,
    columnNumber: 9
  });
};
var stdin_default = MembershipPromptSection;
export {
  stdin_default as default
};
