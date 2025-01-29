import { KeyValueSetting, KeyValueSettings } from "./app-state.model";
export interface SettingsModel {
    llmSettingId?: DefaultLlmSetting | string;
    keyValues?: KeyValueSettings;
    storeId?: string;
    metadata?: any;
}
export declare enum DefaultLlmSetting {
    OPENAI = "OPENAI",
    GOOGLE = "GOOGLE",
    OLLAMA = "OLLAMA"
}
export interface AiKeyValueSetting extends KeyValueSetting {
    values: OpenAiValues;
}
export interface OpenAiValues {
    ApiKey: string | undefined;
    Model: string | undefined;
}
