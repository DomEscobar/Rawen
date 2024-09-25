import sharp from "sharp";
import { labelImage } from "@/lib/label-image";
import { scriptPath, toBase64 } from "@/lib/utils";
import { CodeFunctions } from "@/code/client-code-functions";
const robot = require(`${scriptPath}/robotjs.js`);


export async function getWindowData() {
    try {
        const win = await CodeFunctions.getActiveWindow();

        const screenData = await CodeFunctions.getPrimaryMonitor();
        const scaleFactor = screenData.scaleFactor;
        const screenBounds = screenData.bounds;

        let mouse_position = {
            x: (robot.getMousePos().x * scaleFactor),
            y: (robot.getMousePos().y * scaleFactor)
        };

        // TODO check when mouse clicked outside of window

        let bounds = win.bounds;

        // no active window title
        console.log("win title: ", win.title);

        const blackList = ["copikitten"];
        const isBlacklisted = blackList.some((item) => win?.title?.toLowerCase().includes(item));

        if (isBlacklisted) {
            return {
                window_title: win.title,
                app_path: win.path,
                window_screenshot: undefined,
                mouse_area_screenshot: undefined,
                mouse_area_screenshot_small: undefined,
                window_bounds: bounds,
                mouse_position,
                scaleFactor,
                mouse_area_field: undefined,
                isBlacklisted
            };
        }

        if (win.title === "") {
            bounds = {
                x: 0,
                y: 0,
                width: screenBounds.width,
                height: screenBounds.height,
            };
        } else {
            mouse_position = {
                x: mouse_position.x - bounds.x,
                y: mouse_position.y - bounds.y
            }
        }

        bounds = {
            x: bounds.x * scaleFactor,
            y: bounds.y * scaleFactor,
            width: bounds.width * scaleFactor,
            height: bounds.height * scaleFactor,
        };

        if (bounds.x < 0) {
            bounds.x = 0;
        }

        if (bounds.y < 0) {
            bounds.y = 0;
        }


        // console.log("===bounds: ", bounds);
        const { image, width: cWidth, height: cHeight, bytesPerPixel, byteWidth } = robot.screen.capture(bounds.x, bounds.y, bounds.width, bounds.height);
        const channels = 3
        const uint8array = new Uint8Array(cWidth * cHeight * channels);
        for (let h = 0; h < cHeight; h += 1) {
            for (let w = 0; w < cWidth; w += 1) {
                let offset = (h * cWidth + w) * channels
                let offset2 = byteWidth * h + w * bytesPerPixel
                uint8array[offset] = image.readUInt8(offset2 + 2)
                uint8array[offset + 1] = image.readUInt8(offset2 + 1)
                uint8array[offset + 2] = image.readUInt8(offset2 + 0)
            }
        }
        const window_image = await sharp(Buffer.from(uint8array), {
            raw: {
                width: cWidth,
                height: cHeight,
                channels: 3
            }
        }).png().toBuffer();

        const winBounds = { height: bounds.height, width: bounds.width };
        // const mouse_area_field = await getMousePosAreaImgLabeled(mouse_position);
        const mouse_area_image = await getMousePosAreaImg(mouse_position, window_image, winBounds, { width: 500, height: 500 });
        const mouse_area_image_small = await getMousePosAreaImg(mouse_position, window_image, winBounds, { width: 128, height: 64 });

        return {
            window_title: win.title,
            app_path: win.path,
            window_screenshot: window_image,
            mouse_area_screenshot: mouse_area_image,
            mouse_area_screenshot_small: mouse_area_image_small,
            window_bounds: bounds,
            mouse_position,
            scaleFactor,
            mouse_area_field: undefined,
            isBlacklisted
        };
    } catch (e) {
        console.error(e);
        throw e;
    }
}


async function getMousePosAreaImg(mouse_position: { x: number, y: number }, window_image: Buffer, window_bounds: { width: number, height: number }, size: { width: number, height: number } = { width: 256, height: 100 }) {
    let x = mouse_position.x - size.width / 2;
    let y = mouse_position.y - size.height / 2;

    if (x < 0) x = 0;
    if (y < 0) y = 0;

    let width = size.width;
    let height = size.height;

    if (x + width > window_bounds.width) {
        width = window_bounds.width - x;

        if (width <= 0) {
            x = window_bounds.width - size.width;
            width = size.width;
        }
    }

    if (y + height > window_bounds.height) {
        height = window_bounds.height - y;

        if (height <= 0) {
            y = window_bounds.height - size.height;
            height = size.height;
        }
    }

    // get the mouse area
    const imgBuffer = await sharp(window_image).extract({ left: x, top: y, width, height }).png().toBuffer();
    return imgBuffer;
}

async function getMousePosAreaImgLabeled(mouse_position: { x: number, y: number }) {
    const areaOfInterest = 1024;

    const x = mouse_position.x - (areaOfInterest / 2);
    const y = mouse_position.y - (areaOfInterest / 2);
    const img = robot.screen.capture(x, y, areaOfInterest, areaOfInterest);
    const imgBuffer = await sharp(img.image, {
        raw: {
            width: img.width,
            height: img.height,
            channels: 3
        }
    }).png().toBuffer();
    const labeled = await labelImage(toBase64(imgBuffer));

    let underlyingLabel;
    const mainCenter = { x: areaOfInterest / 2, y: areaOfInterest / 2 };
    let minDistance = Infinity;
    let minArea = Infinity;


    for (let label of labeled.fields) {
        const rect = label.rect;
        const rectCenter = {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2
        };

        const distance = Math.sqrt(
            Math.pow(rectCenter.x - mainCenter.x, 2) + Math.pow(rectCenter.y - mainCenter.y, 2)
        );

        const area = rect.width * rect.height;

        if (
            distance < minDistance ||
            (distance === minDistance && area < minArea)
        ) {
            minDistance = distance;
            minArea = area;
            underlyingLabel = label;
        }
    }

    if (!underlyingLabel) return undefined;

    // cutout the underlying label eg.{ number: 7, rect: { x: 338, y: 469, width: 349, height:108 } }

    const x1 = underlyingLabel.rect.x;
    const y1 = underlyingLabel.rect.y;
    const x2 = underlyingLabel.rect.x + underlyingLabel.rect.width;
    const y2 = underlyingLabel.rect.y + underlyingLabel.rect.height;

    const cutout = robot.screen.capture(x1, y1, x2 - x1, y2 - y1);
    const cutoutBuffer = await sharp(cutout.image, {
        raw: {
            width: cutout.width,
            height: cutout.height,
            channels: 4
        }
    }).png().toBuffer();

    return cutoutBuffer;
}