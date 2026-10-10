import { isDesktop } from "./notify";

/** Open a save dialog and write `text` there. Returns the path, or null. */
export async function exportToFile(text: string): Promise<string | null> {
  const stamp = new Date().toISOString().slice(0, 10);
  if (!isDesktop()) {
    // Browser fallback: trigger a download.
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tulip-tasks-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return a.download;
  }
  try {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeTextFile } = await import("@tauri-apps/plugin-fs");
    const path = await save({
      title: "Export Tulip Tasks workspace",
      defaultPath: `tulip-tasks-${stamp}.json`,
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (!path) return null;
    await writeTextFile(path, text);
    return path;
  } catch {
    return null;
  }
}

/** Open a file dialog and return the file's text, or null. */
export async function importFromFile(): Promise<string | null> {
  if (!isDesktop()) {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json,.json";
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return resolve(null);
        file.text().then(resolve, () => resolve(null));
      };
      input.click();
    });
  }
  try {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const { readTextFile } = await import("@tauri-apps/plugin-fs");
    const picked = await open({
      title: "Import Tulip Tasks workspace",
      multiple: false,
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (!picked || typeof picked !== "string") return null;
    return await readTextFile(picked);
  } catch {
    return null;
  }
}
