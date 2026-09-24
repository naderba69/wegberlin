import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AccessibleDialog } from "@/components/accessible-dialog";

function DialogHarness() {
  const [open, setOpen] = useState(false);
  return React.createElement(React.Fragment, null,
    React.createElement("button", { onClick: () => setOpen(true) }, "افتح الحوار"),
    open ? React.createElement(AccessibleDialog, { labelledBy: "dialog-title", onClose: () => setOpen(false) },
      React.createElement("h2", { id: "dialog-title" }, "تأكيد"),
      React.createElement("div", null,
        React.createElement("button", { onClick: () => setOpen(false) }, "إلغاء"),
        React.createElement("button", null, "تنفيذ"),
      ),
    ) : null,
  );
}

describe("accessible destructive dialogs", () => {
  it("moves focus inside, closes with Escape, and restores the trigger", () => {
    render(React.createElement(DialogHarness));
    const trigger = screen.getByRole("button", { name: "افتح الحوار" });
    trigger.focus();
    fireEvent.click(trigger);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "إلغاء" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("traps forward and backward Tab movement inside the modal", () => {
    render(React.createElement(DialogHarness));
    fireEvent.click(screen.getByRole("button", { name: "افتح الحوار" }));
    const first = screen.getByRole("button", { name: "إلغاء" });
    const last = screen.getByRole("button", { name: "تنفيذ" });
    last.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(first);
    first.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
  });
});
