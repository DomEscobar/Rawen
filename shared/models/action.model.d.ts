export interface ActionModel {
    id: string;
    type: ActionType;
}
export interface JsScripActionModel extends ActionModel {
    name: string;
}
export interface DefaultLLMActionModel extends ActionModel {
    endpointId?: string;
}
export interface LmmRequestActionModel extends ActionModel {
    endpointId?: string;
    promptFormat?: string | undefined | DefaultActions;
}
export interface VectorRequestActionModel extends ActionModel {
    endpointId?: string | DefaultActions;
    promptFormat?: string;
}
export type ActionType = "DefaultLLM" | "LmmWebsearch" | "LmmSummarize" | "LmmRequest" | "LmmDocsRequest" | "VectorRequest" | "CallJsScript" | DynamicActionType;
export interface DynamicActionType {
    id: string;
    name: string;
    code: string;
    editableFields: EditableFields[];
}
export interface EditableFields {
    id: string;
    name: string;
    options?: string[];
    type: "Checkbox" | "Text" | "Number" | "Dropdown";
    value?: any;
    defaultValue?: any;
}
export declare enum DefaultActions {
    Chat = "Chat"
}
export declare const DynamicActionTypes: DynamicActionType[];
