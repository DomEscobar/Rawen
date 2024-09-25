import { CodeFunctions } from "@/code/client-code-functions";
import { BaseVision } from "@/lib/llm/basic-llm-vision-chat";
import { MimicStore } from "@/modules/task/taskflow.model";
import { DefaultLlmSetting } from "../../shared/models/settings.model";
import { getLLMModel } from "../../shared/utils/llm-model";
import { drawMouseOverlay } from "./automation.utils";

const browsers = ["chrome", "firefox", "brave", "edge", "opera", "safari", "brave"];
const classfciations = ["select", "autosuggest", "button", "input", "checkbox", "radio", "link", "icon", "image", "navigation", "list"];

const template = `The User is doing several actions to achive the task: {{TASK}}.
You see a screenshot of a part of the desktop or active window now where he is doing a action to achive the task.
Action is - The user clicked now on an element which is the red dot on the screenshot response in very short sentence what he is doing and the type of element ${classfciations.join(",")}.

------------------------------------
For example : 
Current Path : "C/Explorer.exe". 
A: "You clicked on a browser icon element"

Current Path : "C/Chrome.exe". 
A: "You clicked on a email input element"

Current Path : "C/Chrome.exe". 
A: "You clicked on an checkbox element named 'with oil' "

Current Path : "C/Chrome.exe". 
A: "ou clicked on a dropdown element to select a country"

-----------------------------------
Current Path : "{{PATH}}"
A:`

const templateClassify = `Classify the text if it is one of these: {{CLASSIFICATION}}. If not sure respond with "Not sure"
Response only with the classification of the missing response, do explain or give more details.

Text: You clicked on a button to submit the form.
Response: clickable

Text: You clicked on a email input field.
Response: writeable

Text: {{TEXT}}
Response:`

const templateWriteText = `The user made serveral actions on a desktop to achive: TASK.
Based on that he entered a text on the current active window title. Response stuff short if that text was <Fixed> or <Dynamic> if this could be any other text.
Response with : 'Not sure if needed' if you dont know.

------------------------------------
EXAMPLES : 
Task: "Researching a coin."
Active Window Title: "Google Chrome"
Text: "coinmarketcap.com"
Response: "<Fixed> A known website to check the coin prices"

Task: "Searching for product". 
Active Window Title: "New Tab"
Text: "A230"
A: "<Dynamic> A product number"

Task: "Adding a new item to the order list" 
Active Window Title: "Desno App"
Text: "485erj"
A: "<?> Not sure what this is"
-----------------------------------
Task: "TASK"
Active Window: "WINDOW"
Text: TEXT
A: `
export const elementTypes = ["clickable", "writeable", "selectable"];

export async function classify(text: string, classifications: string[]) {
    const prompt = templateClassify.replace("{{CLASSIFICATION}}", classifications.join(", ")).replace("{{TEXT}}", text);
    const llmText = new BaseVision(getLLMModel(CodeFunctions.getAiSettings(DefaultLlmSetting.OPENAI)));

    const llmDescription = await llmText.call(prompt, {});

    if (llmDescription.includes("Not sure")) {
        return null;
    }

    return llmDescription as any;
}


export async function analyzeEvents(mimicStore: MimicStore) {
    const about = mimicStore.description;
    const events = mimicStore.events;

    CodeFunctions.fakeStreamText("<loading> <b class='ml-2'> Analyzing events... </b> <br>");


    const llmVision = new BaseVision(getLLMModel(CodeFunctions.getAiSettings(DefaultLlmSetting.OPENAI)));
    const llmText = new BaseVision(getLLMModel(CodeFunctions.getAiSettings(DefaultLlmSetting.OPENAI)));

    for (let i = 0; i < events.length; i++) {
        const event = events[i];

        console.log("Analyzing event", event);

        // check if event is a mouse click
        if (event.isMouseClick) {

            if (event.explain == null || event.explain == "") {
                const prompt = template
                    .replace("PATH", event.app_path).replace("TASK", mimicStore.description);

                // 1. Start the vision check
                const mouseDotBuffer = await drawMouseOverlay(event.window_screenshot, event.mouse_position.x, event.mouse_position.y); // displaying the mouse
                CodeFunctions.fakeStreamText(`<eye> <infoText> Checking this event </infoText>`);
                const llmDescription = await llmVision.call(prompt, { img: mouseDotBuffer });

                const classifyResult = await classify(llmDescription, elementTypes);
                event.elemtent_type = classifyResult;
                event.element_description = llmDescription;

                CodeFunctions.fakeStreamText("<arrow>" + llmDescription + "( " + classifyResult + " )");
            }

            // // check if open browser
            const nextEvent = events[i + 1];
            if (nextEvent && nextEvent.app_path != event.app_path) {

                if (browsers.some(browser => nextEvent.app_path.toLowerCase().includes(browser))) {
                    // next event check 
                    event.window_bounds = nextEvent.window_bounds;
                    event.window_title = nextEvent.window_title;
                    event.app_path = nextEvent.app_path;
                    event.isMouseClick = false;
                    event.isOptimized = true;
                    event.isOpenApp = true;

                    CodeFunctions.fakeStreamText("<cog>I will optimize this event by opening the browser directly.");
                }
            }
        }

        //check if event has an explainnation TODO
        if (event.explain && !event.isMouseClick) {
            // const classificaiton = await classifyText(event.explain, ["search", "summarize"]);

            event.isSearch = true;
            CodeFunctions.fakeStreamText("<search> " + event.explain);
        }

        // check if event is a keyboard event
        if (event.keyboardText && event.keyboardText.length > 0) {
            // const prompt = templateWriteText
            //     .replace("TASK", about)
            //     .replace("WINDOW", event.window_title)
            //     .replace("TEXT", event.keyboardText);

            // const llmDescription = await llmText.call(prompt);

            // if (llmDescription.includes("<Dynamic>")) {
            //     event.variable = llmDescription.replace("<Dynamic>", "").trim();
            // }

            // if (llmDescription.includes("<?>")) {
            //     event.isKeyboarTestUnclear = true;
            // }

            // event.keyboardTextReason = llmDescription;
            // CodeFunctions.fakeStreamText("<br><arrow>" + llmDescription);
            CodeFunctions.fakeStreamText("<keyboard> You entered the text: '" + event.keyboardText + "'");
        }

        if (event.isKeyboardEnter) {
            CodeFunctions.fakeStreamText("<keyboard>You pressing 'Enter' to go forward.");
        }

        if (event.isExit) {
            CodeFunctions.fakeStreamText("<arrow>Exiting...");
            break;
        }
    }

    CodeFunctions.replaceContentStream("<loading> <b class='ml-2'> Analyzing events...", "<check> <b class='ml-2'> Analyzed all events");

    CodeFunctions.fakeStreamText("<br> <br> <EditTaskButton id='" + mimicStore.id + "'>");

    return events;
}










