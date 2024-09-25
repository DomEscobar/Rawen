// import sharp from 'sharp';

export function getNearestText(item: any, cursorPos: { x: number, y: number }, scaleFactor: number) {
    let textNearCursor;
    for (let result of item.words) {
        const tilt = 0;

        const x1 = result.bbox.x0 - tilt;
        const y1 = result.bbox.y0 - tilt;
        const x2 = result.bbox.x1 + tilt;
        const y2 = result.bbox.y1 - tilt;

        if (cursorPos.x >= x1 && cursorPos.x <= x2 && cursorPos.y >= y1 && cursorPos.y <= y2) {
            textNearCursor = result;
            break;
        }
    }

    return textNearCursor;
}

export async function drawMouseOverlay(screenshotBuffer, mouse_x?: number, mouse_y?: number) {
    const mouseOverlay = Buffer.from(
        `<svg width="" height="10">
            <circle cx="5" cy="5" r="5" fill="red" />
         </svg>`
    );

    // const redArrow = Buffer.from(
    //     `<svg width="30" height= "30">
    //         <defs>
    //             <marker id="arrow" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
    //                 <path d="M0,0 L0,6 L9,3 z" fill="red" />
    //             </marker>
    //         </defs>
    //         <path d="M0,0 L20,20" stroke="red" stroke-width="2" marker-end="url(#arrow)" />
    //     </svg>`
    // );

    const image: any = "";
    const metadata = await image.metadata();

    let centerX = Math.round(metadata.width / 2 - 5);
    let centerY = Math.round(metadata.height / 2);

    if (mouse_x && mouse_y) {
        centerX = mouse_x;
        centerY = mouse_y;
    }

    const result = await image
        .composite([
            {
                input: mouseOverlay,
                top: centerY,
                left: centerX
            },
            // {
            //     input: redArrow,
            //     top: centerY - 20,
            //     left: centerX - 20
            // }
        ])
        .toBuffer();

    return result;
}