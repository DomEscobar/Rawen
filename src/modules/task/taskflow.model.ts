export interface MimicStore {
    id: string;
    description: string;
    events: EventStore[];
}

export const createNewEventStore = (index: number, partial?: EventStore): EventStore => {
    return {
        index,
        ...partial,
        keyboardText: "",
        explain: ""
    };
}

export const parseMimicStore = (mimicStore: MimicStore) => {
    const events = mimicStore.events.map((item) => {
        return {
            ...item,
            window_screenshot: item.window_screenshot ? Buffer.from(item.window_screenshot) : undefined,
            mouse_area_screenshot: item.mouse_area_screenshot ? Buffer.from(item.mouse_area_screenshot) : undefined,
            mouse_area_screenshot_small: item.mouse_area_screenshot_small ? Buffer.from(item.mouse_area_screenshot_small) : undefined,
            mouse_area_field: item.mouse_area_field ? Buffer.from(item.mouse_area_field) : undefined
        }
    });

    return {
        ...mimicStore,
        events
    }
}


export interface EventStore extends EventStoreAnalyzed {
    index: number;
    explain?: string;
    scaleFactor?: number;
    window_title?: string;
    window_screenshot: Buffer;
    window_bounds?: { x: number, y: number, width: number, height: number };

    mouse_position?: { x: number, y: number };

    app_path?: string;
    underlyingText?: string;
    mouse_area_screenshot: Buffer;
    mouse_area_screenshot_small: Buffer;
    mouse_area_field?: Buffer;

    // Predictions by AI about the event
    prediction?: PredictionStore;

    //next event trigger flags
    isKeyboardEnter?: boolean;
    isMouseClick?: boolean;
    isMouseDoubleClick?: boolean;
    isOpenApp?: boolean;

    isExit?: boolean;
    isBlacklisted?: boolean; // if the window is blacklisted to prevent events

    keyboardTextReason?: string; // reason why the keyboard text is entered
    keyboardText?: string;
    keyboardEvents?: string[]; // in case of press of key combination like ctrl + c or ctrl + v etc
    mouseEvents?: MouseClickData[];

    isSearch?: boolean; // search on the current window for sth
    elemtent_type?: string;
    element_description?: string;
}
export interface EventStoreAnalyzed {
    isUnclear?: boolean;
    isOptimized?: boolean;
    executeScript?: string;
}


interface PredictionStore {
    intention: string;
    isIcon: boolean;
    isInput: boolean;
    isButton: boolean;
    isLink: boolean;
    isCheckbox: boolean;
    isRadio: boolean;
    isSelect: boolean;
}

export interface MouseClickData {
    x: number;
    y: number;
    button: { LEFT: 1, RIGHT: 2, MIDDLE: 3 };
}