import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { createRoot } from "react-dom/client";
import { WebsimSocket } from "@websim/websim-socket";
import { calculateMembershipData } from "./utils.js";
import SettingsSection from "./components/SettingsSection.jsx";
import RoleManagementSection from "./components/RoleManagementSection.jsx";
import MembersSection from "./components/MembersSection.jsx";
import MemberDashboard from "./components/MemberDashboard.jsx";
import MembershipPromptSection from "./components/MembershipPromptSection.jsx";
const { useState, useEffect, useMemo, useCallback } = React;
const room = new WebsimSocket();
const SETTINGS_COLLECTION = "membership_settings_v1";
const ROLES_COLLECTION = "membership_roles_v1";
const ASSIGNMENTS_COLLECTION = "member_role_assignments_v1";
const App = () => {
  const [isCreator, setIsCreator] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState(null);
  const [roles, setRoles] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [tipComments, setTipComments] = useState([]);
  const [viewMode, setViewMode] = useState("admin");
  useEffect(() => {
    const initialize = async () => {
      try {
        const [creatorData, user, project] = await Promise.all([
          window.websim.getCreator(),
          window.websim.getCurrentUser(),
          window.websim.getCurrentProject()
        ]);
        setCreator(creatorData);
        setCurrentUser(user);
        const isUserCreator = user?.id === creatorData?.id;
        setIsCreator(isUserCreator);
        if (!isUserCreator) {
          setViewMode("member");
        }
        const creatorUsername = creatorData.username;
        const unsubscribers = [];
        unsubscribers.push(room.collection(SETTINGS_COLLECTION).filter({ username: creatorUsername }).subscribe((settingsRecords) => {
          const sortedSettings = settingsRecords.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          setSettings(sortedSettings[0] || null);
        }));
        unsubscribers.push(room.collection(ROLES_COLLECTION).filter({ username: creatorUsername }).subscribe(setRoles));
        unsubscribers.push(room.collection(ASSIGNMENTS_COLLECTION).filter({ username: creatorUsername }).subscribe(setAssignments));
        const response = await fetch(`/api/v1/projects/${project.id}/comments?only_tips=true&first=100`);
        if (!response.ok) throw new Error("Failed to fetch comments");
        const data = await response.json();
        const sortedComments = data.comments.data.map((c) => c.comment).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        setTipComments(sortedComments);
        const commentUnsubscribe = window.websim.addEventListener("comment:created", (eventData) => {
          const newComment = eventData.comment;
          if (newComment.card_data && newComment.card_data.type === "tip_comment") {
            setTipComments(
              (prevComments) => [...prevComments, newComment].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
            );
          }
        });
        unsubscribers.push(commentUnsubscribe);
        return () => unsubscribers.forEach((unsub) => unsub());
      } catch (err) {
        console.error("Initialization failed:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };
    const unsubscribePromise = initialize();
    return () => {
      unsubscribePromise.then((unsubscribe) => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, []);
  const handleSaveSettings = useCallback(async (newSettings) => {
    try {
      const list = await room.collection(SETTINGS_COLLECTION).filter({ username: creator.username }).getList();
      const existingSettings = list[0];
      if (existingSettings) {
        await room.collection(SETTINGS_COLLECTION).upsert({ ...existingSettings, ...newSettings });
      } else {
        await room.collection(SETTINGS_COLLECTION).create(newSettings);
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError("Could not save settings.");
    }
  }, [creator]);
  const handleRoleAction = useCallback(async (action, payload) => {
    try {
      switch (action) {
        case "create":
          await room.collection(ROLES_COLLECTION).create(payload);
          break;
        case "delete":
          await room.collection(ROLES_COLLECTION).delete(payload.id);
          const assignmentsToDelete = assignments.filter((a) => a.role_id === payload.id);
          for (const assignment of assignmentsToDelete) {
            await room.collection(ASSIGNMENTS_COLLECTION).delete(assignment.id);
          }
          break;
        case "assign":
          await room.collection(ASSIGNMENTS_COLLECTION).upsert({ id: payload.userId, role_id: payload.roleId });
          break;
        case "unassign":
          await room.collection(ASSIGNMENTS_COLLECTION).delete(payload.userId);
          break;
      }
    } catch (err) {
      console.error(`Role action '${action}' failed:`, err);
      setError(`Could not perform role action: ${action}.`);
    }
  }, [assignments]);
  const members = useMemo(() => {
    if (!settings || tipComments.length === 0) return [];
    const baseMembers = calculateMembershipData(tipComments, settings);
    return baseMembers.map((member) => {
      const assignment = assignments.find((a) => a.id === member.user.id);
      const role = assignment ? roles.find((r) => r.id === assignment.role_id) : null;
      return { ...member, role };
    }).sort((a, b) => (b.membershipEndDate || 0) - (a.membershipEndDate || 0));
  }, [tipComments, settings, roles, assignments]);
  if (loading) {
    return /* @__PURE__ */ jsxDEV("div", { className: "loading-container", children: [
      /* @__PURE__ */ jsxDEV("i", { className: "fas fa-spinner fa-spin" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 155,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("p", { children: "Loading Membership Panel..." }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 156,
        columnNumber: 17
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 154,
      columnNumber: 13
    });
  }
  if (error) {
    return /* @__PURE__ */ jsxDEV("div", { className: "error-container", children: [
      /* @__PURE__ */ jsxDEV("i", { className: "fas fa-exclamation-triangle" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 164,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("p", { children: [
        "Error: ",
        error
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 165,
        columnNumber: 17
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 163,
      columnNumber: 13
    });
  }
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
        lineNumber: 188,
        columnNumber: 20
      });
    }
    return /* @__PURE__ */ jsxDEV(MembershipPromptSection, { settings }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 191,
      columnNumber: 16
    });
  };
  if (isCreator && viewMode === "admin") {
    return /* @__PURE__ */ jsxDEV("div", { className: "admin-panel", children: [
      /* @__PURE__ */ jsxDEV("header", { children: [
        /* @__PURE__ */ jsxDEV("h1", { children: [
          /* @__PURE__ */ jsxDEV("i", { className: "fas fa-users-cog" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 198,
            columnNumber: 25
          }),
          " Membership Admin Panel"
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 198,
          columnNumber: 21
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "view-as-buttons", children: [
          /* @__PURE__ */ jsxDEV("button", { className: "btn btn-secondary view-toggle-btn", onClick: () => setViewMode("member"), children: [
            /* @__PURE__ */ jsxDEV("i", { className: "fas fa-user-check" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 201,
              columnNumber: 29
            }),
            " View as Member"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 200,
            columnNumber: 25
          }),
          /* @__PURE__ */ jsxDEV("button", { className: "btn btn-secondary view-toggle-btn", onClick: () => setViewMode("unpaid"), children: [
            /* @__PURE__ */ jsxDEV("i", { className: "fas fa-user" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 204,
              columnNumber: 29
            }),
            " View as Unpaid User"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 203,
            columnNumber: 25
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 199,
          columnNumber: 21
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 197,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("main", { className: "main-content", children: [
        /* @__PURE__ */ jsxDEV(SettingsSection, { settings, roles, onSave: handleSaveSettings }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 209,
          columnNumber: 21
        }),
        settings?.rolesEnabled && /* @__PURE__ */ jsxDEV(RoleManagementSection, { roles, onAction: handleRoleAction }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 211,
          columnNumber: 25
        }),
        /* @__PURE__ */ jsxDEV(MembersSection, { members, roles, onRoleAction: handleRoleAction, rolesEnabled: settings?.rolesEnabled }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 213,
          columnNumber: 21
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 208,
        columnNumber: 17
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 196,
      columnNumber: 13
    });
  }
  return /* @__PURE__ */ jsxDEV("div", { className: "user-view-wrapper", children: [
    isCreator && /* @__PURE__ */ jsxDEV("div", { className: "view-toggle-banner", children: [
      /* @__PURE__ */ jsxDEV("p", { children: [
        /* @__PURE__ */ jsxDEV("i", { className: "fas fa-info-circle" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 224,
          columnNumber: 25
        }),
        viewMode === "member" ? "You are viewing the page as a member." : "You are viewing as an unpaid user."
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 223,
        columnNumber: 21
      }),
      /* @__PURE__ */ jsxDEV("button", { className: "btn btn-secondary", onClick: () => setViewMode("admin"), children: [
        /* @__PURE__ */ jsxDEV("i", { className: "fas fa-user-shield" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 231,
          columnNumber: 25
        }),
        " Switch to Admin View"
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 230,
        columnNumber: 21
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 222,
      columnNumber: 17
    }),
    /* @__PURE__ */ jsxDEV(UserView, {}, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 235,
      columnNumber: 13
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 220,
    columnNumber: 9
  });
};
const root = createRoot(document.getElementById("root"));
root.render(/* @__PURE__ */ jsxDEV(App, {}, void 0, false, {
  fileName: "<stdin>",
  lineNumber: 242,
  columnNumber: 13
}));
