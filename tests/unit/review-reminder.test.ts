// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_QUIET_HOURS } from "@/core/coach/learning-agreement";
import { DEFAULT_REVIEW_REMINDER_SETTINGS, reviewReminderDecision } from "@/core/review/reminder";
import { defaultState } from "@/core/portability/db";
import { learningStateSchema } from "@/core/portability/schema";
import { mergeLearningStates } from "@/core/portability/merge";

const now=new Date("2026-09-12T17:30:00.000Z");
const settings={...DEFAULT_REVIEW_REMINDER_SETTINGS,enabled:true,hourLocal:"18:00",timeZone:"Africa/Tunis"};

describe("zero-cost local review reminder",()=>{
  it("waits for an enabled reminder, a due card, and the learner's local time",()=>{
    expect(reviewReminderDecision({settings:{...settings,enabled:false},quietHours:DEFAULT_QUIET_HOURS,dueCount:4,now,notificationSupported:true,notificationPermission:"granted"}).showInApp).toBe(false);
    expect(reviewReminderDecision({settings:{...settings,hourLocal:"19:00"},quietHours:DEFAULT_QUIET_HOURS,dueCount:4,now,notificationSupported:true,notificationPermission:"granted"}).reachedTime).toBe(false);
    expect(reviewReminderDecision({settings,quietHours:DEFAULT_QUIET_HOURS,dueCount:0,now,notificationSupported:true,notificationPermission:"granted"}).showInApp).toBe(false);
  });

  it("offers in-app and device reminders once the local threshold is reached",()=>{
    expect(reviewReminderDecision({settings,quietHours:DEFAULT_QUIET_HOURS,dueCount:7,now,notificationSupported:true,notificationPermission:"granted"})).toMatchObject({localDate:"2026-09-12",reachedTime:true,showInApp:true,sendDevice:true,dueCount:7});
  });

  it("respects zoned quiet hours and independent once-per-day delivery markers",()=>{
    const quietHours={...DEFAULT_QUIET_HOURS,enabled:true,startLocal:"18:00",endLocal:"19:00",timeZone:"Africa/Tunis"};
    expect(reviewReminderDecision({settings,quietHours,dueCount:7,now,notificationSupported:true,notificationPermission:"granted"})).toMatchObject({quiet:true,showInApp:false,sendDevice:false});
    const delivered={...settings,lastDeviceNotificationDate:"2026-09-12",dismissedInAppDate:"2026-09-12"};
    expect(reviewReminderDecision({settings:delivered,quietHours:DEFAULT_QUIET_HOURS,dueCount:7,now,notificationSupported:true,notificationPermission:"granted"})).toMatchObject({showInApp:false,sendDevice:false});
  });

  it("defaults old schema-v3 states and takes the newer reminder preference during merge",()=>{
    const old={...defaultState} as Record<string,unknown>;delete old.reviewReminderSettings;
    expect(learningStateSchema.parse(old).reviewReminderSettings).toEqual(DEFAULT_REVIEW_REMINDER_SETTINGS);
    const current={...defaultState,reviewReminderSettings:{...settings,enabled:false},updatedAt:"2026-09-12T10:00:00Z"};
    const incoming={...defaultState,reviewReminderSettings:settings,updatedAt:"2026-09-12T11:00:00Z"};
    expect(mergeLearningStates(current,incoming).reviewReminderSettings.enabled).toBe(true);
  });

  it("requests notification permission only after a user action and states the open-app boundary",()=>{
    const control=readFileSync("src/components/review-reminder-control.tsx","utf8");
    const coordinator=readFileSync("src/components/review-reminder-coordinator.tsx","utf8");
    expect(control).toContain("Notification.requestPermission()");
    expect(control).toContain("عندما تكون المنصة مفتوحة");
    expect(coordinator).toContain("new Notification");
    expect(coordinator).toContain("dismissedInAppDate");
    expect(coordinator).not.toContain("fetch(");
  });
});
