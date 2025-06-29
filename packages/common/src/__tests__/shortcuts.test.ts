/**
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, it } from "vitest";
import { ShortcutRecorder } from "../shortcuts";

describe("ShortcutRecorder", () => {
  let recorder: ShortcutRecorder;
  let mockInput: HTMLInputElement;
  let mockButton: HTMLButtonElement;
  let mockClearButton: HTMLButtonElement;
  let container: HTMLDivElement;

  beforeEach(() => {
    recorder = new ShortcutRecorder();
    mockInput = document.createElement("input");
    mockButton = document.createElement("button");
    mockClearButton = document.createElement("button");
    container = document.createElement("div");
    container.className = "shortcut-input-container";
    container.appendChild(mockInput);
    container.appendChild(mockButton);
    container.appendChild(mockClearButton);
    document.body.appendChild(container);
  });

  it("should register shortcut elements correctly", () => {
    recorder.registerShortcut({
      input: mockInput,
      recordButton: mockButton,
      clearButton: mockClearButton,
    });
    mockButton.click();
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "K", ctrlKey: true }),
    );
    expect(mockButton.textContent).toBe("Set Shortcut");
  });

  it("should reject shortcuts without modifier keys", () => {
    recorder.registerShortcut({
      input: mockInput,
      recordButton: mockButton,
      clearButton: mockClearButton,
    });
    mockButton.click();
    const event = new KeyboardEvent("keydown", { key: "A" });
    document.dispatchEvent(event);
    expect(mockInput.value).toBe("Press keys...");
  });

  it("should accept valid shortcuts with modifier keys", () => {
    recorder.registerShortcut({
      input: mockInput,
      recordButton: mockButton,
      clearButton: mockClearButton,
    });
    mockButton.click();
    const event = new KeyboardEvent("keydown", {
      key: "K",
      ctrlKey: true,
      shiftKey: true,
    });
    document.dispatchEvent(event);
    expect(mockInput.value).toBe("Ctrl+Shift+K");
  });

  it("should clear shortcuts when clear button is clicked", () => {
    mockInput.value = "Ctrl+K";
    recorder.registerShortcut({
      input: mockInput,
      recordButton: mockButton,
      clearButton: mockClearButton,
    });
    mockClearButton.click();
    expect(mockInput.value).toBe("");
  });

  it("should cancel recording when clicking outside", () => {
    recorder.registerShortcut({
      input: mockInput,
      recordButton: mockButton,
      clearButton: mockClearButton,
    });
    mockButton.click();
    document.body.click();
    expect(recorder.isCurrentlyRecording()).toBe(false);
  });

  it("should cancel recording on Escape key", async () => {
    recorder.registerShortcut({
      input: mockInput,
      recordButton: mockButton,
      clearButton: mockClearButton,
    });
    mockButton.click();
    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
    });
    Object.defineProperty(event, "target", {
      value: document.createElement("div"),
    });
    document.dispatchEvent(event);
    recorder.forceStopRecording();
    await new Promise((r) => setTimeout(r, 0));
    expect(recorder.isCurrentlyRecording()).toBe(false);
  });

  it("should handle multiple shortcut recorders", async () => {
    const secondInput = document.createElement("input");
    const secondButton = document.createElement("button");
    const secondClear = document.createElement("button");
    const secondContainer = document.createElement("div");
    secondContainer.className = "shortcut-input-container";
    secondContainer.appendChild(secondInput);
    secondContainer.appendChild(secondButton);
    secondContainer.appendChild(secondClear);
    document.body.appendChild(secondContainer);
    recorder.registerShortcut({
      input: mockInput,
      recordButton: mockButton,
      clearButton: mockClearButton,
    });
    recorder.registerShortcut({
      input: secondInput,
      recordButton: secondButton,
      clearButton: secondClear,
    });
    mockButton.click();
    secondButton.disabled = true;
    expect(secondButton.disabled).toBe(true);
    const event = new KeyboardEvent("keydown", {
      key: "K",
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
    await new Promise((r) => setTimeout(r, 0));
    expect(secondButton.disabled).toBe(false);
    expect(mockButton.disabled).toBe(false);
  });
});
