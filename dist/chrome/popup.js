"use strict";
var ext = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/common/src/index.ts
  var index_exports = {};
  __export(index_exports, {
    generateEmailAlias: () => generateEmailAlias,
    getDomain: () => getDomain,
    getToken: () => getToken,
    saveDomain: () => saveDomain,
    saveToken: () => saveToken
  });
  var import_email_alias_core = __require("email-alias-core");
  var EMAIL_ALIAS_TOKEN_KEY = "email-alias-token";
  var DOMAIN_KEY = "email-alias-domain";
  async function storeToken(token) {
    await browser.storage.local.set({ [EMAIL_ALIAS_TOKEN_KEY]: token });
  }
  async function getToken() {
    const result = await browser.storage.local.get(EMAIL_ALIAS_TOKEN_KEY);
    return result[EMAIL_ALIAS_TOKEN_KEY] || null;
  }
  async function storeDomain(domain) {
    await browser.storage.local.set({ [DOMAIN_KEY]: domain });
  }
  async function getDomain() {
    const result = await browser.storage.local.get(DOMAIN_KEY);
    return result[DOMAIN_KEY] || null;
  }
  async function generateEmailAlias(prefix) {
    const token = await getToken();
    const domain = await getDomain();
    if (!token) {
      throw new Error(
        "Authentication token is not set. Please configure it in the extension settings."
      );
    }
    if (!domain) {
      throw new Error(
        "Domain is not set. Please configure it in the extension settings."
      );
    }
    const alias = await (0, import_email_alias_core.generateEmailAlias)({
      secretKey: token,
      aliasParts: [prefix],
      domain
    });
    return alias;
  }
  async function saveToken(token) {
    if (!token || token.trim().length === 0) {
      throw new Error("Token cannot be empty.");
    }
    await storeToken(token);
  }
  async function saveDomain(domain) {
    if (!domain || domain.trim().length === 0) {
      throw new Error("Domain cannot be empty.");
    }
    await storeDomain(domain);
  }
  return __toCommonJS(index_exports);
})();

// packages/common/src/popup.ts
function initializePopup() {
  const prefixInput = document.getElementById("prefix");
  const generateBtn = document.getElementById(
    "generate-btn"
  );
  const resultContainer = document.getElementById(
    "result-container"
  );
  const aliasResult = document.getElementById("alias-result");
  const copyBtn = document.getElementById("copy-btn");
  const tokenInput = document.getElementById("token");
  const saveTokenBtn = document.getElementById(
    "save-token-btn"
  );
  const statusDiv = document.getElementById("status");
  const core = window.ext;
  if (!core || !core.generateEmailAlias || !core.saveToken) {
    displayStatus(
      "Error: Core logic is missing. The extension might be broken.",
      true
    );
    if (prefixInput) prefixInput.disabled = true;
    if (generateBtn) generateBtn.disabled = true;
    if (tokenInput) tokenInput.disabled = true;
    if (saveTokenBtn) saveTokenBtn.disabled = true;
    return;
  }
  generateBtn.addEventListener("click", async () => {
    clearStatus();
    const prefix = prefixInput.value.trim();
    if (!prefix) {
      displayStatus("Prefix cannot be empty.", true);
      return;
    }
    try {
      const alias = await core.generateEmailAlias(prefix);
      aliasResult.textContent = alias;
      resultContainer.style.display = "block";
      copyBtn.textContent = "Copy";
    } catch (error) {
      displayStatus(
        error instanceof Error ? error.message : String(error),
        true
      );
      resultContainer.style.display = "none";
    }
  });
  saveTokenBtn.addEventListener("click", async () => {
    clearStatus();
    const token = tokenInput.value;
    try {
      await core.saveToken(token);
      displayStatus("Token saved successfully!", false);
      tokenInput.value = "";
    } catch (error) {
      displayStatus(
        error instanceof Error ? error.message : String(error),
        true
      );
    }
  });
  copyBtn.addEventListener("click", () => {
    const alias = aliasResult.textContent;
    if (alias) {
      navigator.clipboard.writeText(alias).then(() => {
        copyBtn.textContent = "Copied!";
      }).catch((err) => {
        displayStatus("Failed to copy to clipboard.", true);
        console.error("Clipboard error:", err);
      });
    }
  });
  function displayStatus(message, isError = false) {
    statusDiv.textContent = message;
    statusDiv.className = isError ? "error" : "success";
  }
  function clearStatus() {
    statusDiv.textContent = "";
    statusDiv.className = "";
  }
}
document.addEventListener("DOMContentLoaded", initializePopup);
export {
  initializePopup
};
