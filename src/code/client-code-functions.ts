import { LlmApi } from "@/api/llm.api";
import EasySpeech from "@/lib/easy-speech";
import { ipcRenderer } from "electron";
import { KeyValueSetting } from "../../shared/models/app-state.model";
import { CodeApi } from "@/api/code.api";
import {
  addInteractionContentR,
  addNewInteractionIfNotExists,
  assignStreamedToLastInteraction,
  isStreamActive,
  startStreamer,
} from "@/lib/interaction-manager";
import { getConvoId, saveStateElectron } from "@/lib/utils";
import { pushStreamOutput } from "@/modules/interaction/interaction";
import { appState, changeState } from "@/state/app.state";
import { ElectronIpcEvent } from "../../shared/models/electron-ipc-events";
import {
  AiKeyValueSetting,
  DefaultLlmSetting,
} from "shared/models/settings.model";
import { InteractionState } from "@/lib/interaction-state";

export class CodeFunctions {
  static input: any;
  static sources: any;
  static actionState: any;

  static setCodeParams(input: any, sources: any, actionState: any) {
    CodeFunctions.input = input;
    CodeFunctions.sources = sources;
    CodeFunctions.actionState = actionState;
  }

  static async execElectron(code) {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await ipcRenderer.invoke(
          ElectronIpcEvent.ELECTRON_CODE_EXEC,
          code
        );
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  }

  static async execNode(code) {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await CodeApi.exec(code, {
          input: CodeFunctions.input,
          sources: CodeFunctions.sources,
          actionState: CodeFunctions.actionState,
        });
        resolve(res);
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  static async waitUntilMarked(): Promise<any> {
    const result: any = await CodeFunctions.execElectron(`
                return defineArea();
        `);
    result.fileBuffer = Buffer.from(JSON.parse(result.fileBuffer));
    return result;
  }

  static async callRag(prompt: string, llmSetting: KeyValueSetting, docs: any) {
    const result = await LlmApi.reqRag(prompt, llmSetting, docs, true);
    return result;
  }

  static async classifyText(
    text: string,
    labels: string[],
    model?: string
  ): Promise<{ labels: string[]; scores: number[] }> {
    return (await CodeFunctions.execNode(`
            return classifyText("${text}", ${JSON.stringify(
      labels
    )}, "${model}");
        `)) as any;
  }

  static async classifyImage(
    img: string,
    labels: string[],
    model?: string
  ): Promise<{ labels: string[]; scores: number[] }> {
    return (await CodeFunctions.execNode(`
            return classifyImage("${img}", ${JSON.stringify(
      labels
    )}, "${model}");
        `)) as any;
  }

  static async extractTextFromImage(
    img: Buffer,
    langs: string = "eng"
  ): Promise<{ text: string; words: any[] }> {
    const res = await CodeFunctions.execNode(`
            return await extractTextFromImage('${JSON.stringify(
              img
            )}', '${langs}');
        `);

    if (!res) return null;

    return JSON.parse((res as any)?.result); //TODO lol
  }

  static addResult(content: string, options = null) {
    addInteractionContentR(content, getConvoId(), options);
  }

  static pushContentToStream(content: string) {
    addNewInteractionIfNotExists(getConvoId());
    pushStreamOutput(content);
  }

  static replaceContentStream(token, replaceText) {
    pushStreamOutput(token, replaceText);
  }

  static async startStream() {
    startStreamer(getConvoId());
    await new Promise((r) => setTimeout(r, 50));
  }

  static endStream() {
    assignStreamedToLastInteraction(getConvoId());
  }

  static async speak(text: string) {
    const voice = EasySpeech.voices()[6];
    await EasySpeech.speak({
      text,
      voice,
      pitch: 0.1,
      rate: 1.9,
      volume: 0.8,
    });
  }

  static async fakeStreamText(text: string) {
    const chars = text.split(" ");
    for (let i = 0; i < chars.length; i++) {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * 60 + 20)
      );
      this.pushContentToStream(chars[i] + " ");
    }

    this.pushContentToStream("<br>");
  }

  static getKeyValues() {
    return appState.keyValues?.settings;
  }

  static getAiSettings(id: string | DefaultLlmSetting): AiKeyValueSetting {
    const settings = this.getKeyValues();
    const aiSettings = settings.find((s) => s.id === id);
    return aiSettings;
  }

  static getAiApiKey(id: string | DefaultLlmSetting): string {
    const settings = this.getAiSettings(id);
    return settings.values.ApiKey;
  }

  static isStreaming() {
    return isStreamActive();
  }

  static waitForInput(): Promise<string> {
    return new Promise(async (resolve) => {
      InteractionState.waitForNextInput((text) => {
        resolve(text);
      });
    });
  }

  static async displayCursorContent(content, encoded = false) {
    await this.execElectron(`
            displayCursorWindow(\`${content}\`, ${encoded});
        `);
  }

  static async hideCursorContent() {
    await CodeFunctions.execElectron(`
            hideCursorWindow();
        `);
  }

  static async getActiveWindow(): Promise<{
    title: string;
    bounds: any;
    path: string;
  }> {
    return (await CodeFunctions.execNode(`
            return getActiveWindow();
        `)) as any;
  }

  static async getPrimaryMonitor(): Promise<{
    scaleFactor: number;
    bounds: any;
  }> {
    return (await CodeFunctions.execNode(`
            return getPrimaryMonitor();
        `)) as any;
  }
}
